/**
 * GEO data models and site audit data for ihaveallergy.com
 * — a physician-led pediatric allergy clinic.
 */

// ── Types ──

export interface GeoPage {
  id: string;
  path: string;
  titleHe: string;
  titleEn: string;
  type: 'pillar' | 'guide' | 'satellite' | 'profile' | 'service' | 'landing' | 'legal';
  cluster: string;
  geoScore: number;          // 0-100
  entitySignalScore: number;
  answerReadiness: number;
  structureScore: number;
  trustScore: number;
  status: 'optimized' | 'needs-work' | 'critical' | 'draft';
  priority: 'high' | 'medium' | 'low';
  issues: string[];
  opportunities: string[];
  lastAudited: string;
}

export interface EntitySignal {
  id: string;
  entity: string;
  type: 'physician' | 'organization' | 'condition' | 'procedure' | 'location';
  consistency: number;
  pagesPresent: number;
  pagesTotal: number;
  issues: string[];
  fixes: string[];
}

export interface PageTemplate {
  id: string;
  nameHe: string;
  nameEn: string;
  description: string;
  sections: string[];
  schemaType: string;
  answerFormat: string;
  usedBy: string[];
}

// ── Scoring Weights (legacy — Sprint 5 uses 10-dimension model) ──

export const GEO_WEIGHTS = {
  entitySignal: 0.20,
  answerReadiness: 0.25,
  structureClarity: 0.20,
  trustAuthority: 0.20,
  internalLinking: 0.15,
} as const;

export function computeGeoScore(page: Pick<GeoPage, 'entitySignalScore' | 'answerReadiness' | 'structureScore' | 'trustScore'>): number {
  const linking = Math.min(page.structureScore, page.trustScore);
  return Math.round(
    page.entitySignalScore * GEO_WEIGHTS.entitySignal +
    page.answerReadiness * GEO_WEIGHTS.answerReadiness +
    page.structureScore * GEO_WEIGHTS.structureClarity +
    page.trustScore * GEO_WEIGHTS.trustAuthority +
    linking * GEO_WEIGHTS.internalLinking
  );
}

// ── Site Pages ──

