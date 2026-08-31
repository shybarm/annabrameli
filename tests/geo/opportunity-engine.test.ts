/// <reference lib="deno.ns" />
/**
 * Tests for the Organic Opportunities engine.
 *
 * Run with `npm run test:engine` (deno test). No database, no network, no new
 * npm dependency — the engine is pure by design so its rules can be pinned.
 *
 * The first test is the one that matters most: query suppression must never
 * leak into a traffic number.
 */

import {
  assertEquals,
  assert,
  assertAlmostEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildOpportunities,
  buildExpectedCtrModel,
  assessCtr,
  scoreOpportunity,
  assessConfidence,
  detectSignals,
  estimateUpside,
  groupQueryThemes,
  classifyQuery,
  THRESHOLDS,
  type PageWindow,
  type QueryRow,
  type Ga4PageRow,
  type CtrCurveRow,
} from "../../src/lib/geo/opportunity-engine.ts";

const GUIDE = "/guides/טעימות-ראשונות-אלרגנים";

function page(over: Partial<PageWindow> = {}): PageWindow {
  return {
    page_host: "ihaveallergy.com",
    page_path: "/x",
    clicks: 0,
    impressions: 0,
    ctr: 0,
    avg_position: 0,
    days_with_data: 0,
    prev_clicks: 0,
    prev_impressions: 0,
    prev_ctr: 0,
    prev_avg_position: 0,
    prev_days: 0,
    ...over,
  };
}

/** Empty curve -> documented conservative fallback. */
const fallbackModel = buildExpectedCtrModel([]);

// ── 1. Query suppression must not affect page traffic ─────────────────────

Deno.test("query-grain totals never become page traffic totals", () => {
  // Real shape of the problem: the guide's page grain says 45 clicks / 850
  // impressions while its known queries only account for 4 / 126.
  const guide = page({
    page_path: GUIDE,
    clicks: 45,
    impressions: 850,
    ctr: 45 / 850,
    avg_position: 9.84,
    days_with_data: 28,
    prev_clicks: 30,
    prev_impressions: 700,
    prev_avg_position: 11.2,
    prev_days: 28,
  });

  const queries: QueryRow[] = [
    { page_path: GUIDE, query: "טחינה לתינוק", clicks: 3, impressions: 90, avg_position: 7.5 },
    { page_path: GUIDE, query: "טעימות טחינה לתינוק", clicks: 1, impressions: 36, avg_position: 8.9 },
  ];

  const [opp] = buildOpportunities([guide], queries, [], []);

  // Traffic comes from the page grain, untouched by the query rows.
  assertEquals(opp.clicks, 45);
  assertEquals(opp.impressions, 850);

  // The query totals are reported separately and clearly labelled.
  assertEquals(opp.knownQueries.totalKnownClicks, 4);
  assertEquals(opp.knownQueries.totalKnownImpressions, 126);
  assert(opp.knownQueries.note.includes("אינם סך התנועה"));

  // And they are nowhere near the traffic figures — proving no substitution.
  assert(opp.clicks > opp.knownQueries.totalKnownClicks * 10);
});

// ── 2. Duplicate properties must not double-count the seo host ────────────

Deno.test("same path on two hosts stays two separate opportunities", () => {
  const main = page({
    page_host: "ihaveallergy.com",
    page_path: "/faq",
    clicks: 10, impressions: 400, ctr: 0.025, avg_position: 7, days_with_data: 28,
  });
  const seo = page({
    page_host: "seo.ihaveallergy.com",
    page_path: "/faq",
    clicks: 3, impressions: 120, ctr: 0.025, avg_position: 12, days_with_data: 28,
  });

  const out = buildOpportunities([main, seo], [], [], []);
  assertEquals(out.length, 2);

  const hosts = out.map((o) => o.pageHost).sort();
  assertEquals(hosts, ["ihaveallergy.com", "seo.ihaveallergy.com"]);

  // Neither row absorbed the other's clicks.
  assertEquals(out.find((o) => o.pageHost === "ihaveallergy.com")!.clicks, 10);
  assertEquals(out.find((o) => o.pageHost === "seo.ihaveallergy.com")!.clicks, 3);
});

