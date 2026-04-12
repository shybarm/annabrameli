/**
 * Sprint 3 — Authority Layer & Entity Clarity
 * Scorecard data, trust evaluation, and AI-trust assessment for ihaveallergy.com
 */

// ── Types ─────────────────────────────────────────────────────────────

export type ScoreLevel = 'strong' | 'moderate' | 'weak' | 'missing';

export interface AuthoritySignal {
  id: string;
  labelHe: string;
  labelEn: string;
  status: ScoreLevel;
  currentValue: string;
  recommendedValue: string;
  aiImpact: string;
  fixPriority: 'high' | 'medium' | 'low';
}

export interface AuthorityCategory {
  id: string;
  titleHe: string;
  titleEn: string;
  icon: string;
  score: number; // 0-100
  signals: AuthoritySignal[];
}

export interface PageTrustAssessment {
  path: string;
  titleHe: string;
  aiTrustScore: number; // 0-10
  wouldCite: boolean;
  reasons: string[];
  fixes: string[];
}

export interface ExternalOpportunity {
  id: string;
  type: 'citation' | 'directory' | 'guest-content' | 'podcast' | 'partnership' | 'commentary' | 'mention';
  titleHe: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'high' | 'medium' | 'low';
  status: 'not-started' | 'in-progress' | 'done';
  actionUrl?: string;
}

export interface BrandFragment {
  id: string;
  variant: string;
  location: string;
  isCanonical: boolean;
  issue: string;
  fix: string;
}

// ── Data ──────────────────────────────────────────────────────────────

