/**
 * Organic Opportunities engine — deterministic signals, scoring and upside.
 *
 * ONE implementation. The admin UI renders what this returns; it does not
 * recompute anything. Deliberately dependency-free so it can be unit-tested
 * with `deno test` without a database, a browser or a build step.
 *
 * DATA CONTRACT (docs/growth/search-console-data-contract.md) — the rule this
 * module exists to protect:
 *
 *   page traffic  comes from PageWindow (search_console_page_canonical)
 *   site traffic  comes from search_console_totals_daily
 *   queries       are INTENT ONLY and are suppressed by Google
 *
 * Query-grain clicks and impressions never contribute to any traffic figure,
 * any score component, or any upside estimate. They only ever produce themes.
 * On this property the query grain captures ~3% of clicks, so using it as
 * traffic would understate a page roughly 30-fold — silently, because the
 * numbers look plausible.
 *
 * Nothing here writes, publishes or edits anything. It produces
 * recommendations for a human to act on.
 */

// ── Inputs ────────────────────────────────────────────────────────────────

/**
 * One row of public.geo_page_window — page-grain, the traffic truth.
 *
 * avg_position (and prev_avg_position) is the RPC contract name for the
 * impression-weighted average Search Console position over the window. The
 * raw Stage 1A column is still called `position`; the RPC cannot reuse that
 * name because POSITION is not a legal function parameter name in PostgreSQL,
 * and a RETURNS TABLE column is a parameter name.
 */
export interface PageWindow {
  page_host: string;
  page_path: string;
  page_url?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
  days_with_data: number;
  prev_clicks: number;
  prev_impressions: number;
  prev_ctr: number;
  prev_avg_position: number;
  prev_days: number;
  first_seen?: string | null;
  last_seen?: string | null;
  source_property?: string;
}

/** One row of public.geo_query_window — intent only, never traffic. */
export interface QueryRow {
  page_path: string;
  query: string;
  clicks: number;
  impressions: number;
  avg_position: number;
}

/** One row of public.geo_ga4_page_window — corroboration only. */
export interface Ga4PageRow {
  landing_page_path: string;
  sessions: number;
  users: number;
  engaged_sessions: number;
  engagement_rate: number;
  key_events: number;
  days_with_data: number;
}

/** One row of public.geo_ctr_curve. */
export interface CtrCurveRow {
  position_bucket: number;
  clicks: number;
  impressions: number;
  observations: number;
}

// ── Outputs ───────────────────────────────────────────────────────────────

export type SignalType =
  | "striking_distance"
  | "high_impressions_low_ctr"
  | "rising"
  | "declining"
  | "emerging"
  | "high_potential_winner"
  | "ctr_decline_vs_self"
  | "query_opportunity"
  | "content_gap";

export type Confidence = "high" | "medium" | "low";

export type ActionType =
  | "strengthen_page"
  | "improve_title_meta"
  | "investigate_ctr_drop"
  | "expand_section"
  | "add_faq"
  | "improve_internal_linking"
  | "consolidate_pages"
  | "investigate_decline"
  | "create_new_page";

export interface ScoreComponent {
  key: string;
  /** Hebrew label for the UI. */
  label: string;
  /** Points actually contributed. */
  points: number;
  /** Maximum this component can contribute. */
  max: number;
  /** Why it scored what it scored, in Hebrew. */
  reason: string;
}

export interface Signal {
  type: SignalType;
  /** Hebrew label. */
  label: string;
  evidence: string;
}

export interface QueryTheme {
  theme: string;
  label: string;
  queries: string[];
  impressions: number;
  clicks: number;
  bestPosition: number;
}

export interface Recommendation {
  action: ActionType;
  label: string;
  /** The observation that produced this recommendation. */
  evidence: string;
}

export interface UpsideEstimate {
  /** Conservative incremental clicks per window. Null when data is insufficient. */
  incrementalClicks: number | null;
  targetPosition: number | null;
  /**
   * True when the target CTR came from the assumed fallback curve rather than
   * this site's own data. Such an estimate is still shown, but must be
   * presented as an assumption and never as evidence.
   */
  basedOnAssumedCtr: boolean;
  assumptions: string;
}

export interface Opportunity {
  pageHost: string;
  pagePath: string;
  pageUrl?: string;
  score: number;
  scoreComponents: ScoreComponent[];
  confidence: Confidence;
  confidenceReasons: string[];
  signals: Signal[];
  /** Page-grain truth. */
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  daysWithData: number;
  trend: {
    impressionsChangePct: number | null;
    clicksChangePct: number | null;
    positionChange: number | null;
    prevImpressions: number;
    prevClicks: number;
  };
  upside: UpsideEstimate;
  /** Provenance of the CTR benchmark used for this page. */
  ctrBenchmarkSource: CtrBenchmarkSource;
  ctrBenchmarkNote: string;
  ga4: Ga4PageRow | null;
  ga4Note: string;
  /** Suppressed. Intent only. Never traffic. */
  knownQueries: {
    themes: QueryTheme[];
    totalKnownImpressions: number;
    totalKnownClicks: number;
    note: string;
  };
  recommendations: Recommendation[];
}

// ── Tunable thresholds, all in one place ──────────────────────────────────