// ── 3. A position-8 page can outrank a position-1 page ────────────────────

Deno.test("position 8 with volume scores above position 1", () => {
  const striking = page({
    page_path: "/striking",
    clicks: 20, impressions: 800, ctr: 20 / 800, avg_position: 8,
    days_with_data: 28, prev_impressions: 700, prev_clicks: 18, prev_days: 28,
  });
  // Homepage-like: already first, and with MORE impressions.
  const alreadyFirst = page({
    page_path: "/",
    clicks: 200, impressions: 1000, ctr: 0.2, avg_position: 1.2,
    days_with_data: 28, prev_impressions: 950, prev_clicks: 190, prev_days: 28,
  });

  const out = buildOpportunities([striking, alreadyFirst], [], [], []);
  assertEquals(out[0].pagePath, "/striking");
  assert(
    out[0].score > out[1].score,
    `expected striking (${out[0].score}) > first (${out[1].score})`,
  );
});

// ── 4. Tiny samples cannot be high confidence ─────────────────────────────

Deno.test("tiny sample can never reach high confidence, however dramatic", () => {
  // 3 -> 60 impressions is a 1900% jump, but on almost no data.
  const tiny = page({
    page_path: "/tiny",
    clicks: 1, impressions: 12, ctr: 1 / 12, avg_position: 6,
    days_with_data: 2, prev_impressions: 1, prev_days: 1,
  });
  const { confidence } = assessConfidence(tiny, null);
  assertEquals(confidence, "low");

  // And the low-confidence multiplier keeps it off the top of the list.
  const big = page({
    page_path: "/big",
    clicks: 20, impressions: 600, ctr: 20 / 600, avg_position: 8, days_with_data: 28,
    prev_impressions: 550, prev_days: 28,
  });
  const out = buildOpportunities([tiny, big], [], [], []);
  assertEquals(out[0].pagePath, "/big");
});

Deno.test("confidence ladder follows sample size", () => {
  assertEquals(
    assessConfidence(page({ impressions: 500, days_with_data: 28 }), null).confidence,
    "high",
  );
  assertEquals(
    assessConfidence(page({ impressions: 50, days_with_data: 10 }), null).confidence,
    "medium",
  );
  // High volume but only 3 of 28 days observed: coverage is what fails here,
  // and that is the intended behaviour - a burst is not a stable sample.
  assertEquals(
    assessConfidence(page({ impressions: 500, days_with_data: 3 }), null).confidence,
    "low",
  );
  // The same 3 days inside a 7-day window is good coverage, so it lifts.
  assertEquals(
    assessConfidence(page({ impressions: 500, days_with_data: 4 }), null, 7).confidence,
    "high",
  );
  assertEquals(
    assessConfidence(page({ impressions: 5, days_with_data: 20 }), null).confidence,
    "low",
  );
});

// ── 5. Rising / declining comparison windows ──────────────────────────────

Deno.test("rising and declining are detected against the previous window", () => {
  const rising = page({
    impressions: 300, prev_impressions: 100, avg_position: 9,
    clicks: 5, ctr: 5 / 300, days_with_data: 28,
  });
  const risingSignals = detectSignals(rising, fallbackModel).map((s) => s.type);
  assert(risingSignals.includes("rising"));
  assert(!risingSignals.includes("declining"));

  const declining = page({
    impressions: 60, prev_impressions: 400, avg_position: 9,
    clicks: 1, ctr: 1 / 60, days_with_data: 28,
  });
  const decliningSignals = detectSignals(declining, fallbackModel).map((s) => s.type);
  assert(decliningSignals.includes("declining"));
  assert(!decliningSignals.includes("rising"));

  // A big percentage swing on a tiny base is not a trend signal.
  const noisy = page({
    impressions: 40, prev_impressions: 5, avg_position: 9, days_with_data: 8,
  });
  const noisySignals = detectSignals(noisy, fallbackModel).map((s) => s.type);
  assert(!noisySignals.includes("rising"), "must not call a 5-impression base a trend");
  assert(noisySignals.includes("emerging"), "that shape is 'emerging' instead");
});