export const AUTHORITY_CATEGORIES: AuthorityCategory[] = [
  {
    id: 'entity-consistency',
    titleHe: 'עקביות ישות ראשית',
    titleEn: 'Primary Entity Consistency',
    icon: '🎯',
    score: 62,
    signals: [
      {
        id: 'doctor-name', labelHe: 'שם מלא של הרופאה', labelEn: 'Doctor Full Name',
        status: 'moderate',
        currentValue: 'משתנה: "ד״ר אנה ברמלי", "Dr. Anna Brameli", "ד״ר ברמלי"',
        recommendedValue: 'ד״ר אנה ברמלי (עברית) / Dr. Anna Brameli (EN) — עקבי בכל דף',
        aiImpact: 'מנועי AI מקשרים ישויות לפי שם עקבי. שמות שונים = ישויות נפרדות.',
        fixPriority: 'high',
      },
      {
        id: 'clinic-name', labelHe: 'שם מרפאה / מותג', labelEn: 'Clinic/Brand Name',
        status: 'weak',
        currentValue: 'לא עקבי: "ihaveallergy", "יש לי אלרגיה", "מרפאת ד״ר ברמלי"',
        recommendedValue: 'שם קנוני אחד: "מרפאת ד״ר אנה ברמלי — ihaveallergy.com"',
        aiImpact: 'פיצול מותג = AI לא יודע מה המותג. צריך שם אחד קנוני.',
        fixPriority: 'high',
      },
      {
        id: 'specialty', labelHe: 'ניסוח התמחות', labelEn: 'Specialty Wording',
        status: 'moderate',
        currentValue: '"אלרגיה ואימונולוגיה", "אלרגולוגית", "מומחית אלרגיה"',
        recommendedValue: '"מומחית לאלרגיה ואימונולוגיה קלינית" — ניסוח אחיד',
        aiImpact: 'ניסוח אחיד מחזק את ה-Knowledge Panel ומאפשר ציטוט מדויק.',
        fixPriority: 'medium',
      },
      {
        id: 'about-consistency', labelHe: 'עקביות מסרים ב-About', labelEn: 'About Messaging',
        status: 'moderate',
        currentValue: 'דף About ו-WhoIs חופפים חלקית — מסרים שונים',
        recommendedValue: 'דף About = סיפור + גישה. WhoIs = גילוי + FAQ. ללא סתירות.',
        aiImpact: 'דפים סותרים מבלבלים AI. כל דף צריך מטרה ייחודית.',
        fixPriority: 'medium',
      },
      {
        id: 'byline-consistency', labelHe: 'ייחוס מחבר במאמרים', labelEn: 'Article Bylines',
        status: 'strong',
        currentValue: 'AuthorBadge קיים ברוב המאמרים עם קישור לפרופיל',
        recommendedValue: 'AuthorBadge + credentials קצרים בכל מאמר ללא יוצא מהכלל',
        aiImpact: 'ייחוס מחבר עקבי = E-E-A-T חזק. AI מעדיף מקורות עם מחבר מזוהה.',
        fixPriority: 'low',
      },
    ],
  },
  {
    id: 'expert-presentation',
    titleHe: 'הצגת מומחיות',
    titleEn: 'Expert Presentation',
    icon: '👩‍⚕️',
    score: 55,
    signals: [
      {
        id: 'credentials', labelHe: 'הסמכות ורישיונות', labelEn: 'Credentials Section',
        status: 'moderate',
        currentValue: 'קיים בדף About — רישיון ישראלי, ECFMG, מומחית ילדים',
        recommendedValue: 'הוסיפו: Board certification אלרגיה, fellowship details, מספר שנות ניסיון',
        aiImpact: 'Credentials מלאים = אמינות גבוהה. AI מצטט רופאים עם הסמכות מפורטות.',
        fixPriority: 'high',
      },
      {
        id: 'experience-summary', labelHe: 'סיכום ניסיון', labelEn: 'Experience Summary',
        status: 'weak',
        currentValue: 'Timeline קיים אבל אין פסקת סיכום מהירה',
        recommendedValue: 'פסקה אחת בראש דף פרופיל: "15+ שנות ניסיון, 5000+ מטופלים, Vanderbilt fellowship"',
        aiImpact: 'פסקת סיכום = extractable snippet. AI ישתמש בזה ב-Knowledge Panel.',
        fixPriority: 'high',
      },
      {
        id: 'specialization-areas', labelHe: 'תחומי התמחות', labelEn: 'Areas of Specialization',
        status: 'moderate',
        currentValue: 'מפוזר בדפי שירות — אין רשימה מרוכזת',
        recommendedValue: 'רשימת 5-7 תחומי התמחות בדף פרופיל + schema medicalSpecialty',
        aiImpact: 'רשימה מובנית = AI יודע למפות את הרופאה לנושאים ספציפיים.',
        fixPriority: 'medium',
      },
      {
        id: 'positioning', labelHe: 'מיצוב מקצועי', labelEn: 'Professional Positioning',
        status: 'weak',
        currentValue: 'אין statement ברור: "למה דווקא ד״ר ברמלי?"',
        recommendedValue: 'USP ברור: fellowship אמריקאי + ניסיון ישראלי + גישה אנושית',
        aiImpact: 'מיצוב ברור עוזר ל-AI להבדיל בין מומחים ולהמליץ ספציפית.',
        fixPriority: 'medium',
      },
      {
        id: 'article-review', labelHe: 'ביקורת רפואית על מאמרים', labelEn: 'Article Review',
        status: 'moderate',
        currentValue: '"נבדק רפואית" קיים — חסר תאריך ביקורת ו-review methodology',
        recommendedValue: 'בכל מאמר: "נבדק רפואית על ידי ד״ר אנה ברמלי | עודכן: [תאריך]"',
        aiImpact: 'תאריך ביקורת = freshness signal. AI מעדיף תוכן שנבדק לאחרונה.',
        fixPriority: 'medium',
      },
    ],
  },
  {
    id: 'trust-architecture',
    titleHe: 'ארכיטקטורת אמון',
    titleEn: 'Trust Architecture',
    icon: '🛡️',
    score: 70,
    signals: [
      {
        id: 'contact-visibility', labelHe: 'נראות יצירת קשר', labelEn: 'Contact Visibility',
        status: 'strong',
        currentValue: 'דף Contact קיים + WhatsApp CTA + טלפון',
        recommendedValue: 'הוסיפו phone schema + contactPoint ב-JSON-LD בכל דף',
        aiImpact: 'מידע קשר נגיש = סימן לגיטימיות. AI מעדיף מקורות עם contact info.',
        fixPriority: 'low',
      },
      {
        id: 'clinic-details', labelHe: 'פרטי מרפאה', labelEn: 'Clinic Details',
        status: 'moderate',
        currentValue: 'כתובת + עיר קיימים. חסר: שעות פעילות מובנות, מפה, חניה',
        recommendedValue: 'LocalBusiness schema מלא: כתובת, שעות, geo, phone, reviews',
        aiImpact: 'LocalBusiness schema = Google Knowledge Panel + AI local recommendations.',
        fixPriority: 'medium',
      },
      {
        id: 'medical-disclaimer', labelHe: 'כתב ויתור רפואי', labelEn: 'Medical Responsibility',
        status: 'moderate',
        currentValue: 'Disclaimer קיים בפוטר — גנרי מדי',
        recommendedValue: 'Disclaimer ספציפי בכל מאמר + כתב ויתור ייעודי לדפי מצב רפואי',
        aiImpact: 'Disclaimer ספציפי = סימן לתוכן רפואי אחראי. AI מעדיף.',
        fixPriority: 'medium',
      },
      {
        id: 'editorial-policy', labelHe: 'מדיניות עריכה', labelEn: 'Editorial Policy',
        status: 'missing',
        currentValue: 'לא קיים דף מדיניות עריכה',
        recommendedValue: 'צרו דף: "כיצד אנו כותבים תוכן רפואי" — תהליך, מקורות, ביקורת',
        aiImpact: 'מדיניות עריכה = שקיפות מקסימלית. Google E-E-A-T דורש זאת מ-YMYL.',
        fixPriority: 'high',
      },
      {
        id: 'content-review-policy', labelHe: 'מדיניות ביקורת תוכן', labelEn: 'Content Review Policy',
        status: 'missing',
        currentValue: 'לא מתועד: מי בודק, כל כמה זמן, מה התהליך',
        recommendedValue: 'תיעוד: "כל מאמר נבדק רפואית לפני פרסום ומתעדכן כל 6 חודשים"',
        aiImpact: 'תהליך ביקורת מתועד = trustworthiness signal חזק.',
        fixPriority: 'high',
      },
      {
        id: 'legal-signals', labelHe: 'אותות משפטיים', labelEn: 'Legal Signals',
        status: 'strong',
        currentValue: 'Privacy Policy + Accessibility + Security Policy קיימים',
        recommendedValue: 'הוסיפו: Terms of Use, Cookie Policy, GDPR badge',
        aiImpact: 'דפים משפטיים מלאים = לגיטימיות. AI מזהה אתרים עם תשתית משפטית.',
        fixPriority: 'low',
      },
    ],
  },
  {
    id: 'external-authority',
    titleHe: 'סמכות חיצונית',
    titleEn: 'External Authority Readiness',
    icon: '🌐',
    score: 30,
    signals: [
      {
        id: 'citations', labelHe: 'ציטוטים ואזכורים', labelEn: 'Citations',
        status: 'missing',
        currentValue: 'אין אזכורים חיצוניים ידועים של ד״ר ברמלי כמומחית',
        recommendedValue: 'צרו תוכן ציטוטי: מדריכים ייחודיים, סטטיסטיקות, מחקר מקורי',
        aiImpact: 'ציטוטים חיצוניים = authority signal חזק. AI מעדיף מקורות מצוטטים.',
        fixPriority: 'high',
      },
      {
        id: 'directories', labelHe: 'מדריכי רופאים', labelEn: 'Directory Consistency',
        status: 'weak',
        currentValue: 'פנקס רופאים — לא ברור אם פרטים עדכניים ועקביים',
        recommendedValue: 'עדכנו: פנקס רופאים, Google Business, Waze, Yelp Israel, ZocDoc',
        aiImpact: 'עקביות בין מדריכים = entity disambiguation. AI מבין שזה אותו אדם.',
        fixPriority: 'high',
      },
      {
        id: 'guest-content', labelHe: 'תוכן אורח', labelEn: 'Guest Content',
        status: 'missing',
        currentValue: 'אין מאמרי אורח או תרומות לפלטפורמות אחרות',
        recommendedValue: 'כתבו לפורטלי בריאות: Ynet בריאות, Mako, Clalit Magazine',
        aiImpact: 'תוכן בפלטפורמות מוכרות = backlinks + entity reinforcement.',
        fixPriority: 'medium',
      },
      {
        id: 'podcasts', labelHe: 'פודקאסטים', labelEn: 'Podcast Mentions',
        status: 'missing',
        currentValue: 'אין הופעות בפודקאסטים ידועות',
        recommendedValue: 'הופיעו ב-2-3 פודקאסטים הוריים ישראליים (עושים הורים, אימא יודעת)',
        aiImpact: 'פודקאסטים = mentions + audio entity signals.',
        fixPriority: 'low',
      },
      {
        id: 'partnerships', labelHe: 'שיתופי פעולה', labelEn: 'Partnerships',
        status: 'missing',
        currentValue: 'אין שיתופי פעולה מתועדים עם ארגוני בריאות',
        recommendedValue: 'שתפו פעולה עם: עמותת אפ"י, עמותת נגישות, בתי ספר',
        aiImpact: 'שיתופי פעולה = credibility boost + branded mentions.',
        fixPriority: 'medium',
      },
    ],
  },
];

