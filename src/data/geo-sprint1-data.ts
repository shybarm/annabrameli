/**
 * Sprint 1 GEO Audit Data — ihaveallergy.com
 * 6-dimension scoring model for AI-readiness assessment
 */

export type PageType = 'homepage' | 'about' | 'contact' | 'faq' | 'article' | 'service' | 'guide' | 'profile';
export type PriorityImpact = 'high' | 'medium' | 'low';

export interface DimensionScore {
  score: number; // 1-10
  strengths: string[];
  weaknesses: string[];
  fixes: string[];
}

export interface GeoAuditPage {
  id: string;
  path: string;
  titleHe: string;
  titleEn: string;
  pageType: PageType;
  geoScore: number; // 1-10, computed average
  priority: PriorityImpact;
  entityClarity: DimensionScore;
  answerClarity: DimensionScore;
  topicalAuthority: DimensionScore;
  trustSignals: DimensionScore;
  citationReadiness: DimensionScore;
  serpClarity: DimensionScore;
}

export const PAGE_TYPE_LABELS: Record<PageType, string> = {
  homepage: 'דף הבית',
  about: 'אודות',
  contact: 'יצירת קשר',
  faq: 'שאלות נפוצות',
  article: 'מאמר',
  service: 'שירות',
  guide: 'מדריך',
  profile: 'פרופיל',
};

export const DIMENSION_LABELS: Record<string, { labelHe: string; labelEn: string; icon: string }> = {
  entityClarity: { labelHe: 'בהירות ישות', labelEn: 'Entity Clarity', icon: '👤' },
  answerClarity: { labelHe: 'בהירות תשובה', labelEn: 'Answer Clarity', icon: '💬' },
  topicalAuthority: { labelHe: 'סמכות נושאית', labelEn: 'Topical Authority', icon: '🏛️' },
  trustSignals: { labelHe: 'אותות אמון', labelEn: 'Trust Signals', icon: '🛡️' },
  citationReadiness: { labelHe: 'מוכנות ציטוט', labelEn: 'Citation Readiness', icon: '📎' },
  serpClarity: { labelHe: 'בהירות SERP', labelEn: 'SERP Clarity', icon: '🔍' },
};