Deno.test("declining page produces an investigate recommendation, not a silent drop", () => {
  const declining = page({
    page_path: "/dropping",
    impressions: 80, prev_impressions: 500, clicks: 2, ctr: 2 / 80,
    avg_position: 11, days_with_data: 28, prev_clicks: 25, prev_days: 28,
  });
  const [opp] = buildOpportunities([declining], [], [], []);
  const actions = opp.recommendations.map((r) => r.action);
  assert(actions.includes("investigate_decline"));
  // The recommendation carries its evidence rather than a bare label.
  const rec = opp.recommendations.find((r) => r.action === "investigate_decline")!;
  assert(rec.evidence.includes("500"));
});

// ── 6. CTR opportunity ────────────────────────────────────────────────────

Deno.test("CTR shortfall is detected and scored, sufficiency respected", () => {
  // First-party evidence: the site's own data says position 3 earns ~10% here.
  const siteModel = buildExpectedCtrModel([
    { position_bucket: 3, clicks: 100, impressions: 1000, observations: 50 },
  ]);

  const weak = page({
    impressions: 1000, clicks: 10, ctr: 0.01, avg_position: 3, days_with_data: 28,
  });
  const types = detectSignals(weak, siteModel).map((s) => s.type);
  assert(types.includes("high_impressions_low_ctr"));

  const { components } = scoreOpportunity(weak, siteModel, "high");
  const ctrComp = components.find((c) => c.key === "ctr")!;
  assert(ctrComp.points > 10, `expected a large CTR component, got ${ctrComp.points}`);

  // The identical page judged only against the assumed curve must NOT be
  // flagged, and its CTR contribution is capped.
  const assumedTypes = detectSignals(weak, fallbackModel).map((s) => s.type);
  assert(!assumedTypes.includes("high_impressions_low_ctr"));
  const cappedCtr = scoreOpportunity(weak, fallbackModel, "high")
    .components.find((c) => c.key === "ctr")!;
  assert(cappedCtr.points <= THRESHOLDS.ctrFallbackMaxPoints);

  // A page meeting expectation gets nothing from this component.
  const healthy = page({
    impressions: 1000, clicks: 100, ctr: 0.1, avg_position: 3, days_with_data: 28,
  });
  const healthyCtr = scoreOpportunity(healthy, siteModel, "high")
    .components.find((c) => c.key === "ctr")!;
  assertEquals(healthyCtr.points, 0);

  // Below the volume floor, CTR is not judged at all.
  const thin = page({ impressions: 20, clicks: 0, ctr: 0, avg_position: 3, days_with_data: 5 });
  assert(!detectSignals(thin, siteModel).map((s) => s.type)
    .includes("high_impressions_low_ctr"));
});

// ── 7. GA4 absence must not break or penalise ─────────────────────────────

Deno.test("missing GA4 data does not break scoring or penalise the page", () => {
  const p = page({
    page_path: "/no-ga4", impressions: 500, clicks: 15, ctr: 0.03,
    avg_position: 8, days_with_data: 28, prev_impressions: 450, prev_days: 28,
  });

  const withGa4 = buildOpportunities([p], [], [{
    landing_page_path: "/no-ga4", sessions: 40, users: 35,
    engaged_sessions: 25, engagement_rate: 0.62, key_events: 2, days_with_data: 28,
  }], []);
  const withoutGa4 = buildOpportunities([p], [], [], []);

  assertEquals(withoutGa4[0].ga4, null);
  assertEquals(withGa4[0].score, withoutGa4[0].score, "GA4 must not change the score");
  assert(withoutGa4[0].ga4Note.includes("לא נזקף לחובת"));
  assertEquals(withGa4[0].ga4!.key_events, 2);
});

Deno.test("GA4 is never attached across hosts", () => {
  const seoPage = page({
    page_host: "seo.ihaveallergy.com", page_path: "/faq",
    impressions: 300, clicks: 5, ctr: 5 / 300, avg_position: 9, days_with_data: 28,
  });
  const ga4: Ga4PageRow[] = [{
    landing_page_path: "/faq", sessions: 99, users: 90,
    engaged_sessions: 60, engagement_rate: 0.6, key_events: 5, days_with_data: 28,
  }];
  const [opp] = buildOpportunities([seoPage], [], ga4, []);
  assertEquals(opp.ga4, null, "GA4 has no host dimension; must not credit the subdomain");
  assert(opp.ga4Note.includes("אינו מבחין"));
});