// ── Brand Fragments ───────────────────────────────────────────────────

export const BRAND_FRAGMENTS: BrandFragment[] = [
  {
    id: 'domain-primary', variant: 'ihaveallergy.com', location: 'דומיין ראשי',
    isCanonical: true, issue: '', fix: 'זה הדומיין הקנוני — ודאו שכל canonical tags מצביעים לכאן.',
  },
  {
    id: 'domain-lovable', variant: 'annabrameli.lovable.app', location: 'Lovable preview',
    isCanonical: false, issue: 'דומיין משני שעלול להתפרס ולהתחרות ב-SERP',
    fix: 'ודאו redirect 301 לדומיין הראשי. בדקו שאין indexing.',
  },
  {
    id: 'name-he', variant: 'ד״ר אנה ברמלי', location: 'דפים בעברית',
    isCanonical: true, issue: '', fix: 'השתמשו בדיוק בניסוח הזה בכל דף עברי.',
  },
  {
    id: 'name-en', variant: 'Dr. Anna Brameli', location: 'דפים באנגלית, schema',
    isCanonical: true, issue: '', fix: 'השתמשו בדיוק בניסוח הזה בכל הקשר אנגלי.',
  },
  {
    id: 'name-short', variant: 'ד״ר ברמלי', location: 'כותרות, CTA, פוטר',
    isCanonical: false, issue: 'קיצור שעלול ליצור ישות נפרדת',
    fix: 'השתמשו בשם המלא "ד״ר אנה ברמלי" גם בהקשרים קצרים.',
  },
  {
    id: 'clinic-variant1', variant: 'מרפאת ד״ר ברמלי', location: 'חלק מהדפים',
    isCanonical: false, issue: 'לא כולל שם פרטי — entity mismatch',
    fix: 'שנו ל-"מרפאת ד״ר אנה ברמלי".',
  },
  {
    id: 'brand-he', variant: 'יש לי אלרגיה', location: 'לא בשימוש עקבי',
    isCanonical: false, issue: 'תרגום עברי של הדומיין — לא מבוסס כמותג',
    fix: 'אם רוצים להשתמש — צרו tagline: "ihaveallergy.com — יש לי אלרגיה".',
  },
];