export const THRESHOLDS = {
  /** Below this, a page produces no signals at all — too small to act on. */
  minImpressionsForSignal: 30,
  /** Striking distance band. */
  strikingMinPosition: 4,
  strikingMaxPosition: 15,
  /** CTR opportunity needs volume before the ratio means anything. */
  ctrMinImpressions: 50,
  /** Actual CTR below this fraction of expected counts as an opportunity. */
  ctrShortfallRatio: 0.6,
  /**
   * Ceiling on the CTR score contribution when the benchmark is an assumed
   * fallback rather than this site's own data. Keeps an assumption from
   * driving the ranking.
   */
  ctrFallbackMaxPoints: 5,
  /** CTR below this fraction of the page's OWN previous window is evidence. */
  ctrSelfDropRatio: 0.7,
  /** Trend needs a real base in the previous window. */
  trendMinPrevImpressions: 20,
  risingRatio: 1.25,
  decliningRatio: 0.75,
  /** Emerging: essentially invisible before, visible now. */
  emergingMaxPrevImpressions: 5,
  emergingMinImpressions: 25,
  /** High-potential winner. */
  winnerMinImpressions: 100,
  winnerMinPosition: 5,
  winnerMaxPosition: 20,
  /**
   * Confidence gates. Impression floors are absolute; day requirements are a
   * FRACTION of the window, because "14 days of data" means something very
   * different in a 7-day window than in a 90-day one.
   */
  highConfMinImpressions: 100,
  highConfDayCoverage: 0.5,
  mediumConfMinImpressions: 30,
  mediumConfDayCoverage: 0.25,
  /** Upside is only estimated with enough evidence. */
  upsideMinImpressions: 50,
  upsideMinDays: 7,
  /** Site-specific CTR curve needs this much per bucket to be trusted. */
  curveMinImpressionsPerBucket: 200,
  /** Haircut applied to raw upside arithmetic. */
  upsideConservatismFactor: 0.5,
} as const;

/**
 * Fallback expected-CTR curve by rounded position.
 *
 * ASSUMPTION, STATED EXPLICITLY: these are deliberately conservative values in
 * the range commonly observed for informational queries. They are NOT derived
 * from this site and are NOT a published industry standard. They are used only
 * when the site's own data has too little volume in a position bucket, and any
 * upside computed from them is marked accordingly.
 */
export const FALLBACK_CTR_CURVE: Record<number, number> = {
  1: 0.25, 2: 0.15, 3: 0.10, 4: 0.075, 5: 0.06,
  6: 0.05, 7: 0.04, 8: 0.033, 9: 0.028, 10: 0.024,
  11: 0.02, 12: 0.018, 13: 0.016, 14: 0.014, 15: 0.013,
  16: 0.011, 17: 0.010, 18: 0.009, 19: 0.008, 20: 0.007,
  21: 0.005,
};

/** Where the expected-CTR number for a given position actually came from. */
export type CtrBenchmarkSource = "first_party" | "fallback" | "insufficient";

export interface ExpectedCtrModel {
  ctrAt(position: number): number;
  /** Expected CTR together with its provenance for THIS position bucket. */
  benchmarkAt(position: number): { ctr: number; source: "first_party" | "fallback" };
  /** Which buckets came from this site's own data. */
  siteDerivedBuckets: number[];
  source: "site" | "fallback" | "mixed";
}

/**
 * Build the expected-CTR model, preferring the site's own observed behaviour
 * and falling back per bucket where the sample is too thin. Mixing at bucket
 * level rather than all-or-nothing keeps the well-evidenced positions honest
 * without discarding them because some other bucket is sparse.
 */
export function buildExpectedCtrModel(curve: CtrCurveRow[]): ExpectedCtrModel {
  const siteCtr = new Map<number, number>();
  for (const row of curve) {
    if (row.impressions >= THRESHOLDS.curveMinImpressionsPerBucket && row.impressions > 0) {
      siteCtr.set(row.position_bucket, row.clicks / row.impressions);
    }
  }
  const siteDerivedBuckets = [...siteCtr.keys()].sort((a, b) => a - b);
  const source: ExpectedCtrModel["source"] =
    siteDerivedBuckets.length === 0
      ? "fallback"
      : siteDerivedBuckets.length >= 10
        ? "site"
        : "mixed";

  const benchmarkAt = (position: number) => {
    const bucket = Math.min(Math.max(Math.round(position) || 1, 1), 21);
    const site = siteCtr.get(bucket);
    if (site !== undefined) return { ctr: site, source: "first_party" as const };
    return {
      ctr: FALLBACK_CTR_CURVE[bucket] ?? FALLBACK_CTR_CURVE[21],
      source: "fallback" as const,
    };
  };

  return {
    siteDerivedBuckets,
    source,
    benchmarkAt,
    ctrAt: (position: number) => benchmarkAt(position).ctr,
  };
}

// ── Query themes (deterministic, no external AI) ──────────────────────────

/**
 * Hebrew keyword -> theme. Deterministic and inspectable on purpose: a
 * dashboard that groups searches has to be explainable, and Stage 1B must work
 * without any external API.
 */
const THEME_RULES: { theme: string; label: string; keywords: string[] }[] = [
  { theme: "tahini", label: "טחינה ושומשום", keywords: ["טחינה", "שומשום", "סומסום"] },
  { theme: "peanut", label: "בוטנים ובמבה", keywords: ["בוטן", "בוטנים", "במבה"] },
  { theme: "milk", label: "חלב", keywords: ["חלב", "חלבון חלב", "פרווה"] },
  { theme: "egg", label: "ביצה", keywords: ["ביצה", "ביצים"] },
  { theme: "introduction", label: "טעימות וחשיפה לאלרגנים", keywords: ["טעימ", "חשיפה", "הכנס", "גיל", "תינוק", "חודשים"] },
  { theme: "testing", label: "בדיקות ואבחון", keywords: ["בדיקה", "בדיקות", "תבחין", "דקירה", "תגר", "אבחון", "בדיקת דם"] },
  { theme: "rights", label: "זכויות, גן ובית ספר", keywords: ["זכוי", "גן ", "גן_", "בית ספר", "אפיפן", "סייעת", "משרד החינוך", "טיול"] },
  { theme: "anaphylaxis", label: "אנפילקסיס וחירום", keywords: ["אנפילקס", "אדרנלין", "אפיפן", "תגובה חמורה"] },
  { theme: "eczema", label: "אקזמה ועור", keywords: ["אקזמ", "אטופי", "פריחה", "אודם", "חרלת", "אורטיקריה"] },
  { theme: "asthma", label: "אסתמה ונשימה", keywords: ["אסתמ", "שיעול", "נשימה", "צפצוף"] },
  { theme: "rhinitis", label: "נזלת ואלרגיה עונתית", keywords: ["נזלת", "אבקן", "עונתי", "גרד בעיניים"] },
  { theme: "immunotherapy", label: "אימונותרפיה וחיסון", keywords: ["אימונותרפ", "חיסון", "דה-סנסיטיז", "דסנסיטיז"] },
  { theme: "clinic", label: "מרפאה ורופא", keywords: ["ד\"ר", "ד״ר", "ברמלי", "אלרגולוג", "מרפאה", "תור", "רופא"] },
];