// ── 8. Normalized Hebrew paths join correctly ─────────────────────────────

Deno.test("Hebrew paths join GA4 and queries by normalized path", () => {
  const guide = page({
    page_path: GUIDE, impressions: 850, clicks: 45, ctr: 45 / 850,
    avg_position: 9.84, days_with_data: 28, prev_impressions: 700, prev_days: 28,
  });
  const queries: QueryRow[] = [
    { page_path: GUIDE, query: "טחינה לתינוק", clicks: 3, impressions: 90, avg_position: 7.5 },
  ];
  const ga4: Ga4PageRow[] = [{
    landing_page_path: GUIDE, sessions: 51, users: 47,
    engaged_sessions: 30, engagement_rate: 0.59, key_events: 1, days_with_data: 28,
  }];

  const [opp] = buildOpportunities([guide], queries, ga4, []);
  assertEquals(opp.ga4!.sessions, 51);
  assertEquals(opp.knownQueries.themes[0].theme, "tahini");
});

// ── 9. Query themes ───────────────────────────────────────────────────────

Deno.test("queries group into deterministic themes", () => {
  assertEquals(classifyQuery("טחינה לתינוק").theme, "tahini");
  assertEquals(classifyQuery("אפיפן בגן").theme, "rights");
  assertEquals(classifyQuery("בדיקת דם לאלרגיה").theme, "testing");
  assertEquals(classifyQuery("משהו לא קשור בכלל").theme, "other");

  const themes = groupQueryThemes([
    { page_path: "/p", query: "טחינה לתינוק", clicks: 2, impressions: 80, avg_position: 7 },
    { page_path: "/p", query: "שומשום לתינוק", clicks: 1, impressions: 40, avg_position: 9 },
    { page_path: "/p", query: "בדיקת אלרגיה", clicks: 0, impressions: 10, avg_position: 15 },
  ]);
  assertEquals(themes[0].theme, "tahini");
  assertEquals(themes[0].impressions, 120);
  assertEquals(themes[0].queries.length, 2);
});

// ── 10. Upside methodology ────────────────────────────────────────────────

Deno.test("upside is suppressed on thin data and conservative otherwise", () => {
  const thin = page({ impressions: 20, clicks: 1, ctr: 0.05, avg_position: 9, days_with_data: 3 });
  assertEquals(estimateUpside(thin, fallbackModel).incrementalClicks, null);

  const solid = page({
    impressions: 1000, clicks: 10, ctr: 0.01, avg_position: 9, days_with_data: 28,
  });
  const up = estimateUpside(solid, fallbackModel);
  assertEquals(up.targetPosition, 6);
  // (0.05 - 0.01) * 1000 * 0.5 = 20
  assertEquals(up.incrementalClicks, 20);
  assert(up.assumptions.includes("הערכה"));
  assert(up.assumptions.includes("לא תחזית"));
});

Deno.test("site-derived CTR curve is preferred when the sample supports it", () => {
  const curve: CtrCurveRow[] = [
    { position_bucket: 3, clicks: 60, impressions: 1000, observations: 40 },
    { position_bucket: 9, clicks: 20, impressions: 1000, observations: 40 },
    // Too thin to trust -> falls back for this bucket only.
    { position_bucket: 5, clicks: 1, impressions: 10, observations: 2 },
  ];
  const model = buildExpectedCtrModel(curve);
  assertAlmostEquals(model.ctrAt(3), 0.06, 1e-9);
  assertAlmostEquals(model.ctrAt(9), 0.02, 1e-9);
  assertEquals(model.ctrAt(5), 0.06); // fallback value for bucket 5
  assertEquals(model.source, "mixed");
  assertEquals(model.siteDerivedBuckets, [3, 9]);
});

// ── 11. Window filters ────────────────────────────────────────────────────