// ── Page Trust Assessments ────────────────────────────────────────────

export const PAGE_TRUST_ASSESSMENTS: PageTrustAssessment[] = [
  {
    path: '/', titleHe: 'דף הבית',
    aiTrustScore: 7.2, wouldCite: true,
    reasons: [
      'ישות רופאה מזוהה עם שם מלא והתמחות',
      'Physician schema עם credentials',
      'CTA ברור ומידע יצירת קשר נגיש',
    ],
    fixes: [
      'הוסיפו TL;DR snippet בראש הדף',
      'חזקו את USP — למה דווקא מרפאה זו',
      'הוסיפו "areas of expertise" list',
    ],
  },
  {
    path: '/about', titleHe: 'אודות',
    aiTrustScore: 6.8, wouldCite: true,
    reasons: [
      'Timeline השכלה מפורט',
      'הישגים ופעילות מקצועית',
      'גישה טיפולית מוסברת',
    ],
    fixes: [
      'הוסיפו פסקת סיכום extractable בראש',
      'הוסיפו מספר מטופלים / שנות ניסיון',
      'הוסיפו publications list',
    ],
  },
  {
    path: '/contact', titleHe: 'צור קשר',
    aiTrustScore: 7.5, wouldCite: false,
    reasons: [
      'מידע קשר ברור ונגיש',
      'WhatsApp + טלפון + email',
      'כתובת פיזית',
    ],
    fixes: [
      'הוסיפו LocalBusiness schema',
      'הוסיפו שעות פעילות מובנות',
      'הוסיפו מפה',
    ],
  },
  {
    path: '/faq', titleHe: 'שאלות נפוצות',
    aiTrustScore: 6.0, wouldCite: true,
    reasons: [
      'FAQPage schema קיים',
      'שאלות רלוונטיות ומעשיות',
    ],
    fixes: [
      'כל תשובה חייבת לפתוח במשפט ישיר',
      'הוסיפו ייחוס מחבר לכל תשובה',
      'הוסיפו קישורים פנימיים מתוך תשובות',
      'פצלו FAQ ארוך לקטגוריות',
    ],
  },
  {
    path: '/dr-anna-brameli', titleHe: 'פרופיל ד״ר ברמלי',
    aiTrustScore: 7.8, wouldCite: true,
    reasons: [
      'Physician schema מלא',
      'sameAs links לפנקס רופאים',
      'credentials מפורטים',
      'FAQ ממוקד',
    ],
    fixes: [
      'הוסיפו "at a glance" card מובנה',
      'הוסיפו publications',
      'הוסיפו professional memberships',
    ],
  },
  {
    path: '/services', titleHe: 'שירותים',
    aiTrustScore: 5.5, wouldCite: false,
    reasons: [
      'רשימת שירותים ברורה',
      'כותרות מפורטות',
    ],
    fixes: [
      'הוסיפו MedicalProcedure schema לכל שירות',
      'הוסיפו "מה קורה בביקור" לכל שירות',
      'הוסיפו FAQ ספציפי לכל שירות',
      'שפרו CTA — רכים ורפואיים',
    ],
  },
  {
    path: '/אלרגיה-בילדים-מדריך-מלא', titleHe: 'מדריך אלרגיה בילדים',
    aiTrustScore: 7.0, wouldCite: true,
    reasons: [
      'תוכן מקיף 2000+ מילים',
      'מבנה H2 ברור',
      'AuthorBadge',
    ],
    fixes: [
      'הוסיפו TL;DR בפתיחה',
      'הוסיפו "last reviewed" date',
      'חזקו internal links לסאטלייטים',
    ],
  },
  {
    path: '/knowledge/פריחה-אחרי-במבה', titleHe: 'פריחה אחרי במבה',
    aiTrustScore: 6.5, wouldCite: true,
    reasons: [
      'עונה על שאלה ספציפית',
      'ייחוס מחבר',
      'מבנה ברור',
    ],
    fixes: [
      'הוסיפו direct answer block בראש',
      'הוסיפו comparison: אלרגיה vs. תגובת מגע',
      'הוסיפו "when to seek care" prominent box',
    ],
  },
  {
    path: '/whois', titleHe: 'מי זה',
    aiTrustScore: 5.0, wouldCite: false,
    reasons: [
      'FAQ עשיר',
      'FAQPage schema',
    ],
    fixes: [
      'בהרו מטרת הדף — discovery intent',
      'ודאו שאין סתירות עם דף About',
      'הוסיפו H1 ייחודי',
      'הפרידו FAQ מתוכן ביוגרפי',
    ],
  },
  {
    path: '/blog', titleHe: 'בלוג',
    aiTrustScore: 4.5, wouldCite: false,
    reasons: [
      'רשימת מאמרים קיימת',
    ],
    fixes: [
      'הוסיפו CollectionPage schema',
      'הוסיפו intro paragraph — מי כותב ולמה',
      'ודאו שכל מאמר מזוהה עם מחבר',
      'הוסיפו category filtering with unique H1 per category',
    ],
  },
];