function avg(...nums: number[]): number {
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function buildPage(p: Omit<GeoAuditPage, 'geoScore'>): GeoAuditPage {
  return {
    ...p,
    geoScore: avg(
      p.entityClarity.score,
      p.answerClarity.score,
      p.topicalAuthority.score,
      p.trustSignals.score,
      p.citationReadiness.score,
      p.serpClarity.score,
    ),
  };
}

export const SPRINT1_PAGES: GeoAuditPage[] = [
  buildPage({
    id: 'home',
    path: '/',
    titleHe: 'דף הבית',
    titleEn: 'Homepage',
    pageType: 'homepage',
    priority: 'high',
    entityClarity: {
      score: 7,
      strengths: ['שם הרופאה מופיע בכותרת ראשית', 'Physician schema בדף'],
      weaknesses: ['אין כרטיס "At a Glance" עם פרטים מרוכזים', 'הסמכות רפואיות לא מוצגות בגוף הדף'],
      fixes: ['הוסיפי AuthorBadge עם הסמכות ב-hero', 'הוסיפי קישור לדף ביו בכל אזכור שם'],
    },
    answerClarity: {
      score: 5,
      strengths: ['FAQ קיים בתחתית הדף'],
      weaknesses: ['אין פסקת תשובה ישירה ב-hero', 'ה-FAQ לא פותח בתשובה ישירה בכל שאלה'],
      fixes: ['הוסיפי משפט פתיחה: "מרפאה פרטית לאלרגיה ואימונולוגיה קלינית בהוד השרון"', 'פרמטו כל FAQ עם תשובה של משפט אחד לפני הרחבה'],
    },
    topicalAuthority: {
      score: 7,
      strengths: ['מרכז ידע מקושר ל-15+ מאמרים', 'אשכולות נושאיים מכוסים'],
      weaknesses: ['חסרים אשכולות: אסתמה אלרגית, אלרגיה לתרופות'],
      fixes: ['הוסיפי קישור לאשכולות חדשים כשייווצרו'],
    },
    trustSignals: {
      score: 7,
      strengths: ['לוגו מרפאה, מיקום ברור', 'disclaimer רפואי בפוטר'],
      weaknesses: ['אין מספר רישיון רופא בגוף הדף', 'חסר LocalBusiness schema'],
      fixes: ['הוסיפי מספר רישיון ליד שם הרופאה', 'הוסיפי Organization schema מורחב'],
    },
    citationReadiness: {
      score: 5,
      strengths: ['כותרות H2 ברורות לכל סקציה'],
      weaknesses: ['אין פסקה אחת שניתן לצטט כהגדרה', 'תוכן hero שיווקי מדי — לא "extractable"'],
      fixes: ['הוסיפי פסקת הגדרה: "ihaveallergy.com היא מרפאה פרטית..."', 'הוסיפי "Key Facts" box בראש הדף'],
    },
    serpClarity: {
      score: 6,
      strengths: ['title tag מובחן', 'og:image ייחודי'],
      weaknesses: ['meta description גנרי מדי', 'H1 לא כולל מילת מפתח ראשית'],
      fixes: ['שכתבו meta description עם תשובה ישירה', 'H1: "מרפאת אלרגיה לילדים — ד״ר אנה ברמלי"'],
    },
  }),

  buildPage({
    id: 'about',
    path: '/about',
    titleHe: 'אודות',
    titleEn: 'About',
    pageType: 'about',
    priority: 'high',
    entityClarity: {
      score: 6,
      strengths: ['דף ייעודי לביוגרפיה'],
      weaknesses: ['H1 גנרי — "אודות"', 'אין רשימת הסמכות מובנית', 'חסר sameAs מורחב'],
      fixes: ['H1: "ד״ר אנה ברמלי — מומחית לאלרגיה ואימונולוגיה"', 'הוסיפי credentials list מובנה'],
    },
    answerClarity: {
      score: 4,
      strengths: ['ביוגרפיה קיימת'],
      weaknesses: ['אין פסקת סיכום citation-ready בראש', 'מבנה טקסט חופשי — קשה ל-AI לחלץ'],
      fixes: ['הוסיפי "At a Glance" card', 'פתחו ב-150 מילה bio מובנה'],
    },
    topicalAuthority: {
      score: 5,
      strengths: ['מקושר מהנאב'],
      weaknesses: ['לא מקושר למאמרים שהרופאה כתבה', 'חסר "Areas of Expertise" section'],
      fixes: ['הוסיפי רשימת תחומי התמחות', 'הוסיפי קישורים למאמרים נבחרים'],
    },
    trustSignals: {
      score: 6,
      strengths: ['ביוגרפיה אישית', 'תמונה מקצועית'],
      weaknesses: ['חסרות הסמכות ספציפיות', 'חסר פרסומים / הופעות בכנסים'],
      fixes: ['הוסיפי board certification', 'הוסיפי publication list'],
    },
    citationReadiness: {
      score: 3,
      strengths: [],
      weaknesses: ['אין פסקה יחידה שמסכמת מי הרופאה', 'פורמט טקסט חופשי לא מובנה'],
      fixes: ['צרו 2 משפטים: "ד״ר אנה ברמלי היא מומחית..."', 'הוסיפי structured credentials block'],
    },
    serpClarity: {
      score: 5,
      strengths: ['title tag ייחודי'],
      weaknesses: ['meta description דומה לדף הבית', 'SPA shell — raw HTML לא מובחן'],
      fixes: ['meta description: "ד״ר אנה ברמלי, מומחית אלרגיה ואימונולוגיה..."'],
    },
  }),

  buildPage({
    id: 'contact',
    path: '/contact',
    titleHe: 'יצירת קשר',
    titleEn: 'Contact',
    pageType: 'contact',
    priority: 'medium',
    entityClarity: {
      score: 5,
      strengths: ['כתובת ושעות פעילות'],
      weaknesses: ['חסר LocalBusiness schema', 'שם הרופאה לא מופיע'],
      fixes: ['הוסיפי LocalBusiness JSON-LD', 'הוסיפי "מרפאת ד״ר אנה ברמלי" בראש הדף'],
    },
    answerClarity: {
      score: 6,
      strengths: ['מידע ליצירת קשר ברור'],
      weaknesses: ['אין תשובה ישירה ל"איך ליצור קשר"'],
      fixes: ['הוסיפי פסקת פתיחה: "ניתן לפנות למרפאה בטלפון, בוואטסאפ או בטופס"'],
    },
    topicalAuthority: {
      score: 3,
      strengths: [],
      weaknesses: ['דף יצירת קשר לא מקושר לתוכן', 'אין FAQ קשור'],
      fixes: ['הוסיפי FAQ: "מה שעות הקבלה?", "האם צריך הפניה?"'],
    },
    trustSignals: {
      score: 7,
      strengths: ['כתובת מלאה', 'מספר טלפון', 'Waze / Google Maps'],
      weaknesses: ['חסר מספר רישיון מרפאה'],
      fixes: ['הוסיפי GeoCoordinates', 'הוסיפי שעות פעילות מובנות'],
    },
    citationReadiness: {
      score: 4,
      strengths: [],
      weaknesses: ['אין פסקה שניתן לצטט כ"contact info"'],
      fixes: ['הוסיפי פסקת סיכום: "מרפאת ד״ר אנה ברמלי, הוד השרון..."'],
    },
    serpClarity: {
      score: 5,
      strengths: ['title ברור'],
      weaknesses: ['meta description גנרי'],
      fixes: ['כתבו: "צרו קשר עם מרפאת ד״ר אנה ברמלי בהוד השרון — טלפון, וואטסאפ, טופס"'],
    },
  }),

  buildPage({
    id: 'faq',
    path: '/faq',
    titleHe: 'שאלות נפוצות',
    titleEn: 'FAQ',
    pageType: 'faq',
    priority: 'high',
    entityClarity: {
      score: 4,
      strengths: [],
      weaknesses: ['אין ייחוס לרופאה בתשובות', 'אין AuthorBadge'],
      fixes: ['הוסיפי "ד״ר אנה ברמלי עונה" בכותרת', 'הוסיפי AuthorBadge'],
    },
    answerClarity: {
      score: 7,
      strengths: ['שאלות ותשובות מובנות', 'FAQPage schema'],
      weaknesses: ['תשובות ארוכות מדי — AI לא יצטט', 'חסרה תשובה ישירה בפתיחת כל תשובה'],
      fixes: ['קצרו כל תשובה למשפט ראשון ישיר + הרחבה', 'הגבילו תשובות ל-3 משפטים'],
    },
    topicalAuthority: {
      score: 6,
      strengths: ['מכסה נושאים מגוונים'],
      weaknesses: ['שאלות לא מקושרות למאמרים רלוונטיים'],
      fixes: ['הוסיפי "קראו עוד" link בכל תשובה למאמר רלוונטי'],
    },
    trustSignals: {
      score: 5,
      strengths: ['FAQPage schema קיים'],
      weaknesses: ['חסר disclaimer רפואי', 'אין תאריך עדכון'],
      fixes: ['הוסיפי disclaimer', 'הוסיפי "עודכן לאחרונה: ..."'],
    },
    citationReadiness: {
      score: 7,
      strengths: ['פורמט Q&A טבעי ל-AI'],
      weaknesses: ['תשובות ארוכות מדי לציטוט ישיר'],
      fixes: ['כל תשובה תתחיל ב-1 משפט extractable'],
    },
    serpClarity: {
      score: 7,
      strengths: ['FAQPage rich snippets potential', 'title ברור'],
      weaknesses: ['meta description לא מזכיר שאלות ספציפיות'],
      fixes: ['meta: "תשובות מומחה לשאלות נפוצות על אלרגיה בילדים — ד״ר אנה ברמלי"'],
    },
  }),

  buildPage({
    id: 'allergy-testing',
    path: '/guides/בדיקות-אלרגיה-ילדים-ישראל',
    titleHe: 'בדיקות אלרגיה לילדים',
    titleEn: 'Allergy Testing for Children',
    pageType: 'guide',
    priority: 'high',
    entityClarity: {
      score: 7,
      strengths: ['AuthorBadge קיים', 'מיוחס לד״ר ברמלי'],
      weaknesses: ['חסרות הסמכות ספציפיות בראש הדף'],
      fixes: ['הוסיפי "מאת ד״ר אנה ברמלי, מומחית אלרגיה" ליד הכותרת'],
    },
    answerClarity: {
      score: 8,
      strengths: ['מבנה ברור עם H2 לכל סוג בדיקה', 'FAQ בתחתית'],
      weaknesses: ['חסרה פסקת TL;DR בראש'],
      fixes: ['הוסיפי "בקצרה" box: "3 סוגי בדיקות אלרגיה עיקריים..."'],
    },
    topicalAuthority: {
      score: 8,
      strengths: ['5 מאמרים לוויינים מקושרים', 'אשכול testing שלם כמעט'],
      weaknesses: ['חסר מאמר על CRD (Component Resolved Diagnostics)'],
      fixes: ['צרו מאמר לווייני על CRD'],
    },
    trustSignals: {
      score: 8,
      strengths: ['disclaimer רפואי', 'AuthorBadge', 'מקורות מרומזים'],
      weaknesses: ['חסרות הפניות מפורשות למחקרים'],
      fixes: ['הוסיפי 2-3 references לגודלינים בינלאומיים'],
    },
    citationReadiness: {
      score: 7,
      strengths: ['H2 ברורים ניתנים לחילוץ', 'פורמט Q&A'],
      weaknesses: ['חסרה טבלת השוואה בין סוגי בדיקות'],
      fixes: ['הוסיפי comparison table: skin prick vs blood vs food challenge'],
    },
    serpClarity: {
      score: 8,
      strengths: ['title ספציפי', 'meta description ייחודי'],
      weaknesses: [],
      fixes: [],
    },
  }),

  buildPage({
    id: 'food-allergy-babies',
    path: '/guides/טעימות-ראשונות-אלרגנים',
    titleHe: 'טעימות ראשונות — אלרגנים',
    titleEn: 'First Food Introduction — Allergens',
    pageType: 'guide',
    priority: 'medium',
    entityClarity: {
      score: 7,
      strengths: ['AuthorBadge', 'ייחוס ברור'],
      weaknesses: ['חסר credential inline'],
      fixes: ['הוסיפי "מאת ד״ר אנה ברמלי" בכותרת משנה'],
    },
    answerClarity: {
      score: 7,
      strengths: ['מבנה שלב-אחר-שלב', 'כותרות ספציפיות'],
      weaknesses: ['חסר TL;DR', 'חסר timeline ויזואלי'],
      fixes: ['הוסיפי "בקצרה" box', 'הוסיפי age-based timeline'],
    },
    topicalAuthority: {
      score: 9,
      strengths: ['5 מאמרים לוויינים', 'אשכול food-introduction הכי מלא באתר'],
      weaknesses: ['חסר מאמר על אלרגנים נסתרים'],
      fixes: ['צרו מאמר: "אלרגנים נסתרים במזון תעשייתי"'],
    },
    trustSignals: {
      score: 8,
      strengths: ['AuthorBadge', 'disclaimer', 'CTA מרוסן'],
      weaknesses: [],
      fixes: [],
    },
    citationReadiness: {
      score: 6,
      strengths: ['מבנה ברור'],
      weaknesses: ['חסר "Key Facts" extractable', 'אין bullet points קצרים'],
      fixes: ['הוסיפי "5 כללים להחשפה ראשונה" כ-bullet list'],
    },
    serpClarity: {
      score: 7,
      strengths: ['title ו-meta ייחודיים'],
      weaknesses: ['H1 ארוך מדי'],
      fixes: ['קצרו H1 ל-60 תווים'],
    },
  }),

  buildPage({
    id: 'milk-allergy',
    path: '/knowledge/אלרגיה-לחלב-מדריך-הורים',
    titleHe: 'אלרגיה לחלב — מדריך הורים',
    titleEn: 'Milk Allergy — Parent Guide',
    pageType: 'article',
    priority: 'high',
    entityClarity: {
      score: 3,
      strengths: [],
      weaknesses: ['דף עדיין לא קיים!'],
      fixes: ['צרו דף חדש עם AuthorBadge + Physician schema'],
    },
    answerClarity: {
      score: 1,
      strengths: [],
      weaknesses: ['תוכן חסר'],
      fixes: ['כתבו מאמר answer-first: "אלרגיה לחלב פרה היא..."'],
    },
    topicalAuthority: {
      score: 2,
      strengths: ['הנושא שייך לאשכול children-allergy'],
      weaknesses: ['פער תוכני קריטי — אלרגנים #1 בילדים'],
      fixes: ['צרו מאמר 800+ מילים', 'קשרו לדף עמוד'],
    },
    trustSignals: {
      score: 1,
      strengths: [],
      weaknesses: ['לא קיים'],
      fixes: ['כללו disclaimer, AuthorBadge, מקורות'],
    },
    citationReadiness: {
      score: 1,
      strengths: [],
      weaknesses: ['לא קיים'],
      fixes: ['פתחו עם הגדרה extractable של 2 משפטים'],
    },
    serpClarity: {
      score: 1,
      strengths: [],
      weaknesses: ['לא קיים'],
      fixes: ['צרו title + meta description ייחודיים'],
    },
  }),

  buildPage({
    id: 'bamba-reaction',
    path: '/knowledge/פריחה-אחרי-במבה',
    titleHe: 'פריחה אחרי במבה — תגובה אלרגית?',
    titleEn: 'Rash After Bamba — Allergic Reaction?',
    pageType: 'article',
    priority: 'high',
    entityClarity: {
      score: 6,
      strengths: ['AuthorBadge קיים'],
      weaknesses: ['אין credential inline', 'שם הרופאה בגוף הטקסט חסר'],
      fixes: ['הוסיפי "ד״ר אנה ברמלי מסבירה" בפסקה ראשונה'],
    },
    answerClarity: {
      score: 6,
      strengths: ['כותרת שאלה ברורה'],
      weaknesses: ['אין TL;DR box', 'התשובה לא ב-50 המילים הראשונות'],
      fixes: ['הוסיפי answer box: "פריחה אחרי במבה עשויה להיות תגובה אלרגית אך לא תמיד..."'],
    },
    topicalAuthority: {
      score: 7,
      strengths: ['חלק מאשכול food-introduction', 'מקושר לדף עמוד'],
      weaknesses: ['חסרים קישורים ל-3 מאמרים קשורים'],
      fixes: ['הוסיפי Related Articles section'],
    },
    trustSignals: {
      score: 6,
      strengths: ['AuthorBadge'],
      weaknesses: ['חסר disclaimer ייעודי', 'אין "מתי לפנות לרופא" box'],
      fixes: ['הוסיפי red flags section', 'הוסיפי disclaimer רפואי'],
    },
    citationReadiness: {
      score: 5,
      strengths: ['נושא ספציפי — טוב ל-AI'],
      weaknesses: ['אין הגדרה extractable', 'אין bullet points'],
      fixes: ['פתחו ב: "פריחה אחרי אכילת במבה היא..."'],
    },
    serpClarity: {
      score: 7,
      strengths: ['title ספציפי מאוד'],
      weaknesses: [],
      fixes: [],
    },
  }),

  buildPage({
    id: 'atopic-dermatitis',
    path: '/knowledge/אטופיק-דרמטיטיס-אכזמה-ילדים',
    titleHe: 'אטופיק דרמטיטיס (אכזמה) בילדים',
    titleEn: 'Atopic Dermatitis in Children',
    pageType: 'article',
    priority: 'high',
    entityClarity: {
      score: 3,
      strengths: [],
      weaknesses: ['דף חסר — נושא קריטי'],
      fixes: ['צרו מאמר חדש עם ייחוס מלא לרופאה'],
    },
    answerClarity: {
      score: 1,
      strengths: [],
      weaknesses: ['לא קיים'],
      fixes: ['פתחו ב: "אטופיק דרמטיטיס (אכזמה) היא מחלת עור דלקתית..."'],
    },
    topicalAuthority: {
      score: 2,
      strengths: ['נושא שייך לאשכול children-allergy'],
      weaknesses: ['פער תוכני גדול — קשר ישיר לאלרגיה'],
      fixes: ['מאמר 1000+ מילים', 'קשרו לאשכולות testing ו-food'],
    },
    trustSignals: {
      score: 1,
      strengths: [],
      weaknesses: ['לא קיים'],
      fixes: ['AuthorBadge, disclaimer, references, red flags'],
    },
    citationReadiness: {
      score: 1,
      strengths: [],
      weaknesses: ['לא קיים'],
      fixes: ['הגדרה + symptom list + severity table'],
    },
    serpClarity: {
      score: 1,
      strengths: [],
      weaknesses: ['לא קיים'],
      fixes: ['title: "אכזמה (אטופיק דרמטיטיס) בילדים — מדריך הורים"'],
    },
  }),

  buildPage({
    id: 'first-food-intro',
    path: '/אלרגיה-בילדים-מדריך-מלא',
    titleHe: 'אלרגיה בילדים — מדריך מלא',
    titleEn: 'Complete Children Allergy Guide',
    pageType: 'guide',
    priority: 'medium',
    entityClarity: {
      score: 8,
      strengths: ['AuthorBadge מלא', 'Physician schema', 'שם הרופאה בגוף הטקסט'],
      weaknesses: ['credential inline חסר בפתיחה'],
      fixes: ['הוסיפי "מאת ד״ר אנה ברמלי, מומחית אלרגיה" בסאב-טייטל'],
    },
    answerClarity: {
      score: 7,
      strengths: ['תוכן עניינים', 'H2 ברורים'],
      weaknesses: ['חסר Key Takeaway boxes per section', 'פתיחה שיווקית מדי'],
      fixes: ['הוסיפי "בקצרה" box', 'הוסיפי summary box אחרי כל H2'],
    },
    topicalAuthority: {
      score: 9,
      strengths: ['דף עמוד מרכזי', '2000+ מילים', 'מקושר ל-15+ מאמרים'],
      weaknesses: ['אשכולות חדשים (אכזמה, אסתמה) עדיין לא מקושרים'],
      fixes: ['הוסיפי קישורים כשמאמרים חדשים ייווצרו'],
    },
    trustSignals: {
      score: 9,
      strengths: ['AuthorBadge', 'disclaimer', 'מקורות מרומזים', 'CTA מרוסן'],
      weaknesses: [],
      fixes: [],
    },
    citationReadiness: {
      score: 6,
      strengths: ['H2 ברורים'],
      weaknesses: ['סקציות ארוכות ללא bullet points', 'חסרות טבלאות'],
      fixes: ['הוסיפי bullet lists ב-key sections', 'הוסיפי age/allergen table'],
    },
    serpClarity: {
      score: 8,
      strengths: ['title + meta ייחודיים', 'H1 ספציפי'],
      weaknesses: [],
      fixes: [],
    },
  }),

  buildPage({
    id: 'rights-allergic-child',
    path: '/guides/זכויות-ילד-אלרגי-ישראל',
    titleHe: 'זכויות ילד אלרגי בישראל',
    titleEn: 'Rights of Allergic Children in Israel',
    pageType: 'guide',
    priority: 'medium',
    entityClarity: {
      score: 6,
      strengths: ['AuthorBadge'],
      weaknesses: ['ייחוס רופאה חלש — נושא משפטי/זכויות'],
      fixes: ['הדגישי שהמידע נכתב בליווי מומחית אלרגיה'],
    },
    answerClarity: {
      score: 7,
      strengths: ['מבנה שאלה-תשובה טבעי'],
      weaknesses: ['חסר "5 הזכויות המרכזיות" כרשימה'],
      fixes: ['הוסיפי summary list בראש הדף'],
    },
    topicalAuthority: {
      score: 8,
      strengths: ['5 מאמרים לוויינים', 'אשכול שלם'],
      weaknesses: ['חסר מאמר על ביטוח בריאות'],
      fixes: ['שקלו מאמר על כיסוי ביטוחי'],
    },
    trustSignals: {
      score: 7,
      strengths: ['AuthorBadge', 'מידע מעשי'],
      weaknesses: ['חסרות הפניות לחקיקה ספציפית'],
      fixes: ['הוסיפי מספרי חוקים וחוזרי מנכ"ל'],
    },
    citationReadiness: {
      score: 7,
      strengths: ['נושא ייחודי מאוד — סיכוי גבוה לציטוט'],
      weaknesses: ['תשובות ארוכות מדי'],
      fixes: ['קצרו כל תשובה למשפט ראשון ישיר'],
    },
    serpClarity: {
      score: 8,
      strengths: ['title ו-meta ייחודיים', 'אין תחרות ישירה על מילת המפתח'],
      weaknesses: [],
      fixes: [],
    },
  }),

  buildPage({
    id: 'services',
    path: '/services',
    titleHe: 'שירותים',
    titleEn: 'Services',
    pageType: 'service',
    priority: 'medium',
    entityClarity: {
      score: 5,
      strengths: ['שירותים מיוחסים למרפאה'],
      weaknesses: ['אין ייחוס ספציפי לרופאה בכל שירות', 'חסר MedicalProcedure schema'],
      fixes: ['הוסיפי "ד״ר ברמלי מבצעת..." בכל שירות', 'הוסיפי MedicalProcedure schema'],
    },
    answerClarity: {
      score: 4,
      strengths: ['רשימת שירותים ברורה'],
      weaknesses: ['אין "What to Expect" per service', 'תיאורים שיווקיים — לא answer-first'],
      fixes: ['הוסיפי פסקת הגדרה לכל שירות', 'הוסיפי "מה לצפות" section'],
    },
    topicalAuthority: {
      score: 5,
      strengths: ['מכסה שירותים מרכזיים'],
      weaknesses: ['שירותים לא מקושרים למאמרי knowledge'],
      fixes: ['קשרו כל שירות ל-2 מאמרים רלוונטיים'],
    },
    trustSignals: {
      score: 5,
      strengths: ['מחירים (אם מוצגים)'],
      weaknesses: ['חסר preparation instructions', 'חסר duration info'],
      fixes: ['הוסיפי "כמה זמן לוקח" ו"איך להתכונן" per service'],
    },
    citationReadiness: {
      score: 3,
      strengths: [],
      weaknesses: ['אין הגדרות extractable', 'אין structured data per service'],
      fixes: ['הוסיפי 1-line definition per service', 'הוסיפי MedicalProcedure schema'],
    },
    serpClarity: {
      score: 5,
      strengths: [],
      weaknesses: ['title גנרי: "שירותים"', 'meta description לא ספציפי'],
      fixes: ['title: "שירותי אלרגיה ואימונולוגיה — ד״ר אנה ברמלי"'],
    },
  }),
];