Deno.test("7 / 28 / 90 day windows are independent inputs, not rescaled", () => {
  // The SQL layer supplies each window; the engine must treat what it is given
  // as authoritative and never extrapolate one window from another.
  const wk = page({
    page_path: GUIDE, impressions: 210, clicks: 11, ctr: 11 / 210,
    avg_position: 9.5, days_with_data: 7, prev_impressions: 180, prev_days: 7,
  });
  const month = page({
    page_path: GUIDE, impressions: 850, clicks: 45, ctr: 45 / 850,
    avg_position: 9.84, days_with_data: 28, prev_impressions: 700, prev_days: 28,
  });

  const [w] = buildOpportunities([wk], [], [], [], { windowDays: 7 });
  const [m] = buildOpportunities([month], [], [], [], { windowDays: 28 });

  assertEquals(w.impressions, 210);
  assertEquals(m.impressions, 850);
  // Each window is judged on its own coverage, not rescaled from the other.
  assertEquals(w.daysWithData, 7);
  assertEquals(m.daysWithData, 28);
  assertEquals(w.confidence, "high");
  assertEquals(m.confidence, "high");

  // A 7-day window with only 1 day of data is thin, even at the same volume.
  const sparse = page({
    page_path: GUIDE, impressions: 210, clicks: 11, ctr: 11 / 210,
    avg_position: 9.5, days_with_data: 1, prev_impressions: 180, prev_days: 7,
  });
  const [sp] = buildOpportunities([sparse], [], [], [], { windowDays: 7 });
  assertEquals(sp.confidence, "low");
});

// ── 12. The validation case, emerging from the algorithm ──────────────────

Deno.test("the allergen guide surfaces as a top opportunity on its own merits", () => {
  // Page-grain history from Stage 1A. Nothing about this page is special-cased
  // in the engine; it competes on the same rules as everything else.
  const guide = page({
    page_path: GUIDE,
    clicks: 45, impressions: 850, ctr: 45 / 850, avg_position: 9.84,
    days_with_data: 28, prev_clicks: 32, prev_impressions: 640,
    prev_avg_position: 11.1, prev_days: 28,
  });
  const others = [
    page({ page_path: "/", clicks: 60, impressions: 900, ctr: 60 / 900, avg_position: 1.5,
      days_with_data: 28, prev_impressions: 880, prev_days: 28 }),
    page({ page_path: "/contact", clicks: 2, impressions: 40, ctr: 0.05, avg_position: 4,
      days_with_data: 9, prev_impressions: 35, prev_days: 9 }),
    page({ page_path: "/privacy", clicks: 0, impressions: 8, ctr: 0, avg_position: 22,
      days_with_data: 3, prev_impressions: 6, prev_days: 3 }),
  ];
  const queries: QueryRow[] = [
    { page_path: GUIDE, query: "טחינה לתינוק", clicks: 3, impressions: 90, avg_position: 7.5 },
    { page_path: GUIDE, query: "טעימות טחינה לתינוק", clicks: 1, impressions: 24, avg_position: 8.9 },
    { page_path: GUIDE, query: "חשיפה לאלרגנים תינוקות", clicks: 0, impressions: 12, avg_position: 11.2 },
  ];

  const out = buildOpportunities([guide, ...others], queries, [], []);

  assertEquals(out[0].pagePath, GUIDE, "the guide should rank first on the data alone");
  assertEquals(out[0].confidence, "high");

  const types = out[0].signals.map((s) => s.type);
  assert(types.includes("striking_distance"));
  assert(types.includes("high_potential_winner"));
  assert(types.includes("rising"));

  // Traffic is page-grain, never the 4 clicks / 126 impressions of query data.
  assertEquals(out[0].clicks, 45);
  assertEquals(out[0].impressions, 850);
  assertEquals(out[0].knownQueries.totalKnownClicks, 4);
  assertEquals(out[0].knownQueries.totalKnownImpressions, 126);

  // Every component is explainable.
  assert(out[0].scoreComponents.every((c) => c.reason.length > 0));
  assert(out[0].recommendations.every((r) => r.evidence.length > 0));
});

// ── 13. Score is bounded and explainable ──────────────────────────────────