// ── External Opportunities ────────────────────────────────────────────

export const EXTERNAL_OPPORTUNITIES: ExternalOpportunity[] = [
  {
    id: 'google-business', type: 'directory', titleHe: 'Google Business Profile', status: 'not-started',
    description: 'צרו/עדכנו פרופיל Google Business עם שם, כתובת, שעות, תמונות, והתמחות. קריטי ל-Knowledge Panel.',
    effort: 'low', impact: 'high',
  },
  {
    id: 'doctor-registry', type: 'directory', titleHe: 'פנקס רופאים — עדכון', status: 'not-started',
    description: 'ודאו שפרטים בפנקס הרופאים של משרד הבריאות עקביים עם האתר.',
    effort: 'low', impact: 'high',
  },
  {
    id: 'ynet-health', type: 'guest-content', titleHe: 'מאמר אורח — Ynet בריאות', status: 'not-started',
    description: 'כתבו מאמר מומחה ב-Ynet בריאות על נושא אלרגיה בילדים עם backlink.',
    effort: 'high', impact: 'high',
  },
  {
    id: 'wikipedia-citation', type: 'citation', titleHe: 'ציטוט Wikipedia — אלרגיה למזון', status: 'not-started',
    description: 'בדקו אם מדריכים מהאתר יכולים לשמש כמקור משני בערכי ויקיפדיה.',
    effort: 'medium', impact: 'high',
  },
  {
    id: 'parenting-podcast', type: 'podcast', titleHe: 'פודקאסט הורים — ראיון מומחה', status: 'not-started',
    description: 'הציעו ראיון לפודקאסט הורי ישראלי על אלרגיות ילדים וטעימות ראשונות.',
    effort: 'medium', impact: 'medium',
  },
  {
    id: 'allergy-assoc', type: 'partnership', titleHe: 'עמותת אפ"י — שיתוף פעולה', status: 'not-started',
    description: 'צרו שיתוף פעולה עם האגודה הישראלית לאלרגיה — אזכור + קישור הדדי.',
    effort: 'medium', impact: 'high',
  },
  {
    id: 'school-guide', type: 'commentary', titleHe: 'מדריך לבתי ספר — תגובות אלרגיות', status: 'not-started',
    description: 'צרו מדריך להורדה לבתי ספר + גנים עם לוגו המרפאה — יופץ כ-PDF.',
    effort: 'high', impact: 'medium',
  },
  {
    id: 'news-commentary', type: 'commentary', titleHe: 'תגובת מומחה לחדשות', status: 'not-started',
    description: 'היו זמינים לתגובת מומחה כשיש חדשות על אלרגיה (דוגמה: ריקול מזון, מחקר חדש).',
    effort: 'low', impact: 'medium',
  },
  {
    id: 'local-seo-dirs', type: 'directory', titleHe: 'מדריכים מקומיים', status: 'not-started',
    description: 'הירשמו ב-Waze, b144, doctor.co.il, infomed — עם פרטים עקביים.',
    effort: 'low', impact: 'medium',
  },
  {
    id: 'branded-content', type: 'mention', titleHe: 'בניית mentions ממותגים', status: 'not-started',
    description: 'צרו תוכן ייחודי וציטוטי (סטטיסטיקות, infographics) שאתרים אחרים ירצו לצטט.',
    effort: 'high', impact: 'high',
  },
];

// ── Aggregate Scores ──────────────────────────────────────────────────

export const SCORECARD = {
  entityClarity: 62,
  trustPresentation: 70,
  expertVisibility: 55,
  externalAuthority: 30,
  overall: 54,
};
