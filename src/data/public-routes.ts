/**
 * The canonical list of public routes.
 *
 * Single source of truth for three build-time consumers:
 *   1. scripts/prerender.mjs   — which routes get static HTML
 *   2. scripts/generate-sitemap.mjs — what goes in sitemap.xml
 *   3. scripts/verify-crawlability.mjs — what the acceptance test checks
 *
 * Keep in sync with the <Route> table in src/App.tsx. Blog routes derive
 * from the article data itself, so publishing an article adds its route,
 * its prerendered page and its sitemap entry automatically.
 */

import { blogArticles } from "./blog-articles";

/** Static public pages. Order here is the order they prerender in. */
export const STATIC_PUBLIC_ROUTES = [
  "/",
  "/about",
  "/services",
  "/dr-anna-brameli",
  "/faq",
  "/contact",
  "/blog",
  "/updates",
  "/whois",
  "/book",
  "/desensitization",
  "/food-desensitization",
  "/privacy",
  "/accessibility",
  "/security",
] as const;

/** Pillar guides. */
export const GUIDE_ROUTES = [
  "/guides/אלרגיה-מדריך-מקיף",
  "/guides/טעימות-ראשונות-אלרגנים",
  "/guides/זכויות-ילד-אלרגי-ישראל",
  "/guides/בדיקות-אלרגיה-ילדים-ישראל",
  "/אלרגיה-בילדים-מדריך-מלא",
] as const;

/** Knowledge-library satellites. */
export const KNOWLEDGE_ROUTES = [
  "/knowledge/פריחה-אחרי-במבה",
  "/knowledge/אודם-סביב-הפה-אחרי-אלרגן",
  "/knowledge/במבה-גיל-4-חודשים",
  "/knowledge/הקאה-אחרי-טחינה",
  "/knowledge/כמה-ימים-בין-אלרגנים",
  "/knowledge/גן-יכול-לסרב-לילד-אלרגי",
  "/knowledge/אפיפן-בגן-מי-אחראי",
  "/knowledge/סייעת-רפואית-לילד-אלרגי",
  "/knowledge/טיול-שנתי-ילד-אלרגי",
  "/knowledge/אישור-אלרגיה-למשרד-החינוך",
  "/knowledge/תבחיני-עור-כואב-לילדים",
  "/knowledge/בדיקת-דם-לאלרגיה-ילדים",
  "/knowledge/תגר-מזון-איך-זה-נראה",
  "/knowledge/בדיקה-חיובית-בלי-תסמינים",
  "/knowledge/בדיקות-אלרגיה-פרטי-או-קופה",
] as const;

/** One route per published blog article. */
export const BLOG_ROUTES: string[] = blogArticles.map((a) => `/blog/${a.slug}`);

/** Everything a crawler should be able to read without JavaScript. */
export const PUBLIC_ROUTES: string[] = [
  ...STATIC_PUBLIC_ROUTES,
  ...GUIDE_ROUTES,
  ...BLOG_ROUTES,
  ...KNOWLEDGE_ROUTES,
];

/**
 * Private surfaces. These are NOT prerendered with app content — the build
 * writes a minimal shell carrying `noindex, nofollow` in the initial HTML,
 * so the directive reaches crawlers that never run JavaScript.
 *
 * This is an indexing control, not an access control. Access control is
 * Supabase auth plus RLS, which is unaffected by any of this.
 */
export const NOINDEX_ROUTES = [
  "/admin",
  "/admin/patients",
  "/admin/patients/new",
  "/admin/appointments",
  "/admin/appointments/new",
  "/admin/billing",
  "/admin/billing/new",
  "/admin/expenses",
  "/admin/messages",
  "/admin/team",
  "/admin/referrals",
  "/admin/intake",
  "/admin/settings",
  "/admin/audit-log",
  "/admin/doctor-diary",
  "/admin/work-hours",
  "/admin/cancellations",
  "/admin/geo",
  "/auth",
  "/reset-password",
  "/verify-booking",
  "/verify-email",
  "/magic",
  "/portal",
  "/book/success",
  "/contact/success",
] as const;

/**
 * Routes excluded from the sitemap despite being public and prerendered:
 * legal/boilerplate pages we do not want competing for crawl budget with
 * the medical content.
 */
export const SITEMAP_EXCLUDED = new Set<string>([
  "/privacy",
  "/accessibility",
  "/security",
]);

/** A representative slice used for the crawlability acceptance test. */
export const SAMPLE_ROUTES: string[] = [
  "/",
  "/blog",
  `/blog/${blogArticles[0]?.slug ?? "פריחה-אחרי-במבה-לתינוק"}`,
  "/guides/טעימות-ראשונות-אלרגנים",
  "/knowledge/אפיפן-בגן-מי-אחראי",
  "/dr-anna-brameli",
  "/services",
  "/faq",
];