Deno.test("score stays within 0-100 and always explains itself", () => {
  const extreme = page({
    impressions: 1_000_000, clicks: 0, ctr: 0, avg_position: 9, days_with_data: 90,
    prev_impressions: 1, prev_days: 90,
  });
  const { score, components } = scoreOpportunity(extreme, fallbackModel, "high");
  assert(score >= 0 && score <= 100, `score out of range: ${score}`);
  assert(components.length >= 6);

  const empty = scoreOpportunity(page(), fallbackModel, "low");
  assert(empty.score >= 0 && empty.score <= 100);
});

Deno.test("thresholds are exported so the UI can explain them", () => {
  assertEquals(THRESHOLDS.strikingMinPosition, 4);
  assertEquals(THRESHOLDS.strikingMaxPosition, 15);
  assert(THRESHOLDS.upsideConservatismFactor <= 1);
});

Deno.test("a top-ranked page is never given upside for ranking worse", () => {
  // Regression: target = max(3, position-3) produced target 3 for a page at
  // position 1.5, then "gained" clicks from the higher expected CTR at 3.
  const top = page({
    page_path: "/", impressions: 900, clicks: 60, ctr: 60 / 900,
    avg_position: 1.5, days_with_data: 28,
  });
  const up = estimateUpside(top, fallbackModel);
  assertEquals(up.incrementalClicks, 0);
  assertEquals(up.targetPosition, null);
  assert(up.assumptions.includes("אין מרווח דירוג"));

  // A page with genuine headroom still gets an estimate, and the target is
  // always better than where it stands today.
  const mid = page({
    impressions: 900, clicks: 9, ctr: 0.01, avg_position: 11, days_with_data: 28,
  });
  const midUp = estimateUpside(mid, fallbackModel);
  assert(midUp.targetPosition !== null && midUp.targetPosition < mid.avg_position);
});

// ── 14. CTR fallback must not manufacture false positives ────────────────

Deno.test("homepage is NOT told to rewrite its snippet on an assumed CTR curve", () => {
  // The exact false positive that prompted this rule: position 1.5, CTR 6.67%,
  // judged against an ASSUMED 25% at position 1. No first-party curve exists.
  const homepage = page({
    page_path: "/", clicks: 60, impressions: 900, ctr: 60 / 900,
    avg_position: 1.5, days_with_data: 28,
    prev_clicks: 58, prev_impressions: 880, prev_ctr: 58 / 880, prev_days: 28,
  });

  const [opp] = buildOpportunities([homepage], [], [], []); // empty curve -> fallback

  assertEquals(opp.ctrBenchmarkSource, "fallback");
  assert(
    !opp.signals.some((s) => s.type === "high_impressions_low_ctr"),
    "must not raise a CTR shortfall from an assumption alone",
  );
  assert(
    !opp.recommendations.some((r) => r.action === "improve_title_meta"),
    "must not recommend a snippet rewrite from an assumption alone",
  );

  // And the CTR score contribution is capped rather than dominating.
  const ctrComp = opp.scoreComponents.find((c) => c.key === "ctr")!;
  assert(
    ctrComp.points <= THRESHOLDS.ctrFallbackMaxPoints,
    `fallback CTR contributed ${ctrComp.points}, expected <= ${THRESHOLDS.ctrFallbackMaxPoints}`,
  );
});

Deno.test("with first-party CTR data the same shortfall IS actionable", () => {
  // Site's own data says position 1-2 really does earn ~20% here.
  const curve: CtrCurveRow[] = [
    { position_bucket: 2, clicks: 200, impressions: 1000, observations: 60 },
  ];
  const weak = page({
    page_path: "/", clicks: 20, impressions: 1000, ctr: 0.02,
    avg_position: 1.6, days_with_data: 28, prev_impressions: 950, prev_days: 28,
  });

  const [opp] = buildOpportunities([weak], [], [], curve);
  assertEquals(opp.ctrBenchmarkSource, "first_party");
  assert(opp.signals.some((s) => s.type === "high_impressions_low_ctr"));
  assert(opp.recommendations.some((r) => r.action === "improve_title_meta"));

  const ctrComp = opp.scoreComponents.find((c) => c.key === "ctr")!;
  assert(ctrComp.points > THRESHOLDS.ctrFallbackMaxPoints, "first-party evidence unlocks the full range");
});

