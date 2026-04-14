/**
 * GEO Page Registry — canonical mapping between GEO page IDs
 * and the live site's rendering source-of-truth.
 *
 * This is the SINGLE source of truth for how the GEO system
 * maps a `pageId` to a real route, the component's content
 * source, and the correct override lookup key.
 */

export type ContentSourceType =
  | 'page_content_context'     // Page reads sections from usePageContent(overrideKey)
  | 'knowledge_article_layout' // KnowledgeArticleLayout with pageId = 'knowledge:<slug>'
  | 'hardcoded'                // Page ignores overrides — content is baked in JSX
  | 'no_route';                // Page path does not exist in App.tsx → 404

export interface GeoPageRegistryEntry {
  /** pageId used in the GEO system (CONTENT_TRANSFORMS, WORKSPACE_BRIEFS) */
  geoPageId: string;
  /** The URL path for this page on the live site */
  pagePath: string;
  /** How the live page actually gets its content */
  contentSource: ContentSourceType;
  /** The key the live page passes to usePageContent() or KnowledgeArticleLayout */
  overrideKey: string;
  /** Section indices the live page actually reads from the override (null = all) */
  renderedSectionIndices: number[] | null;
  /** Human-readable Hebrew title */
  titleHe: string;
  /** Whether a route exists in App.tsx */
  routeExists: boolean;
  /** Notes about content source discrepancies */
  sourceNotes?: string;
}

/**
 * Registry of all pages managed by the GEO system.
 * Updated manually when new pages/routes are added.
 */
export const GEO_PAGE_REGISTRY: GeoPageRegistryEntry[] = [
  {
    geoPageId: 'homepage',
    pagePath: '/',
    contentSource: 'page_content_context',
    overrideKey: 'homepage',
    renderedSectionIndices: [0, 1, 2, 3, 4, 5, 6],
    titleHe: 'דף הבית',
    routeExists: true,
  },
  {
    geoPageId: 'about',
    pagePath: '/about',
    contentSource: 'page_content_context',
    overrideKey: 'about',
    renderedSectionIndices: [0, 1, 2],
    titleHe: 'אודות',
    routeExists: true,
    sourceNotes: 'Sections 3-6 (education, achievements, certifications, profile) are hardcoded in JSX and not read from overrides',
  },
  {
    geoPageId: 'allergy-testing',
    pagePath: '/services',
    contentSource: 'page_content_context',
    overrideKey: 'allergy-testing',
    renderedSectionIndices: [0, 1],
    titleHe: 'שירותים ומצבים רפואיים',
    routeExists: true,
    sourceNotes: 'Only hero heading (section 0) and intro text (section 1) are read from overrides. All service cards are hardcoded.',
  },
  {
    geoPageId: 'bamba-reaction',
    pagePath: '/knowledge/פריחה-אחרי-במבה',
    contentSource: 'knowledge_article_layout',
    overrideKey: 'knowledge:פריחה-אחרי-במבה',
    renderedSectionIndices: null,
    titleHe: 'פריחה אחרי במבה',
    routeExists: true,
  },
  {
    geoPageId: 'first-foods',
    pagePath: '/guides/טעימות-ראשונות-אלרגנים',
    contentSource: 'page_content_context',
    overrideKey: 'first-foods',
    renderedSectionIndices: null,
    titleHe: 'טעימות ראשונות',
    routeExists: true,
  },
  {
    geoPageId: 'milk-allergy',
    pagePath: '/knowledge/אלרגיה-לחלב-בילדים',
    contentSource: 'no_route',
    overrideKey: 'milk-allergy',
    renderedSectionIndices: null,
    titleHe: 'אלרגיה לחלב בילדים',
    routeExists: false,
    sourceNotes: 'This page does NOT have a route in App.tsx. The path /knowledge/אלרגיה-לחלב-בילדים returns 404. Any scan of this page audits content that users cannot see.',
  },
  {
    geoPageId: 'atopic-dermatitis',
    pagePath: '/knowledge/אקזמה-אטופית-בילדים',
    contentSource: 'no_route',
    overrideKey: 'atopic-dermatitis',
    renderedSectionIndices: null,
    titleHe: 'אקזמה אטופית בילדים',
    routeExists: false,
    sourceNotes: 'This page does NOT have a route in App.tsx. The path /knowledge/אקזמה-אטופית-בילדים returns 404. Any scan of this page audits content that users cannot see.',
  },
];