export function classifyQuery(query: string): { theme: string; label: string } {
  const q = query.toLowerCase();
  for (const rule of THEME_RULES) {
    if (rule.keywords.some((k) => q.includes(k.toLowerCase()))) {
      return { theme: rule.theme, label: rule.label };
    }
  }
  return { theme: "other", label: "אחר" };
}

export function groupQueryThemes(rows: QueryRow[]): QueryTheme[] {
  const map = new Map<string, QueryTheme>();
  for (const row of rows) {
    const { theme, label } = classifyQuery(row.query);
    const existing = map.get(theme);
    if (existing) {
      existing.queries.push(row.query);
      existing.impressions += row.impressions;
      existing.clicks += row.clicks;
      existing.bestPosition = Math.min(existing.bestPosition, row.avg_position || 99);
    } else {
      map.set(theme, {
        theme,
        label,
        queries: [row.query],
        impressions: row.impressions,
        clicks: row.clicks,
        bestPosition: row.avg_position || 99,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.impressions - a.impressions);
}

// ── Helpers ───────────────────────────────────────────────────────────────

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

// ── Confidence ────────────────────────────────────────────────────────────

/**
 * Confidence is about how much we should trust the recommendation, and is
 * driven by sample size first. A tiny sample can never be high confidence, no
 * matter how dramatic the percentage change looks.
 */
export function assessConfidence(
  page: PageWindow,
  ga4: Ga4PageRow | null,
  windowDays = 28,
  ctrAssessment?: CtrAssessment,
): { confidence: Confidence; reasons: string[] } {
  const reasons: string[] = [];
  let confidence: Confidence;

  const coverage = windowDays > 0 ? page.days_with_data / windowDays : 0;
  const coveragePct = Math.round(coverage * 100);

  if (
    page.impressions >= THRESHOLDS.highConfMinImpressions &&
    coverage >= THRESHOLDS.highConfDayCoverage
  ) {
    confidence = "high";
    reasons.push(
      `נפח מספיק: ${page.impressions} חשיפות על פני ${page.days_with_data} מתוך ${windowDays} ימים (${coveragePct}% כיסוי)`,
    );
  } else if (
    page.impressions >= THRESHOLDS.mediumConfMinImpressions &&
    coverage >= THRESHOLDS.mediumConfDayCoverage
  ) {
    confidence = "medium";
    reasons.push(
      `נפח בינוני: ${page.impressions} חשיפות, ${page.days_with_data} מתוך ${windowDays} ימים (${coveragePct}% כיסוי)`,
    );
  } else {
    confidence = "low";
    reasons.push(
      `מדגם קטן מדי לביטחון גבוה: ${page.impressions} חשיפות, ${page.days_with_data} מתוך ${windowDays} ימים (${coveragePct}% כיסוי)`,
    );
  }

  // GA4 can corroborate but never upgrade past the sample-size gate above.
  if (ga4 && ga4.sessions > 0) {
    reasons.push(`GA4 מאשר תנועה בפועל: ${ga4.sessions} סשנים אורגניים`);
  } else if (ga4 === null) {
    reasons.push("אין נתוני GA4 תואמים לעמוד הזה — לא נזקף לחובתו");
  } else if (page.clicks >= 5 && ga4.sessions === 0) {
    // Contradiction worth flagging, but timezone skew alone can explain a
    // small gap, so this caps rather than condemns.
    if (confidence === "high") confidence = "medium";
    reasons.push(
      `סתירה: ${page.clicks} קליקים ב-Search Console אך 0 סשנים ב-GA4 — ייתכן הפרש אזור זמן או בעיית מדידה`,
    );
  }

  // A CTR judgement resting only on an assumed curve must not be reported at
  // high confidence, even when the page has plenty of impressions.
  if (
    ctrAssessment &&
    ctrAssessment.benchmarkSource === "fallback" &&
    !ctrAssessment.hasSelfComparisonEvidence
  ) {
    reasons.push(ctrAssessment.note);
  }

  reasons.push(
    "נתוני שאילתות מוגבלים בשל הסתרת שאילתות נדירות ע\"י גוגל — לא שימשו לחישוב תנועה",
  );

  return { confidence, reasons };
}

// ── Signals ───────────────────────────────────────────────────────────────

export function detectSignals(
  page: PageWindow,
  expected: ExpectedCtrModel,
  ctrAssessment?: CtrAssessment,
): Signal[] {
  const signals: Signal[] = [];
  if (page.impressions < THRESHOLDS.minImpressionsForSignal) return signals;

  const assessment = ctrAssessment ?? assessCtr(page, expected);

  if (
    page.avg_position >= THRESHOLDS.strikingMinPosition &&
    page.avg_position <= THRESHOLDS.strikingMaxPosition
  ) {
    signals.push({
      type: "striking_distance",
      label: "מרחק נגיעה",
      evidence: `מיקום ממוצע ${round(page.avg_position, 1)} עם ${page.impressions} חשיפות — שיפור צנוע בדירוג עשוי להניב קליקים`,
    });
  }

  // Only raise a CTR shortfall when there is real evidence for it. Without
  // first-party data or a self-comparison the "expected" figure is an outside
  // assumption, and flagging a page on that alone is a false positive.
  if (
    page.impressions >= THRESHOLDS.ctrMinImpressions &&
    page.avg_position <= 20 &&
    assessment.evidencedShortfallRatio !== null &&
    assessment.evidencedShortfallRatio < THRESHOLDS.ctrShortfallRatio
  ) {
    signals.push({
      type: "high_impressions_low_ctr",
      label: "CTR נמוך ביחס למיקום",
      evidence:
        `CTR בפועל ${round(page.ctr * 100, 2)}% מול ${round((assessment.expectedCtr ?? 0) * 100, 2)}% צפוי ` +
        `במיקום ${round(page.avg_position, 1)}. ${assessment.note}`,
    });
  }

  // A material CTR drop against the page's OWN previous window is evidence in
  // its own right and needs no curve. It is reported separately from
  // high_impressions_low_ctr on purpose: a page can beat the expected CTR for
  // its position and still have lost a third of its CTR against itself, and
  // calling that "low CTR for this position" would be untrue.
  if (
    page.impressions >= THRESHOLDS.ctrMinImpressions &&
    assessment.hasSelfComparisonEvidence &&
    assessment.selfShortfallRatio !== null
  ) {
    const dropPct = round((1 - assessment.selfShortfallRatio) * 100, 0);
    const posMove = round(page.prev_avg_position - page.avg_position, 2);
    const posNote =
      page.prev_avg_position > 0 && page.avg_position > 0
        ? posMove > 0
          ? ` המיקום דווקא השתפר ב-${round(posMove, 2)} (${round(page.prev_avg_position, 2)} ← ${round(page.avg_position, 2)}), ולכן הירידה אינה מוסברת בדירוג.`
          : posMove < 0
            ? ` המיקום נחלש ב-${round(Math.abs(posMove), 2)} (${round(page.prev_avg_position, 2)} ← ${round(page.avg_position, 2)}), מה שעשוי להסביר חלק מהירידה.`
            : ""
        : "";
    signals.push({
      type: "ctr_decline_vs_self",
      label: "ירידת CTR מול ההיסטוריה של העמוד",
      evidence:
        `CTR ${round(page.prev_ctr * 100, 2)}% ← ${round(page.ctr * 100, 2)}% ` +
        `(ירידה של ${dropPct}%) על בסיס ${page.prev_impressions} חשיפות בתקופה הקודמת.` +
        posNote,
    });
  }

  const impChange = pctChange(page.impressions, page.prev_impressions);
  if (
    page.prev_impressions >= THRESHOLDS.trendMinPrevImpressions &&
    page.impressions >= page.prev_impressions * THRESHOLDS.risingRatio
  ) {
    signals.push({
      type: "rising",
      label: "במגמת עלייה",
      evidence: `חשיפות ${page.prev_impressions} ← ${page.impressions} (${impChange === null ? "" : round(impChange, 0) + "%"}) מול התקופה הקודמת`,
    });
  }

  if (
    page.prev_impressions >= THRESHOLDS.trendMinPrevImpressions &&
    page.impressions <= page.prev_impressions * THRESHOLDS.decliningRatio
  ) {
    signals.push({
      type: "declining",
      label: "במגמת ירידה",
      evidence: `חשיפות ${page.prev_impressions} ← ${page.impressions} (${impChange === null ? "" : round(impChange, 0) + "%"}) מול התקופה הקודמת`,
    });
  }

  if (
    page.prev_impressions <= THRESHOLDS.emergingMaxPrevImpressions &&
    page.impressions >= THRESHOLDS.emergingMinImpressions
  ) {
    signals.push({
      type: "emerging",
      label: "נראות חדשה",
      evidence: `כמעט ללא נראות בתקופה הקודמת (${page.prev_impressions} חשיפות), כעת ${page.impressions}`,
    });
  }

  if (
    page.impressions >= THRESHOLDS.winnerMinImpressions &&
    page.avg_position >= THRESHOLDS.winnerMinPosition &&
    page.avg_position <= THRESHOLDS.winnerMaxPosition
  ) {
    signals.push({
      type: "high_potential_winner",
      label: "פוטנציאל גבוה",
      evidence: `${page.impressions} חשיפות במיקום ${round(page.avg_position, 1)} — נפח משמעותי סביב גבול עמוד ראשון/שני`,
    });
  }

  return signals;
}

// ── Score ─────────────────────────────────────────────────────────────────

/**
 * Position opportunity curve, 0-30 points.
 *
 * Peaks in the 6-12 band and collapses to almost nothing at positions 1-2,
 * because a page already ranking first has little headroom left. This is what
 * makes a position-8 page with real volume outrank a position-1 page — which
 * is the explicit design requirement.
 */
function positionOpportunityPoints(position: number): { points: number; reason: string } {
  if (position <= 0) return { points: 0, reason: "אין נתוני מיקום" };
  if (position <= 2) {
    return { points: 2, reason: `מיקום ${round(position, 1)} — כבר בצמרת, מעט מקום לשיפור` };
  }
  if (position <= 3) {
    return { points: 10, reason: `מיקום ${round(position, 1)} — קרוב לצמרת` };
  }
  if (position <= 5) {
    return { points: 22, reason: `מיקום ${round(position, 1)} — בטווח שיפור טוב` };
  }
  if (position <= 12) {
    return { points: 30, reason: `מיקום ${round(position, 1)} — הטווח בעל הפוטנציאל הגבוה ביותר` };
  }
  if (position <= 20) {
    return { points: 18, reason: `מיקום ${round(position, 1)} — עמוד שני, שיפור אפשרי אך ארוך יותר` };
  }
  if (position <= 30) {
    return { points: 8, reason: `מיקום ${round(position, 1)} — רחוק מעמוד ראשון` };
  }
  return { points: 3, reason: `מיקום ${round(position, 1)} — רחוק מאוד` };
}

/**
 * Impression opportunity, 0-25 points, log-scaled.
 *
 * Log scaling is deliberate: on a linear scale the homepage's volume would
 * dominate every list regardless of headroom, which is exactly the failure the
 * brief asks us to avoid.
 */
function impressionPoints(impressions: number): { points: number; reason: string } {
  if (impressions <= 0) return { points: 0, reason: "אין חשיפות" };
  // 10 impressions -> ~6, 100 -> ~12.5, 1000 -> ~19, 10000 -> ~25
  const points = Math.min(25, Math.max(0, (Math.log10(impressions) / 4) * 25));
  return {
    points: round(points, 1),
    reason: `${impressions} חשיפות בתקופה (סולם לוגריתמי כדי לא להעדיף אוטומטית עמודים גדולים)`,
  };
}

/**
 * How much we are entitled to say about this page's CTR, and on what basis.
 *
 * The distinction matters: an assumed external curve is not evidence about
 * THIS site. Judging the homepage's 6.67% CTR against an assumed 25% at
 * position 1 produced exactly the false positive this function exists to
 * prevent.
 *
 * Two things count as real evidence:
 *   first_party  the site's own observed CTR in this position bucket
 *   self         the page's own previous window - a material CTR drop against
 *                its own history needs no external benchmark at all
 */
export interface CtrAssessment {
  benchmarkSource: CtrBenchmarkSource;
  expectedCtr: number | null;
  /**
   * Current CTR as a fraction of the position-bucket benchmark. This is a
   * CURVE ratio: when the curve is the assumed fallback it is not evidence
   * about this site, and it says nothing about the page's own history.
   */
  shortfallRatio: number | null;
  /**
   * Current CTR as a fraction of the page's OWN previous-window CTR. Null when
   * there is no usable base. This is the magnitude behind
   * hasSelfComparisonEvidence, and it is independent of any curve.
   */
  selfShortfallRatio: number | null;
  /**
   * The ratio that may actually be acted on: the strongest ratio that rests on
   * real evidence about this site (first-party curve and/or own history). Null
   * when neither evidence path applies, in which case only the capped
   * assumption-based contribution is available. Signals, scoring and
   * recommendations all gate on THIS, never on shortfallRatio directly.
   */
  evidencedShortfallRatio: number | null;
  /** True only when the shortfall rests on real first-party evidence. */
  hasFirstPartyEvidence: boolean;
  /** The page's CTR fell materially against its own previous window. */
  hasSelfComparisonEvidence: boolean;
  note: string;
}

export function assessCtr(page: PageWindow, expected: ExpectedCtrModel): CtrAssessment {
  if (page.impressions < THRESHOLDS.ctrMinImpressions) {
    return {
      benchmarkSource: "insufficient",
      expectedCtr: null,
      shortfallRatio: null,
      selfShortfallRatio: null,
      evidencedShortfallRatio: null,
      hasFirstPartyEvidence: false,
      hasSelfComparisonEvidence: false,
      note: `אין מספיק חשיפות (${page.impressions}) להערכת CTR`,
    };
  }

  const { ctr: expectedCtr, source } = expected.benchmarkAt(page.avg_position);
  const shortfallRatio = expectedCtr > 0 ? page.ctr / expectedCtr : null;

  // Self-comparison: needs a real previous base, and a material drop.
  // The base is the PREVIOUS window's impressions, because that is the window
  // whose CTR we are treating as the comparison point.
  const hasSelfBase =
    page.prev_impressions >= THRESHOLDS.ctrMinImpressions && page.prev_ctr > 0;
  const selfShortfallRatio = hasSelfBase ? page.ctr / page.prev_ctr : null;
  const hasSelfComparisonEvidence =
    selfShortfallRatio !== null && selfShortfallRatio < THRESHOLDS.ctrSelfDropRatio;

  const hasFirstPartyEvidence = source === "first_party";

  // The ratio that may be acted on. Each evidence path carries its OWN
  // magnitude: a first-party curve gives a curve ratio, the page's own history
  // gives a self ratio. Taking the strongest (lowest) of the ratios that are
  // actually evidenced is what stops a fallback curve from silently deciding
  // the question — the previous implementation only ever measured against the
  // curve, so a page over-performing an ASSUMED curve could never register a
  // real, evidenced collapse against its own history.
  const evidencedRatios: number[] = [];
  if (hasFirstPartyEvidence && shortfallRatio !== null) evidencedRatios.push(shortfallRatio);
  if (hasSelfComparisonEvidence && selfShortfallRatio !== null) {
    evidencedRatios.push(selfShortfallRatio);
  }
  const evidencedShortfallRatio =
    evidencedRatios.length > 0 ? Math.min(...evidencedRatios) : null;

  const note = hasFirstPartyEvidence
    ? `הציפייה מבוססת על נתוני האתר עצמו במיקום ${round(page.avg_position, 1)}`
    : hasSelfComparisonEvidence
      ? "אין מספיק נתוני CTR של האתר במיקום זה — ההשוואה נשענת על ההיסטוריה של העמוד עצמו"
      : `אין מספיק נתוני CTR של האתר במיקום ${round(page.avg_position, 1)} — ערך הייחוס הוא הנחה חיצונית ולא ראיה על האתר`;

  return {
    benchmarkSource: source,
    expectedCtr,
    shortfallRatio,
    selfShortfallRatio,
    evidencedShortfallRatio,
    hasFirstPartyEvidence,
    hasSelfComparisonEvidence,
    note,
  };
}

/**
 * CTR contribution to the score.
 *
 * With first-party evidence the full 0-20 range is available. Without it the
 * contribution is capped at ctrFallbackMaxPoints, so an assumed benchmark can
 * nudge the ranking but can never drive it.
 */
function ctrPoints(
  page: PageWindow,
  assessment: CtrAssessment,
): { points: number; reason: string } {
  if (assessment.benchmarkSource === "insufficient") {
    return { points: 0, reason: assessment.note };
  }

  const evidenced = assessment.hasFirstPartyEvidence || assessment.hasSelfComparisonEvidence;

  // Score the strongest EVIDENCED shortfall. Falling back to the curve ratio
  // only when nothing is evidenced is what keeps an assumed curve capped, and
  // measuring the evidenced ratio here is what lets a page that beats the
  // assumed curve still be scored on a real collapse against its own history.
  const ratio = evidenced ? assessment.evidencedShortfallRatio : assessment.shortfallRatio;
  if (ratio === null) return { points: 0, reason: assessment.note };

  if (ratio >= 1) {
    return {
      points: 0,
      reason: `CTR ${round(page.ctr * 100, 2)}% עומד בציפייה או עולה עליה`,
    };
  }

  const raw = Math.min(20, (1 - ratio) * 20);
  const points = evidenced ? raw : Math.min(THRESHOLDS.ctrFallbackMaxPoints, raw);
  const gap = round((1 - ratio) * 100, 0);

  // Name the base the gap was actually measured against, so the number in the
  // UI can always be reconstructed from what is written next to it.
  const selfDrove =
    evidenced && assessment.selfShortfallRatio !== null && ratio === assessment.selfShortfallRatio;
  const base = selfDrove
    ? `CTR ${round(page.ctr * 100, 2)}% מול ${round(page.prev_ctr * 100, 2)}% בתקופה הקודמת — ירידה של ${gap}%`
    : `CTR ${round(page.ctr * 100, 2)}% מול ${round((assessment.expectedCtr ?? 0) * 100, 2)}% צפוי — פער של ${gap}%`;

  return {
    points: round(points, 1),
    reason: evidenced
      ? `${base}. ${assessment.note}`
      : `${base}. ${assessment.note} — לכן התרומה לניקוד הוגבלה ל-${THRESHOLDS.ctrFallbackMaxPoints} נק' בלבד`,
  };
}

/**
 * Trend contribution, symmetric about a neutral midpoint of 5/10.
 *
 * Flat is NOT growth. A stable high-volume page should not collect trend
 * points it did not earn, or it starts outranking pages with real headroom.
 * The mapping, by change in impressions against the previous equal window:
 *
 *     >= +50%   10    strong rise
 *   +25..+50%    8    clear rise
 *   +10..+25%  6.5    mild rise
 *   -10..+10%    5    flat - neutral midpoint, no credit either way
 *   -25..-10%  3.5    mild decline
 *   -50..-25%    2    clear decline
 *     <= -50%     1    steep decline
 *
 * No comparable base -> 5, the same neutral midpoint, so an unmeasurable
 * trend neither helps nor hurts.
 */
function trendPoints(page: PageWindow): { points: number; reason: string } {
  const change = pctChange(page.impressions, page.prev_impressions);
  if (change === null || page.prev_impressions < THRESHOLDS.trendMinPrevImpressions) {
    return { points: 5, reason: "אין בסיס השוואה מספק — ניקוד ניטרלי (5/10)" };
  }
  const pctText = `${change > 0 ? "+" : ""}${round(change, 0)}%`;
  if (change >= 50) return { points: 10, reason: `חשיפות ${pctText} — מומנטום חזק` };
  if (change >= 25) return { points: 8, reason: `חשיפות ${pctText} — עלייה ברורה` };
  if (change >= 10) return { points: 6.5, reason: `חשיפות ${pctText} — עלייה מתונה` };
  if (change > -10) return { points: 5, reason: `חשיפות ${pctText} — יציב, ללא זכות ניקוד לכאן או לכאן` };
  if (change > -25) return { points: 3.5, reason: `חשיפות ${pctText} — ירידה מתונה` };
  if (change > -50) return { points: 2, reason: `חשיפות ${pctText} — ירידה ברורה` };
  return { points: 1, reason: `חשיפות ${pctText} — ירידה חדה, נדרשת בדיקה` };
}

function existingClicksPoints(clicks: number): { points: number; reason: string } {
  if (clicks <= 0) {
    return { points: 0, reason: "אין קליקים בתקופה — הפוטנציאל תיאורטי יותר" };
  }
  const points = Math.min(10, Math.log10(clicks + 1) * 7);
  return {
    points: round(points, 1),
    reason: `${clicks} קליקים בפועל — העמוד כבר מוכיח יכולת להמיר חשיפות`,
  };
}

function sampleSizePoints(
  page: PageWindow,
  windowDays: number,
): { points: number; reason: string } {
  const coverage = windowDays > 0 ? page.days_with_data / windowDays : 0;
  if (coverage >= THRESHOLDS.highConfDayCoverage) {
    return {
      points: 5,
      reason: `${page.days_with_data}/${windowDays} ימים עם נתונים — מדגם יציב`,
    };
  }
  if (coverage >= THRESHOLDS.mediumConfDayCoverage) {
    return { points: 3, reason: `${page.days_with_data}/${windowDays} ימים עם נתונים` };
  }
  return { points: 1, reason: `${page.days_with_data}/${windowDays} ימים בלבד — מדגם דל` };
}

/** Confidence multiplies the final score so small samples cannot top the list. */
export const CONFIDENCE_FACTOR: Record<Confidence, number> = {
  high: 1.0,
  medium: 0.85,
  low: 0.6,
};

export function scoreOpportunity(
  page: PageWindow,
  expected: ExpectedCtrModel,
  confidence: Confidence,
  windowDays = 28,
  ctrAssessment?: CtrAssessment,
): { score: number; components: ScoreComponent[] } {
  const assessment = ctrAssessment ?? assessCtr(page, expected);
  const imp = impressionPoints(page.impressions);
  const pos = positionOpportunityPoints(page.avg_position);
  const ctr = ctrPoints(page, assessment);
  const trend = trendPoints(page);
  const clicks = existingClicksPoints(page.clicks);
  const sample = sampleSizePoints(page, windowDays);

  const components: ScoreComponent[] = [
    { key: "impressions", label: "נפח חשיפות", points: imp.points, max: 25, reason: imp.reason },
    { key: "position", label: "פוטנציאל מיקום", points: pos.points, max: 30, reason: pos.reason },
    { key: "ctr", label: "פער CTR", points: ctr.points, max: 20, reason: ctr.reason },
    { key: "trend", label: "מגמה", points: trend.points, max: 10, reason: trend.reason },
    { key: "clicks", label: "קליקים קיימים", points: clicks.points, max: 10, reason: clicks.reason },
    { key: "sample", label: "גודל מדגם", points: sample.points, max: 5, reason: sample.reason },
  ];

  const raw = components.reduce((sum, c) => sum + c.points, 0);
  const factor = CONFIDENCE_FACTOR[confidence];
  const score = Math.max(0, Math.min(100, Math.round(raw * factor)));

  // This row carries the ADJUSTMENT the multiplier produced, not the
  // multiplier itself, so that the component points still sum to the score.
  // At high confidence the multiplier is 1.0 and the adjustment is therefore
  // legitimately 0 - the label says "adjustment" so that reads as arithmetic
  // rather than as a multiplier of zero.
  components.push({
    key: "confidence_factor",
    label: "התאמת ביטחון",
    points: round(raw * factor - raw, 1),
    max: 0,
    reason: `ביטחון ${confidence} → מכפיל ${factor} (${round(raw, 1)} → ${score})`,
  });

  return { score, components };
}

// ── Upside ────────────────────────────────────────────────────────────────

/**
 * Conservative incremental-click estimate. AN ESTIMATE, NOT A PREDICTION.
 *
 * Method, stated so it can be argued with:
 *   1. Target position = three places better than current, floored at 3. We do
 *      not model reaching position 1 — that is not a realistic default.
 *   2. Incremental clicks = impressions x (expectedCTR(target) - actualCTR).
 *   3. Halved (upsideConservatismFactor) because impressions are themselves a
 *      function of position and the arithmetic ignores competitive response.
 *   4. Suppressed entirely below the volume and day thresholds.
 */
export function estimateUpside(
  page: PageWindow,
  expected: ExpectedCtrModel,
  windowDays = 28,
): UpsideEstimate {
  if (
    page.impressions < THRESHOLDS.upsideMinImpressions ||
    page.days_with_data < Math.min(THRESHOLDS.upsideMinDays, windowDays) ||
    page.avg_position <= 0
  ) {
    return {
      incrementalClicks: null,
      targetPosition: null,
      basedOnAssumedCtr: false,
      assumptions: "אין מספיק נתונים להערכה שמרנית — לא הוצגה הערכה",
    };
  }

  // A page already at or near the top has no ranking headroom to model, and
  // the expected-CTR curve is least reliable exactly there. Without this guard
  // a page at position 1.5 gets a "target" of 3 - i.e. an upside for ranking
  // WORSE - which is nonsense.
  if (page.avg_position <= 3) {
    return {
      incrementalClicks: 0,
      targetPosition: null,
      basedOnAssumedCtr: false,
      assumptions:
        `העמוד כבר במיקום ${round(page.avg_position, 1)} — אין מרווח דירוג משמעותי למדל, ` +
        "ולכן לא חושב אפסייד משיפור מיקום. שיפור CTR עשוי עדיין להועיל.",
    };
  }

  const target = Math.max(3, round(page.avg_position - 3, 1));
  const targetBenchmark = expected.benchmarkAt(target);
  const basedOnAssumedCtr = targetBenchmark.source === "fallback";
  if (target >= page.avg_position) {
    return {
      incrementalClicks: 0,
      targetPosition: null,
      basedOnAssumedCtr: false,
      assumptions: "יעד הדירוג אינו טוב מהמיקום הנוכחי — לא חושב אפסייד.",
    };
  }
  const targetCtr = targetBenchmark.ctr;
  const gain = (targetCtr - page.ctr) * page.impressions * THRESHOLDS.upsideConservatismFactor;

  if (gain <= 0) {
    return {
      incrementalClicks: 0,
      targetPosition: target,
      basedOnAssumedCtr,
      assumptions:
        `CTR הנוכחי כבר עומד בציפייה למיקום ${target} — אין אפסייד מחושב משיפור דירוג בלבד`,
    };
  }

  const curveNote =
    expected.source === "site"
      ? "עקומת CTR שנגזרה מנתוני האתר עצמו"
      : expected.source === "mixed"
        ? "עקומת CTR מעורבת: נתוני האתר במקומות עם נפח מספיק, אחרת ערכי בסיס שמרניים"
        : "ערכי CTR בסיסיים שמרניים (לא נגזרו מהאתר) — ודאות נמוכה יותר";

  return {
    incrementalClicks: Math.round(gain),
    targetPosition: target,
    basedOnAssumedCtr,
    assumptions:
      (basedOnAssumedCtr ? "⚠ הנחה, לא ראיה על האתר: " : "") +
      `הערכה שמרנית: מעבר ממיקום ${round(page.avg_position, 1)} ל-${target}, ` +
      `${curveNote}, כפול מקדם שמרנות ${THRESHOLDS.upsideConservatismFactor}. ` +
      "הערכה בלבד — לא תחזית, ואינה מביאה בחשבון תגובת מתחרים.",
  };
}

// ── Recommendations ───────────────────────────────────────────────────────

export function buildRecommendations(
  page: PageWindow,
  signals: Signal[],
  themes: QueryTheme[],
  ctrAssessment?: CtrAssessment,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const has = (t: SignalType) => signals.some((s) => s.type === t);

  // A rewrite recommendation must rest on evidence about THIS site: either the
  // site's own CTR curve for this position, or the page's own history. An
  // assumed external curve is not sufficient grounds to tell someone to
  // rewrite a page that may be performing perfectly well.
  const ctrEvidenced =
    ctrAssessment?.hasFirstPartyEvidence || ctrAssessment?.hasSelfComparisonEvidence;

  const recommendedRewrite = has("high_impressions_low_ctr") && ctrEvidenced;

  if (recommendedRewrite) {
    const s = signals.find((x) => x.type === "high_impressions_low_ctr")!;
    recs.push({
      action: "improve_title_meta",
      label: "לשפר כותרת ותיאור מטא",
      evidence: s.evidence,
    });
  }

  // A CTR drop against the page's own history is real evidence that something
  // changed, but it does NOT on its own say the title is the thing that is
  // wrong: the SERP layout, a new competitor, or a shift in the query mix all
  // produce the same shape. So the default action is to look, not to rewrite.
  // A rewrite is only recommended when the shortfall also shows up against a
  // benchmark, which is the stronger evidence — and then this is redundant.
  if (has("ctr_decline_vs_self") && !recommendedRewrite) {
    const s = signals.find((x) => x.type === "ctr_decline_vs_self")!;
    recs.push({
      action: "investigate_ctr_drop",
      label: "לבדוק SERP, כותרת, תיאור והרכב שאילתות",
      evidence:
        `${s.evidence} יש לבחון את תוצאת החיפוש בפועל, את הכותרת והתיאור, ` +
        `ואת הרכב השאילתות — לפני כל שינוי תוכן.`,
    });
  }

  if (has("striking_distance") || has("high_potential_winner")) {
    const s = signals.find(
      (x) => x.type === "high_potential_winner" || x.type === "striking_distance",
    )!;
    recs.push({
      action: "strengthen_page",
      label: "לחזק את העמוד הקיים",
      evidence: s.evidence,
    });
  }

  const topTheme = themes[0];
  if (topTheme && topTheme.impressions > 0) {
    recs.push({
      action: "add_faq",
      label: `להוסיף שאלות ותשובות בנושא: ${topTheme.label}`,
      evidence:
        `שאילתות ידועות בנושא זה: ${topTheme.queries.slice(0, 3).join(", ")} ` +
        `(${topTheme.impressions} חשיפות ידועות — נתון חלקי, לא סך התנועה)`,
    });
  }

  if (has("declining")) {
    const s = signals.find((x) => x.type === "declining")!;
    recs.push({
      action: "investigate_decline",
      label: "לבדוק את סיבת הירידה",
      evidence: s.evidence,
    });
  }

  if (has("emerging")) {
    const s = signals.find((x) => x.type === "emerging")!;
    recs.push({
      action: "expand_section",
      label: "להרחיב את התוכן סביב הנושא החדש",
      evidence: s.evidence,
    });
  }

  if (page.avg_position > 15 && page.impressions >= THRESHOLDS.minImpressionsForSignal) {
    recs.push({
      action: "improve_internal_linking",
      label: "לחזק קישורים פנימיים אל העמוד",
      evidence: `מיקום ${round(page.avg_position, 1)} עם ${page.impressions} חשיפות — נראות קיימת אך דירוג חלש`,
    });
  }

  return recs;
}

// ── Orchestration ─────────────────────────────────────────────────────────

export interface BuildOptions {
  /** GA4 cannot distinguish hosts, so it is only attached to this host. */
  primaryHost?: string;
  /** Length of the window these rows cover. Confidence scales with it. */
  windowDays?: number;
}

export function buildOpportunities(
  pages: PageWindow[],
  queries: QueryRow[],
  ga4Rows: Ga4PageRow[],
  curve: CtrCurveRow[],
  options: BuildOptions = {},
): Opportunity[] {
  const primaryHost = options.primaryHost ?? "ihaveallergy.com";
  const windowDays = options.windowDays ?? 28;
  const expected = buildExpectedCtrModel(curve);

  const queriesByPath = new Map<string, QueryRow[]>();
  for (const q of queries) {
    const list = queriesByPath.get(q.page_path);
    if (list) list.push(q);
    else queriesByPath.set(q.page_path, [q]);
  }

  const ga4ByPath = new Map<string, Ga4PageRow>();
  for (const g of ga4Rows) ga4ByPath.set(g.landing_page_path, g);

  const out: Opportunity[] = [];

  for (const page of pages) {
    // GA4 landing paths carry no host. Attaching them to a non-primary host
    // would silently credit the subdomain with the main site's behaviour.
    const ga4 = page.page_host === primaryHost
      ? ga4ByPath.get(page.page_path) ?? null
      : null;
    const ga4Note = page.page_host === primaryHost
      ? ga4
        ? "נתוני GA4 אורגניים תואמים לפי נתיב מנורמל"
        : "אין נתוני GA4 תואמים — ייתכן הפרש אזור זמן או היעדר תנועה; לא נזקף לחובת העמוד"
      : `GA4 אינו מבחין בין דומיינים — לא שויכו נתונים לעמוד ב-${page.page_host}`;

    const ctrAssessment = assessCtr(page, expected);
    const { confidence, reasons } = assessConfidence(page, ga4, windowDays, ctrAssessment);
    const signals = detectSignals(page, expected, ctrAssessment);
    const { score, components } = scoreOpportunity(
      page, expected, confidence, windowDays, ctrAssessment,
    );
    const rows = queriesByPath.get(page.page_path) ?? [];
    const themes = groupQueryThemes(rows);

    out.push({
      pageHost: page.page_host,
      pagePath: page.page_path,
      pageUrl: page.page_url,
      score,
      scoreComponents: components,
      confidence,
      confidenceReasons: reasons,
      signals,
      clicks: page.clicks,
      impressions: page.impressions,
      ctr: page.ctr,
      position: page.avg_position,
      daysWithData: page.days_with_data,
      trend: {
        impressionsChangePct: pctChange(page.impressions, page.prev_impressions),
        clicksChangePct: pctChange(page.clicks, page.prev_clicks),
        positionChange:
          page.prev_avg_position > 0 && page.avg_position > 0
            ? round(page.prev_avg_position - page.avg_position, 2)
            : null,
        prevImpressions: page.prev_impressions,
        prevClicks: page.prev_clicks,
      },
      upside: estimateUpside(page, expected, windowDays),
      ctrBenchmarkSource: ctrAssessment.benchmarkSource,
      ctrBenchmarkNote: ctrAssessment.note,
      ga4,
      ga4Note,
      knownQueries: {
        themes,
        totalKnownImpressions: rows.reduce((s, r) => s + r.impressions, 0),
        totalKnownClicks: rows.reduce((s, r) => s + r.clicks, 0),
        note:
          "שאילתות ידועות בלבד. גוגל מסתיר שאילתות נדירות, ולכן אלה אינם סך התנועה לעמוד — " +
          "מספרי התנועה נלקחים מנתוני העמוד (page grain).",
      },
      recommendations: buildRecommendations(page, signals, themes, ctrAssessment),
    });
  }

  return out.sort((a, b) => b.score - a.score);
}