Deno.test("a page's own CTR collapse counts as evidence without any curve", () => {
  // No first-party curve, but the page halved against its own history.
  const collapsed = page({
    page_path: "/slipping", clicks: 5, impressions: 800, ctr: 5 / 800,
    avg_position: 6, days_with_data: 28,
    prev_clicks: 40, prev_impressions: 800, prev_ctr: 40 / 800, prev_days: 28,
  });
  const assessment = assessCtr(collapsed, fallbackModel);
  assertEquals(assessment.benchmarkSource, "fallback");
  assert(assessment.hasSelfComparisonEvidence);

  const [opp] = buildOpportunities([collapsed], [], [], []);
  assert(opp.signals.some((s) => s.type === "high_impressions_low_ctr"));
  assert(opp.recommendations.some((r) => r.action === "improve_title_meta"));
});

Deno.test("upside built on an assumed curve is labelled as an assumption", () => {
  const p = page({
    impressions: 1000, clicks: 10, ctr: 0.01, avg_position: 9, days_with_data: 28,
  });
  const up = estimateUpside(p, fallbackModel);
  assertEquals(up.basedOnAssumedCtr, true);
  assert(up.assumptions.includes("הנחה"));

  const curve: CtrCurveRow[] = [
    { position_bucket: 6, clicks: 40, impressions: 1000, observations: 50 },
  ];
  const firstParty = estimateUpside(p, buildExpectedCtrModel(curve));
  assertEquals(firstParty.basedOnAssumedCtr, false);
});

Deno.test("insufficient impressions report an insufficient benchmark", () => {
  const thin = page({ impressions: 20, clicks: 0, ctr: 0, avg_position: 5, days_with_data: 6 });
  assertEquals(assessCtr(thin, fallbackModel).benchmarkSource, "insufficient");
});

// ── 15. Trend is symmetric around a neutral midpoint ─────────────────────

Deno.test("flat trend is neutral, not positive", () => {
  const flat = page({
    impressions: 1000, prev_impressions: 1000, clicks: 30, ctr: 0.03,
    avg_position: 8, days_with_data: 28, prev_days: 28,
  });
  const comp = scoreOpportunity(flat, fallbackModel, "high")
    .components.find((c) => c.key === "trend")!;
  assertEquals(comp.points, 5, "flat must sit exactly on the neutral midpoint");
});

Deno.test("trend mapping is symmetric about the midpoint", () => {
  const at = (impressions: number, prev: number) =>
    scoreOpportunity(
      page({ impressions, prev_impressions: prev, avg_position: 8, days_with_data: 28 }),
      fallbackModel, "high",
    ).components.find((c) => c.key === "trend")!.points;

  assertEquals(at(200, 100), 10);   // +100%
  assertEquals(at(130, 100), 8);    // +30%
  assertEquals(at(115, 100), 6.5);  // +15%
  assertEquals(at(100, 100), 5);    // flat
  assertEquals(at(85, 100), 3.5);   // -15%
  assertEquals(at(70, 100), 2);     // -30%
  assertEquals(at(40, 100), 1);     // -60%

  // Rises and falls of equal magnitude sit equally far from the midpoint.
  assertAlmostEquals(at(130, 100) - 5, 5 - at(70, 100), 1.0);
  // No comparable base is neutral, not favourable.
  assertEquals(at(500, 3), 5);
});

Deno.test("a flat high-volume page does not outrank one with real headroom", () => {
  const flatBig = page({
    page_path: "/flat-big", clicks: 40, impressions: 2000, ctr: 0.02,
    avg_position: 3.2, days_with_data: 28, prev_impressions: 2000, prev_clicks: 40, prev_days: 28,
  });
  const headroom = page({
    page_path: "/headroom", clicks: 12, impressions: 700, ctr: 12 / 700,
    avg_position: 8.5, days_with_data: 28, prev_impressions: 600, prev_clicks: 9, prev_days: 28,
  });
  const out = buildOpportunities([flatBig, headroom], [], [], []);
  assertEquals(out[0].pagePath, "/headroom");
});