export const GEO_PAGES: GeoPage[] = [
  {
    id: 'home', path: '/', titleHe: 'דף הבית', titleEn: 'Homepage',
    type: 'landing', cluster: 'brand', geoScore: 62,
    entitySignalScore: 70, answerReadiness: 45, structureScore: 65, trustScore: 75,
    status: 'needs-work', priority: 'high',
    issues: [
      'חסר בלוק תשובה ישיר "מה זה ihaveallergy.com"',
      'שאלות נפוצות ללא תשובת פתיחה של משפט אחד',
      'ישות הרופאה לא מקושרת לבלוק author מובנה',
    ],
    opportunities: [
      'הוסף hero answer: "מרפאה פרטית לאלרגיה ואימונולוגיה בהוד השרון"',
      'מבנה FAQ עם תשובה ישירה ראשונה',
      'הוסף סקציית "למה לבחור בנו" עם טענות ברות ציטוט',
    ],
    lastAudited: '2026-04-12',
  },
  {
    id: 'about', path: '/about', titleHe: 'אודות', titleEn: 'About',
    type: 'profile', cluster: 'brand', geoScore: 55,
    entitySignalScore: 60, answerReadiness: 40, structureScore: 55, trustScore: 70,
    status: 'needs-work', priority: 'high',
    issues: [
      'H1 גנרי — לא ממוקד ישות',
      'חסרה רשימת credentials (הסמכות, התמחויות)',
      'חסר snippet "מיהי ד״ר ברמלי" בראש הדף',
    ],
    opportunities: [
      'פתח בפסקה ברת ציטוט',
      'הוסף סקציית credentials מובנית',
      'הוסף "תחומי מומחיות" עם schema markup',
    ],
    lastAudited: '2026-04-12',
  },
  {
    id: 'dr-anna', path: '/dr-anna-brameli', titleHe: 'ד״ר אנה ברמלי', titleEn: 'Dr. Anna Brameli',
    type: 'profile', cluster: 'entity', geoScore: 68,
    entitySignalScore: 80, answerReadiness: 55, structureScore: 70, trustScore: 82,
    status: 'needs-work', priority: 'high',
    issues: [
      'HTML לא ייחודי (מגבלת SPA)',
      'חסרה פסקת סיכום snippet-ready',
      'sameAs דל — חסרים פנקס רופאים, LinkedIn',
    ],
    opportunities: [
      'הוסף כרטיס "במבט חטוף" עם עובדות מפתח',
      'הוסף רשימת פרסומים / הרצאות',
      'הרחב sameAs עם קישורים לרישום רפואי',
    ],
    lastAudited: '2026-04-12',
  },
  {
    id: 'whois', path: '/whois', titleHe: 'מי זה', titleEn: 'Who Is',
    type: 'profile', cluster: 'entity', geoScore: 58,
    entitySignalScore: 65, answerReadiness: 60, structureScore: 50, trustScore: 65,
    status: 'needs-work', priority: 'medium',
    issues: ['תשובות FAQ ארוכות מדי לציטוט AI', 'חסר פורמט תשובה ישירה'],
    opportunities: ['קצר תשובות ל-1-2 משפטים + הרחבה', 'הוסף כרטיס "עובדות מהירות"'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'services', path: '/services', titleHe: 'שירותים', titleEn: 'Services',
    type: 'service', cluster: 'brand', geoScore: 50,
    entitySignalScore: 45, answerReadiness: 35, structureScore: 55, trustScore: 60,
    status: 'needs-work', priority: 'medium',
    issues: [
      'שירותים לא ניתנים לגישה בודדת (URL יחיד)',
      'חסר MedicalProcedure schema לכל שירות',
      'חסרים בלוקי "מה לצפות" לכל בדיקה',
    ],
    opportunities: [
      'הוסף MedicalProcedure schema לכל שירות',
      'צור תיאורי answer-first לכל שירות (בדיקת עור, אתגר מזון, ייעוץ אלרגיה)',
      'קשר כל שירות למאמרי ידע רלוונטיים',
    ],
    lastAudited: '2026-04-12',
  },
  {
    id: 'pillar-allergy', path: '/אלרגיה-בילדים-מדריך-מלא',
    titleHe: 'אלרגיה בילדים — מדריך מלא', titleEn: 'Children Allergy Complete Guide',
    type: 'pillar', cluster: 'children-allergy', geoScore: 75,
    entitySignalScore: 72, answerReadiness: 70, structureScore: 80, trustScore: 85,
    status: 'optimized', priority: 'medium',
    issues: ['חלק מהסקציות חסרות פתיחת תשובה ישירה', 'תוכן עניינים יכול להיות מפורט יותר'],
    opportunities: ['הוסף תיבות Key Takeaway לכל סקציה', 'הוסף טבלאות גיל-מזון-המלצה', 'חזק קישורים פנימיים למאמרים לוויינים'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'guide-first-tastes', path: '/guides/טעימות-ראשונות-אלרגנים',
    titleHe: 'טעימות ראשונות — אלרגנים', titleEn: 'First Tastes — Allergens Guide',
    type: 'guide', cluster: 'food-introduction', geoScore: 72,
    entitySignalScore: 68, answerReadiness: 65, structureScore: 78, trustScore: 80,
    status: 'optimized', priority: 'low',
    issues: ['חסר ציר זמן לפי גיל'],
    opportunities: ['הוסף ציר זמן ויזואלי להכנסת אלרגנים לפי גיל'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'guide-rights', path: '/guides/זכויות-ילד-אלרגי-ישראל',
    titleHe: 'זכויות ילד אלרגי בישראל', titleEn: 'Allergy Child Rights in Israel',
    type: 'guide', cluster: 'rights', geoScore: 70,
    entitySignalScore: 65, answerReadiness: 68, structureScore: 75, trustScore: 78,
    status: 'optimized', priority: 'low',
    issues: ['הפניות משפטיות לא מספיק ספציפיות'],
    opportunities: ['הוסף מספרי חוקים ותקנות', 'קשר למקורות ממשלתיים'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'guide-testing', path: '/guides/בדיקות-אלרגיה-ילדים-ישראל',
    titleHe: 'בדיקות אלרגיה לילדים בישראל', titleEn: 'Allergy Testing for Children in Israel',
    type: 'guide', cluster: 'testing', geoScore: 71,
    entitySignalScore: 66, answerReadiness: 70, structureScore: 74, trustScore: 78,
    status: 'optimized', priority: 'low',
    issues: ['חסרה טבלת השוואת בדיקות'],
    opportunities: ['הוסף טבלת השוואה: דקירה vs דם vs IgE', 'הוסף טווחי עלות משוערים'],
    lastAudited: '2026-04-12',
  },
  // ── Satellite articles with differentiated, realistic scores ──
  {
    id: 'k-rash-bamba', path: '/knowledge/פריחה-אחרי-במבה',
    titleHe: 'פריחה אחרי במבה', titleEn: 'Rash after Bamba',
    type: 'satellite', cluster: 'food-introduction', geoScore: 65,
    entitySignalScore: 60, answerReadiness: 70, structureScore: 68, trustScore: 78,
    status: 'needs-work', priority: 'medium',
    issues: ['חסרה הבחנה ברורה: אלרגיה vs רגישות סביב הפה', 'חסרים סימני אזהרה (red flags)'],
    opportunities: ['הוסף טבלת אלרגיה vs רגישות', 'הוסף סקציית "מתי לפנות לרופא"'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-redness-mouth', path: '/knowledge/אודם-סביב-הפה-אחרי-אלרגן',
    titleHe: 'אודם סביב הפה', titleEn: 'Redness around mouth',
    type: 'satellite', cluster: 'food-introduction', geoScore: 62,
    entitySignalScore: 55, answerReadiness: 68, structureScore: 65, trustScore: 75,
    status: 'needs-work', priority: 'medium',
    issues: ['חסרה תשובת הרגעה ברורה בפתיחה', 'לא מבחין בין contact irritation לאלרגיה אמיתית'],
    opportunities: ['פתח ב-"אודם סביב הפה לאחר אכילה לרוב אינו אלרגיה"', 'הוסף תמונות המחשה'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-bamba-4months', path: '/knowledge/במבה-גיל-4-חודשים',
    titleHe: 'במבה בגיל 4 חודשים', titleEn: 'Bamba at 4 months',
    type: 'satellite', cluster: 'food-introduction', geoScore: 72,
    entitySignalScore: 68, answerReadiness: 75, structureScore: 72, trustScore: 80,
    status: 'optimized', priority: 'low',
    issues: ['חסרה הפניה למחקר LEAP', 'חסרים summary bullets'],
    opportunities: ['הוסף ציטוט LEAP study', 'הוסף 3-4 נקודות סיכום בראש'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-vomiting-tahini', path: '/knowledge/הקאה-אחרי-טחינה',
    titleHe: 'הקאה אחרי טחינה', titleEn: 'Vomiting after tahini',
    type: 'satellite', cluster: 'food-introduction', geoScore: 60,
    entitySignalScore: 52, answerReadiness: 62, structureScore: 63, trustScore: 72,
    status: 'needs-work', priority: 'medium',
    issues: ['לא מבחין בין FPIES לאלרגיית IgE', 'חסר פרוטוקול: מה לעשות עכשיו'],
    opportunities: ['הוסף סקציית "הקאה חוזרת vs חד-פעמית"', 'הוסף בלוק "צעד הבא" ברור'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-days-allergens', path: '/knowledge/כמה-ימים-בין-אלרגנים',
    titleHe: 'כמה ימים בין אלרגנים', titleEn: 'Days between allergens',
    type: 'satellite', cluster: 'food-introduction', geoScore: 63,
    entitySignalScore: 58, answerReadiness: 72, structureScore: 62, trustScore: 74,
    status: 'needs-work', priority: 'medium',
    issues: ['תשובה ישירה טובה אבל חסרות הנחיות לפי גיל', 'חסר לוח זמנים ויזואלי'],
    opportunities: ['הוסף טבלה: גיל → מרווח מומלץ', 'קשר למדריך טעימות ראשונות'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-garden-refuse', path: '/knowledge/גן-יכול-לסרב-לילד-אלרגי',
    titleHe: 'גן מסרב לקבל ילד אלרגי', titleEn: 'Kindergarten refusal',
    type: 'satellite', cluster: 'rights', geoScore: 67,
    entitySignalScore: 60, answerReadiness: 73, structureScore: 70, trustScore: 76,
    status: 'needs-work', priority: 'medium',
    issues: ['חסרה הפניה לחוק חינוך מיוחד', 'חסר טופס/מכתב לדוגמה'],
    opportunities: ['הוסף ציטוט חוק + מספר סעיף', 'הוסף "מה לכתוב לגן" — תבנית מכתב'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-epipen', path: '/knowledge/אפיפן-בגן-מי-אחראי',
    titleHe: 'אפיפן בגן — מי אחראי', titleEn: 'EpiPen responsibility',
    type: 'satellite', cluster: 'rights', geoScore: 64,
    entitySignalScore: 58, answerReadiness: 68, structureScore: 66, trustScore: 74,
    status: 'needs-work', priority: 'medium',
    issues: ['חסר הבחנה: גן פרטי vs ציבורי', 'חסר פרוטוקול השתמשות באפיפן'],
    opportunities: ['הוסף טבלת אחריות: הורה vs גננת vs מנהלת', 'קשר לדף חירום אלרגי (כשיווצר)'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-medical-aide', path: '/knowledge/סייעת-רפואית-לילד-אלרגי',
    titleHe: 'סייעת רפואית לילד אלרגי', titleEn: 'Medical aide',
    type: 'satellite', cluster: 'rights', geoScore: 66,
    entitySignalScore: 62, answerReadiness: 70, structureScore: 68, trustScore: 78,
    status: 'needs-work', priority: 'medium',
    issues: ['חסרים קריטריוני זכאות ברורים', 'חסר תהליך הגשת בקשה'],
    opportunities: ['הוסף רשימת תנאי זכאות', 'הוסף "צעדים להגשת בקשה" מספור'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-school-trip', path: '/knowledge/טיול-שנתי-ילד-אלרגי',
    titleHe: 'טיול שנתי — ילד אלרגי', titleEn: 'School trip allergy',
    type: 'satellite', cluster: 'rights', geoScore: 61,
    entitySignalScore: 55, answerReadiness: 65, structureScore: 62, trustScore: 75,
    status: 'needs-work', priority: 'medium',
    issues: ['חסרה רשימת ציוד חירום לטיול', 'חסר טופס אישור רפואי לטיול'],
    opportunities: ['הוסף checklist הכנה לטיול', 'הוסף תבנית אישור רפואי להורדה'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-allergy-cert', path: '/knowledge/אישור-אלרגיה-למשרד-החינוך',
    titleHe: 'אישור אלרגיה למשרד החינוך', titleEn: 'Allergy certificate',
    type: 'satellite', cluster: 'rights', geoScore: 68,
    entitySignalScore: 64, answerReadiness: 72, structureScore: 70, trustScore: 78,
    status: 'needs-work', priority: 'low',
    issues: ['חסרה דוגמה לאישור מלא', 'חסר הסבר מה קורה אם הגן לא משתף פעולה'],
    opportunities: ['הוסף דוגמה/תבנית אישור', 'הוסף סקציית "מה אם נתקלים בסירוב"'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-skin-prick', path: '/knowledge/תבחיני-עור-כואב-לילדים',
    titleHe: 'תבחיני עור — כואב לילדים?', titleEn: 'Skin prick pain',
    type: 'satellite', cluster: 'testing', geoScore: 71,
    entitySignalScore: 65, answerReadiness: 78, structureScore: 72, trustScore: 80,
    status: 'optimized', priority: 'low',
    issues: ['חסרה השוואת כאב: דקירה vs דם'],
    opportunities: ['הוסף טבלת השוואה: דקירה vs בדיקת דם (כאב, דיוק, גיל מינ׳)'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-blood-test', path: '/knowledge/בדיקת-דם-לאלרגיה-ילדים',
    titleHe: 'בדיקת דם לאלרגיה', titleEn: 'Blood test allergy',
    type: 'satellite', cluster: 'testing', geoScore: 63,
    entitySignalScore: 58, answerReadiness: 65, structureScore: 64, trustScore: 76,
    status: 'needs-work', priority: 'medium',
    issues: ['חסר הסבר מה בודקים (IgE ספציפי)', 'חסר פירוש ערכי תוצאות'],
    opportunities: ['הוסף "איך לקרוא תוצאות בדיקת דם"', 'הוסף טבלת ערכי IgE ומשמעותם'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-food-challenge', path: '/knowledge/תגר-מזון-איך-זה-נראה',
    titleHe: 'תגר מזון — איך זה נראה', titleEn: 'Oral food challenge',
    type: 'satellite', cluster: 'testing', geoScore: 70,
    entitySignalScore: 66, answerReadiness: 74, structureScore: 72, trustScore: 80,
    status: 'optimized', priority: 'low',
    issues: ['חסר תיבת "מה לצפות" ויזואלית'],
    opportunities: ['הוסף ציר זמן של יום האתגר', 'הוסף CTA: "לקבוע אתגר מזון"'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-positive-no-symptoms', path: '/knowledge/בדיקה-חיובית-בלי-תסמינים',
    titleHe: 'בדיקה חיובית בלי תסמינים', titleEn: 'Positive without symptoms',
    type: 'satellite', cluster: 'testing', geoScore: 68,
    entitySignalScore: 62, answerReadiness: 75, structureScore: 68, trustScore: 78,
    status: 'needs-work', priority: 'medium',
    issues: ['חסר הסבר על sensitization vs clinical allergy', 'חסר צעד הבא ברור'],
    opportunities: ['הוסף "מה ההבדל בין רגישות לאלרגיה קלינית"', 'הוסף "מה לעשות עכשיו" — 3 צעדים'],
    lastAudited: '2026-04-12',
  },
  {
    id: 'k-private-vs-public', path: '/knowledge/בדיקות-אלרגיה-פרטי-או-קופה',
    titleHe: 'פרטי או קופת חולים', titleEn: 'Private vs public',
    type: 'satellite', cluster: 'testing', geoScore: 64,
    entitySignalScore: 56, answerReadiness: 68, structureScore: 66, trustScore: 72,
    status: 'needs-work', priority: 'medium',
    issues: ['חסרה טבלת השוואה מובנית', 'חסרים נתוני זמני המתנה'],
    opportunities: ['הוסף טבלה: עלות, זמן המתנה, מגוון בדיקות', 'הוסף CTA: "רוצה בדיקה ללא המתנה?"'],
    lastAudited: '2026-04-12',
  },
];

// ── Entity Signals ──

export const ENTITY_SIGNALS: EntitySignal[] = [
  {
    id: 'physician',
    entity: 'ד״ר אנה ברמלי / Dr. Anna Brameli',
    type: 'physician',
    consistency: 72,
    pagesPresent: 18, pagesTotal: 28,
    issues: [
      'שם משתנה בין דפים (ברמלי vs Brameli)',
      'credentials לא מופיעים בכל דף רפואי',
      'AuthorBadge חסר ב-10 מאמרים לוויינים',
    ],
    fixes: [
      'אחד שם ל: ד״ר אנה ברמלי (עברית) / Dr. Anna Brameli (אנגלית)',
      'הוסף AuthorBadge עם קישור לביוגרפיה בכל דף רפואי',
      'הוסף Physician schema עם sameAs מלא בדפי פרופיל',
    ],
  },
  {
    id: 'clinic',
    entity: 'ihaveallergy.com — מרפאת אלרגיה',
    type: 'organization',
    consistency: 65,
    pagesPresent: 12, pagesTotal: 28,
    issues: [
      'Organization schema רק בדף הבית',
      'אין שם מרפאה אחיד בכל הדפים',
      'חסר LocalBusiness schema בדף יצירת קשר',
    ],
    fixes: [
      'הוסף Organization schema ל-footer',
      'אחד שם מותג: "מרפאת iHaveAllergy — ד״ר אנה ברמלי"',
      'הוסף LocalBusiness JSON-LD לדף Contact',
    ],
  },
  {
    id: 'location',
    entity: 'הוד השרון, ישראל',
    type: 'location',
    consistency: 55,
    pagesPresent: 8, pagesTotal: 28,
    issues: [
      'מיקום מוזכר בצורה לא עקבית',
      'חסר GeoCoordinates ברוב הדפים',
      'ערי שרון בפוטר לא מקושרות ל-schema',
    ],
    fixes: [
      'הוסף כתובת מלאה + GeoCoordinates ל-Organization schema',
      'ודא שם עיר אחיד: "הוד השרון"',
      'קשר ערים בפוטר ל-areaServed ב-schema',
    ],
  },
  {
    id: 'specialty',
    entity: 'אלרגיה ואימונולוגיה קלינית',
    type: 'condition',
    consistency: 80,
    pagesPresent: 24, pagesTotal: 28,
    issues: [
      'ניסוח התמחות משתנה (אלרגיה / אלרגולוגיה / אימונולוגיה)',
    ],
    fixes: [
      'אחד ל: "אלרגיה ואימונולוגיה קלינית" בכל מקום',
      'הוסף medicalSpecialty: "AllergyAndImmunology" לכל MedicalWebPage schema',
    ],
  },
];

// ── Page Templates (allergy-specific) ──

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'satellite-article',
    nameHe: 'מאמר ידע — תסמין / שאלת הורה',
    nameEn: 'Knowledge Article',
    description: 'מאמר answer-first לשאלה ספציפית של הורה. ממוקד בתשובה ישירה, סימני אזהרה, וצעד הבא.',
    sections: [
      'TL;DR — תשובה ב-1-2 משפטים',
      'תשובה רפואית מלאה (300-500 מילים)',
      'מתי לפנות לרופא אלרגיה',
      'מה הורים צריכים לדעת',
      'שאלות קשורות (FAQ schema)',
      'AuthorBadge + disclaimer רפואי',
      'מאמרים קשורים (3 קישורים)',
      'CTA — ייעוץ בוואטסאפ',
    ],
    schemaType: 'MedicalWebPage + FAQPage',
    answerFormat: 'תשובה ישירה → הרחבה → פעולה',
    usedBy: ['/knowledge/*'],
  },
  {
    id: 'pillar-guide',
    nameHe: 'מדריך מקיף (Pillar)',
    nameEn: 'Pillar Guide',
    description: 'מדריך 2000+ מילים שמשמש כציר מרכזי לאשכול נושאי: אלרגיה למזון, בדיקות, זכויות.',
    sections: [
      'Hero + תיבת Key Takeaway',
      'תוכן עניינים (auto-linked)',
      'סקציות H2 עם פתיחת answer-first',
      'Key Takeaway לכל סקציה',
      'טבלת נתונים / השוואה (כשרלוונטי)',
      'FAQ (3-5 שאלות)',
      'AuthorBadge + reviewed date',
      'רשת קישורים למאמרים לוויינים',
      'CTA בודד בסוף',
    ],
    schemaType: 'MedicalWebPage + FAQPage + BreadcrumbList',
    answerFormat: 'סקירה → סקציות מעמיקות → FAQ → קישורים',
    usedBy: ['/אלרגיה-בילדים-מדריך-מלא', '/guides/*'],
  },
  {
    id: 'physician-profile',
    nameHe: 'פרופיל רופא',
    nameEn: 'Physician Profile',
    description: 'דף ממוקד E-E-A-T לבניית Knowledge Panel ואמון AI. ספציפי לאלרגולוגית.',
    sections: [
      'כרטיס "במבט חטוף" (שם, התמחות, מיקום, credentials)',
      'ביו מקצועי (150 מילים, בר ציטוט)',
      'תחומי מומחיות באלרגיה',
      'השכלה והסמכות',
      'פרסומים ומדיה',
      'מידע מרפאה',
      'sameAs (פנקס רופאים, LinkedIn, פורטלי בריאות)',
    ],
    schemaType: 'Physician + MedicalBusiness',
    answerFormat: 'עובדות מובנות → ביו → credentials',
    usedBy: ['/dr-anna-brameli', '/about'],
  },
  {
    id: 'service-page',
    nameHe: 'דף שירות רפואי',
    nameEn: 'Medical Service Page',
    description: 'דף שירות עם MedicalProcedure schema ומידע מעשי להורים. למשל: בדיקת עור, אתגר מזון.',
    sections: [
      'שם השירות + תשובה של שורה אחת',
      'מה הבדיקה / הטיפול?',
      'למי זה מתאים?',
      'מה לצפות בביקור',
      'משך + הכנה',
      'FAQ (2-3 שאלות ספציפיות)',
      'CTA לקביעת תור',
    ],
    schemaType: 'MedicalProcedure + FAQPage',
    answerFormat: 'הגדרה → מדריך מטופל → FAQ → CTA',
    usedBy: ['/services'],
  },
];