/**
 * Lookup a registry entry by GEO pageId.
 */
export function getRegistryEntry(geoPageId: string): GeoPageRegistryEntry | undefined {
  return GEO_PAGE_REGISTRY.find(e => e.geoPageId === geoPageId);
}

/**
 * Get the correct override key for a given GEO pageId.
 * This is the key the live page actually uses to load content.
 */
export function getOverrideKeyForPage(geoPageId: string): string {
  const entry = getRegistryEntry(geoPageId);
  return entry?.overrideKey ?? geoPageId;
}

/**
 * Detect mismatches between what the GEO scan analyzes
 * and what the live page actually renders.
 */
export interface ContentSourceMismatch {
  type: 'no_route' | 'partial_render' | 'override_key_mismatch' | 'hardcoded';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details: string;
}

export function detectMismatches(geoPageId: string): ContentSourceMismatch[] {
  const entry = getRegistryEntry(geoPageId);
  if (!entry) {
    return [{
      type: 'no_route',
      severity: 'critical',
      message: 'דף לא רשום ברגיסטרי',
      details: `הדף "${geoPageId}" לא קיים ברגיסטרי הדפים. לא ניתן לאמת התאמה בין סריקה לדף חי.`,
    }];
  }

  const mismatches: ContentSourceMismatch[] = [];

  // 1. Page has no route (404)
  if (!entry.routeExists || entry.contentSource === 'no_route') {
    mismatches.push({
      type: 'no_route',
      severity: 'critical',
      message: 'הדף לא קיים באתר (404)',
      details: `הנתיב ${entry.pagePath} מחזיר 404. תוכן שנסרק אינו נגיש למשתמשים או לזחלנים.`,
    });
  }

  // 2. Override key differs from GEO pageId
  if (entry.overrideKey !== geoPageId) {
    mismatches.push({
      type: 'override_key_mismatch',
      severity: 'warning',
      message: 'מפתח תוכן שונה ממזהה הדף',
      details: `GEO מזהה: "${geoPageId}" → הדף משתמש ב: "${entry.overrideKey}". הסריקה חייבת להשתמש במפתח "${entry.overrideKey}" כדי לקרוא את התוכן הנכון.`,
    });
  }

  // 3. Only partial sections rendered
  if (entry.renderedSectionIndices && entry.contentSource === 'page_content_context') {
    mismatches.push({
      type: 'partial_render',
      severity: 'warning',
      message: 'הדף מציג רק חלק מהסקציות',
      details: `הדף קורא רק סקציות ${entry.renderedSectionIndices.join(', ')} מה-override. סקציות נוספות שנשמרו ב-DB לא מוצגות בפועל.`,
    });
  }

  // 4. Hardcoded content
  if (entry.contentSource === 'hardcoded') {
    mismatches.push({
      type: 'hardcoded',
      severity: 'critical',
      message: 'תוכן הדף מקודד ולא נשלט מ-DB',
      details: 'הקומפוננטה מתעלמת מ-page_content_overrides ומציגה תוכן קבוע. שינויים ב-DB לא ישפיעו על הדף החי.',
    });
  }

  return mismatches;
}

/**
 * Determine if a scan result can be trusted for a given page.
 */
export function isScanTrustworthy(geoPageId: string): {
  trustworthy: boolean;
  reason?: string;
} {
  const mismatches = detectMismatches(geoPageId);
  const criticals = mismatches.filter(m => m.severity === 'critical');

  if (criticals.length > 0) {
    return {
      trustworthy: false,
      reason: criticals.map(m => m.message).join('; '),
    };
  }

  return { trustworthy: true };
}
