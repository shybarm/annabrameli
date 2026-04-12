/**
 * GEO Workspace - execution-ready rewrite briefs for key pages.
 * Each brief is a self-contained action plan for content/SEO teams.
 */

export interface RewriteBrief {
  id: string;
  pagePath: string;
  pageType: string;
  currentTitle: string;
  currentGeoScore: number;   // 1-10
  targetGeoScore: number;

  /* Diagnostic */
  issues: string[];
  rewritePriority: 'critical' | 'high' | 'medium' | 'low';
  rewriteRationale: string;

  /* Recommended rewrite */
  suggestedTitle: string;
  suggestedMetaDescription: string;
  answerFirstIntro: string;    // the exact opening paragraph to use
  sectionOutline: SectionSpec[];
  faqSuggestions: FaqItem[];
  internalLinkingSuggestions: LinkSuggestion[];
  trustSignalImprovements: string[];
  structureNotes: string;
}

export interface SectionSpec {
  heading: string;       // H2 / H3
  purpose: string;       // why this section exists for GEO
  contentGuidance: string;
  schemaHint?: string;   // e.g. "FAQ", "HowTo", "MedicalCondition"
}

export interface FaqItem {
  question: string;
  suggestedAnswer: string;  // answer-first, 1-2 sentences
  intent: 'definition' | 'symptom' | 'diagnosis' | 'treatment' | 'reassurance' | 'emergency' | 'booking';
}

export interface LinkSuggestion {
  anchorText: string;
  targetPath: string;
  context: string;      // where in the page this link should appear
}

// ── Briefs ──

export const WORKSPACE_BRIEFS: RewriteBrief[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. HOMEPAGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'homepage',
    pagePath: '/',
    pageType: 'landing',
    currentTitle: 'דף הבית - ihaveallergy.com',
    currentGeoScore: 5.5,
    targetGeoScore: 7.5,
    issues: [
      'חסר בלוק תשובה ישיר: "מה זה ihaveallergy.com?"',
      'FAQ ללא תשובת פתיחה במשפט אחד - AI לא יכול לחלץ',
      'חסר AuthorBadge עם credentials מעל ה-fold',
      'אין definition box למושגי מפתח (אלרגיה, אימונולוגיה)',
      'meta description גנרי - לא עונה על שאילתה',
      'קישורים פנימיים רק לשירותים, לא למדריכים ומאמרים',
      'חסר תאריך "עודכן לאחרונה" ותג "נבדק רפואית"',
    ],
    rewritePriority: 'critical',
    rewriteRationale: 'דף הבית הוא שער הכניסה הראשי. AI צריך להבין תוך 2 משפטים: מי, מה, למי, איפה. כרגע זה לא קורה.',

    suggestedTitle: 'מרפאת אלרגיה לילדים בהוד השרון | ד״ר אנה ברמלי - אלרגיה ואימונולוגיה',
    suggestedMetaDescription: 'ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה קלינית. אבחון וטיפול באלרגיית מזון, אקזמה ואסתמה בילדים. מרפאה פרטית בהוד השרון - ללא המתנה.',
    answerFirstIntro: 'ihaveallergy.com היא המרפאה הפרטית של ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה קלינית בילדים ומבוגרים, בהוד השרון. המרפאה מתמחה באבחון וטיפול באלרגיות מזון, אלרגיות עוריות, אסתמה ומחלות אימונולוגיות - עם גישה מבוססת ראיות, ללא המתנה ועם ליווי אישי.',

    sectionOutline: [
      { heading: 'מי אנחנו', purpose: 'entity clarity - AI צריך לזהות מיהי הישות', contentGuidance: '2-3 משפטים: שם, התמחות, מיקום, ניסיון. הפניה לדף אודות.', schemaHint: 'Organization + Physician' },
      { heading: 'השירותים שלנו', purpose: 'topical mapping - AI רואה מה המרפאה מציעה', contentGuidance: 'רשימה של 5-6 שירותים עם משפט אחד לכל שירות + קישור לדף ייעודי.', schemaHint: 'MedicalProcedure' },
      { heading: 'למה לבחור בנו', purpose: 'trust signals + differentiators', contentGuidance: '3-4 נקודות: הכשרה ב-Vanderbilt, ניסיון בשניידר, גישה אנושית, ללא המתנה.' },
      { heading: 'מרכז הידע באלרגיה', purpose: 'hub linkage - חיבור לאשכולות תוכן', contentGuidance: 'כרטיסיות: אלרגיה למזון, בדיקות, זכויות, אקזמה. כל כרטיס מקשר ל-Pillar Guide.' },
      { heading: 'שאלות נפוצות', purpose: 'FAQ schema + direct answers', contentGuidance: '5 שאלות עם תשובה ישירה של משפט אחד + הרחבה. FAQPage schema.', schemaHint: 'FAQPage' },
      { heading: 'יצירת קשר', purpose: 'conversion + LocalBusiness signal', contentGuidance: 'כתובת, טלפון, שעות, וואטסאפ, קביעת תור.', schemaHint: 'LocalBusiness' },
    ],

    faqSuggestions: [
      { question: 'מתי כדאי לקחת ילד לבדיקת אלרגיה?', suggestedAnswer: 'מומלץ לפנות לבדיקת אלרגיה כשיש תגובה חוזרת לאותו מזון, פריחה כרונית, או היסטוריה משפחתית של אלרגיה.', intent: 'diagnosis' },
      { question: 'מה ההבדל בין אלרגיה לרגישות למזון?', suggestedAnswer: 'אלרגיה היא תגובה של מערכת החיסון (IgE) שעלולה להיות מסוכנת. רגישות היא תגובה שאינה חיסונית ולרוב קלה יותר.', intent: 'definition' },
      { question: 'האם בדיקת עור כואבת?', suggestedAnswer: 'בדיקת עור (Skin Prick Test) כוללת דקירות קלות בעור - לא זריקות. רוב הילדים מתארים גרד קל, לא כאב.', intent: 'reassurance' },
      { question: 'כמה עולה ביקור במרפאה פרטית?', suggestedAnswer: 'ביקור ראשוני כולל אבחון מקיף. ניתן לקבל החזר חלקי מביטוח משלים. צרו קשר לפרטים.', intent: 'booking' },
      { question: 'האם ניתן לרפא אלרגיה למזון?', suggestedAnswer: 'חלק מאלרגיות המזון בילדים (כמו חלב וביצה) נעלמות עם הגיל. אלרגיות אחרות (בוטנים) לרוב נשארות. בירור ומעקב קובעים את התוכנית.', intent: 'treatment' },
    ],

    internalLinkingSuggestions: [
      { anchorText: 'המדריך המלא לאלרגיה בילדים', targetPath: '/אלרגיה-בילדים-מדריך-מלא', context: 'סקציית "מרכז הידע"' },
      { anchorText: 'בדיקות אלרגיה לילדים בישראל', targetPath: '/guides/בדיקות-אלרגיה-ילדים-ישראל', context: 'סקציית "שירותים" או "שאלות נפוצות"' },
      { anchorText: 'זכויות ילד אלרגי בגן ובבית ספר', targetPath: '/guides/זכויות-ילד-אלרגי-ישראל', context: 'סקציית "מרכז הידע"' },
      { anchorText: 'טעימות ראשונות - מדריך אלרגנים', targetPath: '/guides/טעימות-ראשונות-אלרגנים', context: 'סקציית "מרכז הידע"' },
      { anchorText: 'מי זו ד״ר אנה ברמלי', targetPath: '/about', context: 'סקציית "מי אנחנו" - anchor text מלא' },
      { anchorText: 'קבע בדיקת אלרגיה', targetPath: '/contact', context: 'CTA ראשי + סוף העמוד' },
    ],

    trustSignalImprovements: [
      'הוסף AuthorBadge מעל ה-fold: "ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה | Vanderbilt University"',
      'הוסף badge: "נבדק רפואית - עודכן אפריל 2026"',
      'הוסף Physician JSON-LD עם sameAs לפנקס רופאים',
      'הוסף Organization JSON-LD עם כתובת + GeoCoordinates',
      'הוסף FAQPage JSON-LD',
      'ודא שכל credentials מופיעים כטקסט (לא רק תמונה)',
    ],

    structureNotes: 'הדף צריך להיות hub - לא דף תוכן. כל סקציה מקשרת לדף עומק. AI צריך לקרוא את הדף ולהבין: "זאת מרפאת אלרגיה בהוד השרון של ד״ר ברמלי, עם שירותי בדיקה, ייעוץ, ותוכן רפואי."',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. ABOUT PAGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'about',
    pagePath: '/about',
    pageType: 'profile',
    currentTitle: 'אודות ד״ר אנה ברמלי | רקע מקצועי, השכלה וגישה טיפולית',
    currentGeoScore: 6.8,
    targetGeoScore: 8.5,
    issues: [
      'H1 גנרי: "אודות ד״ר אנה ברמלי" - לא snippet-ready',
      'חסרה פסקת פתיחה ברת ציטוט ("ד״ר ברמלי היא...")',
      'חסר כרטיס "במבט חטוף" עם עובדות מפתח',
      'חסר Physician JSON-LD מלא עם sameAs',
      'חסרה רשימת פרסומים / הרצאות',
      'קישורים פנימיים למאמרים שכתבה חסרים',
    ],
    rewritePriority: 'high',
    rewriteRationale: 'דף אודות הוא הדף הקריטי ביותר ל-E-E-A-T. אם AI שואל "מי ד״ר ברמלי", הדף הזה חייב לתת תשובה בשורה ראשונה.',

    suggestedTitle: 'ד״ר אנה ברמלי - מומחית לאלרגיה ואימונולוגיה קלינית | Vanderbilt + שניידר',
    suggestedMetaDescription: 'ד״ר אנה ברמלי, רופאה מומחית באלרגיה ואימונולוגיה קלינית. בוגרת Vanderbilt University ומרכז שניידר. מתמחה באלרגיות מזון, אקזמה ואסתמה בילדים.',
    answerFirstIntro: 'ד״ר אנה ברמלי היא רופאה מומחית באלרגיה ואימונולוגיה קלינית, בעלת ניסיון של שנים באבחון וטיפול באלרגיות מזון, מחלות עוריות ואסתמה בילדים ובמבוגרים. היא בוגרת תת-התמחות ב-Vanderbilt University Medical Center ומומחית ברפואת ילדים ממרכז שניידר.',

    sectionOutline: [
      { heading: 'במבט חטוף', purpose: 'כרטיס עובדות מובנה - AI חולץ בקלות', contentGuidance: 'שם מלא, התמחות, מיקום, רישיון, השכלה - בפורמט key-value.', schemaHint: 'Physician' },
      { heading: 'הגישה הטיפולית', purpose: 'ביו מקצועי בר-ציטוט', contentGuidance: '150 מילים: גישה מבוססת ראיות, ליווי משפחתי, הקשבה. ציטוט ישיר אפשרי.' },
      { heading: 'תחומי מומחיות', purpose: 'specialty mapping ל-AI', contentGuidance: 'רשימה: אלרגיית מזון, אקזמה, אסתמה, אורטיקריה, אימונותרפיה, ייעוץ הורי.', schemaHint: 'medicalSpecialty' },
      { heading: 'השכלה והסמכות', purpose: 'credentials audit trail', contentGuidance: 'Timeline: MD, התמחות, תת-התמחויות. כל שלב עם מוסד + שנים.' },
      { heading: 'פרסומים ומדיה', purpose: 'authority signals', contentGuidance: 'אם יש פרסומים - ציין. אם לא - הרצאות, כנסים, מדיה. גם רשימה קטנה עוזרת.' },
      { heading: 'מאמרים שכתבתי', purpose: 'authorship linking', contentGuidance: 'רשימה של 5-8 מאמרי ידע + מדריכים עם קישורים.' },
    ],

    faqSuggestions: [
      { question: 'מה ההתמחות של ד״ר אנה ברמלי?', suggestedAnswer: 'ד״ר ברמלי מתמחה באלרגיה ואימונולוגיה קלינית, עם דגש על אלרגיות מזון, אקזמה ואסתמה בילדים.', intent: 'definition' },
      { question: 'איפה ד״ר ברמלי למדה רפואה?', suggestedAnswer: 'ד״ר ברמלי בוגרת הפקולטה לרפואה באוניברסיטת בן גוריון, עם תת-התמחויות ב-Vanderbilt University Medical Center.', intent: 'definition' },
      { question: 'איך קובעים תור לד״ר ברמלי?', suggestedAnswer: 'ניתן לקבוע תור דרך וואטסאפ, טלפון, או טופס יצירת קשר באתר. אין צורך בהפניה.', intent: 'booking' },
    ],

    internalLinkingSuggestions: [
      { anchorText: 'אלרגיה בילדים - מדריך מלא', targetPath: '/אלרגיה-בילדים-מדריך-מלא', context: 'סקציית "מאמרים שכתבתי"' },
      { anchorText: 'בדיקות אלרגיה לילדים', targetPath: '/guides/בדיקות-אלרגיה-ילדים-ישראל', context: 'סקציית "מאמרים שכתבתי"' },
      { anchorText: 'במבה בגיל 4 חודשים', targetPath: '/knowledge/במבה-גיל-4-חודשים', context: 'סקציית "מאמרים שכתבתי"' },
      { anchorText: 'קבע ייעוץ', targetPath: '/contact', context: 'CTA סגירה' },
    ],

    trustSignalImprovements: [
      'הוסף Physician JSON-LD עם: name, medicalSpecialty, alumniOf, sameAs, worksFor',
      'הוסף sameAs: פנקס רופאים (מס׳ 132226), LinkedIn, פורטלי בריאות',
      'הוסף מספר רישיון כטקסט גלוי: "רישיון 132226"',
      'הוסף badge "מומחית מוכרת - משרד הבריאות"',
      'הוסף reviewed date: "עודכן: אפריל 2026"',
    ],

    structureNotes: 'הדף צריך לענות על "מי ד״ר ברמלי" תוך שורה אחת. כרטיס "במבט חטוף" הוא הכלי הכי חשוב - AI חולץ facts מרשימות, לא מפסקאות ארוכות.',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. ALLERGY TESTING SERVICE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'allergy-testing',
    pagePath: '/services',
    pageType: 'service',
    currentTitle: 'השירותים שלנו - ihaveallergy.com',
    currentGeoScore: 4.8,
    targetGeoScore: 7.5,
    issues: [
      'דף services מרוכז - אין URL ייעודי לכל שירות',
      'חסר MedicalProcedure schema לכל בדיקה',
      'חסרים בלוקי "מה לצפות" לכל שירות',
      'חסרה טבלת השוואה: Skin Prick vs IgE דם',
      'אין פתיחת answer-first: "מהי בדיקת אלרגיה?"',
      'חסרים CTA ספציפיים לכל שירות',
    ],
    rewritePriority: 'high',
    rewriteRationale: '"בדיקת אלרגיה לילדים" היא שאילתה עם כוונת booking. הדף חייב לענות ישירות ולהפנות לפעולה.',

    suggestedTitle: 'בדיקות אלרגיה לילדים - סוגי בדיקות, מה לצפות ואיך להתכונן | ד״ר אנה ברמלי',
    suggestedMetaDescription: 'בדיקות אלרגיה לילדים: בדיקת עור (Skin Prick), בדיקת דם IgE, ותגר מזון. מה כוללת כל בדיקה, האם זה כואב, וכמה זמן לוקח. מרפאת ד״ר ברמלי, הוד השרון.',
    answerFirstIntro: 'בדיקת אלרגיה לילדים היא הליך אבחוני פשוט שמטרתו לזהות אם הילד אלרגי למזון, חומר, או גורם סביבתי מסוים. הבדיקות הנפוצות הן בדיקת עור (Skin Prick Test), בדיקת דם (IgE ספציפי), ותגר מזון מבוקר. במרפאת ד״ר ברמלי בהוד השרון, כל הבדיקות מבוצעות במקום עם תוצאות מיידיות.',

    sectionOutline: [
      { heading: 'מהי בדיקת אלרגיה?', purpose: 'definition - AI answer', contentGuidance: '2-3 משפטים: הגדרה, מטרה, למי מתאים.', schemaHint: 'MedicalProcedure' },
      { heading: 'סוגי בדיקות אלרגיה', purpose: 'comparison - extractable table', contentGuidance: 'טבלה: בדיקת עור, בדיקת דם, תגר מזון. עמודות: מהות, משך, כאב, דיוק, גיל מינימלי.' },
      { heading: 'בדיקת עור (Skin Prick Test)', purpose: 'standalone answer for AI', contentGuidance: 'מה זה, איך זה עובד, האם כואב, תוצאות תוך כמה זמן.', schemaHint: 'MedicalProcedure' },
      { heading: 'בדיקת דם (IgE ספציפי)', purpose: 'standalone answer', contentGuidance: 'מתי עדיפה על עור, מה בודקים, פירוש תוצאות.' },
      { heading: 'תגר מזון (Oral Food Challenge)', purpose: 'high-intent answer', contentGuidance: 'מה זה, מתי נדרש, מה קורה ביום האתגר, בטיחות.' },
      { heading: 'איך להתכונן לבדיקה', purpose: 'practical guidance', contentGuidance: 'רשימת הכנה: הפסקת אנטיהיסטמינים, מה להביא, משך ביקור.', schemaHint: 'HowTo' },
      { heading: 'שאלות נפוצות', purpose: 'FAQ schema', contentGuidance: '4-5 שאלות ספציפיות לבדיקות.', schemaHint: 'FAQPage' },
    ],

    faqSuggestions: [
      { question: 'האם בדיקת עור כואבת לילדים?', suggestedAnswer: 'בדיקת עור כוללת דקירות עדינות על העור - לא זריקות. רוב הילדים חווים גרד קל שנעלם תוך 20 דקות.', intent: 'reassurance' },
      { question: 'מאיזה גיל אפשר לעשות בדיקת אלרגיה?', suggestedAnswer: 'בדיקת עור מתאימה מגיל 4 חודשים ומעלה. בדיקת דם ניתנת בכל גיל.', intent: 'diagnosis' },
      { question: 'מה ההבדל בין בדיקת עור לבדיקת דם?', suggestedAnswer: 'בדיקת עור מהירה יותר ומדויקת יותר לרוב האלרגנים. בדיקת דם מתאימה כשיש אקזמה נרחבת או שימוש באנטיהיסטמינים.', intent: 'diagnosis' },
      { question: 'כמה עולה בדיקת אלרגיה פרטית?', suggestedAnswer: 'העלות תלויה בסוג הבדיקה ובמספר האלרגנים. צרו קשר לפרטים ומחירים.', intent: 'booking' },
    ],

    internalLinkingSuggestions: [
      { anchorText: 'תבחיני עור - האם זה כואב?', targetPath: '/knowledge/תבחיני-עור-כואב-לילדים', context: 'סקציית "בדיקת עור"' },
      { anchorText: 'בדיקת דם לאלרגיה - מתי מספיקה?', targetPath: '/knowledge/בדיקת-דם-לאלרגיה-ילדים', context: 'סקציית "בדיקת דם"' },
      { anchorText: 'תגר מזון - איך זה נראה בפועל', targetPath: '/knowledge/תגר-מזון-איך-זה-נראה', context: 'סקציית "תגר מזון"' },
      { anchorText: 'המדריך המלא לבדיקות אלרגיה לילדים', targetPath: '/guides/בדיקות-אלרגיה-ילדים-ישראל', context: 'סגירה - הפניה למדריך מקיף' },
      { anchorText: 'פרטי או קופה - מה עדיף?', targetPath: '/knowledge/בדיקות-אלרגיה-פרטי-או-קופה', context: 'FAQ או סגירה' },
    ],

    trustSignalImprovements: [
      'הוסף MedicalProcedure JSON-LD לכל סוג בדיקה (howPerformed, preparation)',
      'הוסף AuthorBadge: "ד״ר ברמלי - מבצעת בדיקות אלרגיה מאז 2015"',
      'הוסף "נבדק רפואית - אפריל 2026"',
      'ציין ניסיון: "מעל X בדיקות בשנה" (אם ניתן)',
      'הוסף הפניה להנחיות AAP/EAACI על בדיקות',
    ],

    structureNotes: 'אידיאלית: כל שירות בדף נפרד (URL ייעודי). כצעד ביניים: anchors ייעודיים (#skin-prick, #blood-test, #food-challenge) + MedicalProcedure schema לכל אחד.',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. MILK ALLERGY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'milk-allergy',
    pagePath: '/knowledge/אלרגיה-לחלב-בילדים',
    pageType: 'knowledge (חסר - צריך ליצור)',
    currentTitle: 'לא קיים',
    currentGeoScore: 0,
    targetGeoScore: 7.5,
    issues: [
      'הדף לא קיים - פער קריטי באשכול "אלרגיה למזון"',
      '"אלרגיה לחלב בילדים" היא שאילתה בנפח גבוה ללא כיסוי',
      'חסר תוכן שמבחין בין אלרגיה לחלב לבין אי-סבילות ללקטוז',
      'אין דף שמסביר תסמינים, אבחון, וניהול יומיומי',
    ],
    rewritePriority: 'critical',
    rewriteRationale: 'אלרגיה לחלב פרה היא האלרגיה הנפוצה ביותר בתינוקות. חסר דף שמכסה את הנושא = AI לא יצטט את האתר על הנושא הליבתי ביותר.',

    suggestedTitle: 'אלרגיה לחלב בילדים - תסמינים, אבחון וניהול | ד״ר אנה ברמלי',
    suggestedMetaDescription: 'אלרגיה לחלב פרה בילדים: מה ההבדל מאי-סבילות ללקטוז, מה התסמינים, איך מאבחנים, ומתי זה עובר. מידע רפואי מד״ר אנה ברמלי, מומחית אלרגיה.',
    answerFirstIntro: 'אלרגיה לחלב פרה היא האלרגיה הנפוצה ביותר בתינוקות ופעוטות. היא נגרמת מתגובה חיסונית לחלבוני החלב (קזאין או whey) ושונה מהותית מאי-סבילות ללקטוז. רוב הילדים מתגברים על האלרגיה עד גיל 3-5, אך חשוב לאבחן ולנהל נכון כדי למנוע תגובות חריפות.',

    sectionOutline: [
      { heading: 'מהי אלרגיה לחלב פרה?', purpose: 'definition - AI answer', contentGuidance: 'הגדרה: תגובה חיסונית (IgE / non-IgE) לחלבוני חלב. הבדל מלקטוז.', schemaHint: 'MedicalCondition' },
      { heading: 'תסמינים של אלרגיה לחלב', purpose: 'symptom mapping', contentGuidance: 'רשימה מפורטת: עורי (אקזמה, אורטיקריה), מעי (הקאות, שלשולים, דם), נשימתי. הבחנה IgE vs non-IgE.' },
      { heading: 'אלרגיה לחלב vs אי-סבילות ללקטוז', purpose: 'high-intent comparison', contentGuidance: 'טבלת השוואה: מנגנון, גיל, תסמינים, סכנה, אבחון, טיפול.' },
      { heading: 'איך מאבחנים אלרגיה לחלב?', purpose: 'diagnostic pathway', contentGuidance: 'שלבים: היסטוריה, בדיקת עור, IgE דם, דיאטת הדרה, תגר מזון.' },
      { heading: 'ניהול יומיומי וחלופות', purpose: 'practical guidance', contentGuidance: 'תחליפי חלב (סויה, אורז, שיבולת שועל), קריאת תוויות, הנקה, תזונה מאוזנת.' },
      { heading: 'מתי אלרגיה לחלב עוברת?', purpose: 'prognosis + reassurance', contentGuidance: 'סטטיסטיקות: 80% עד גיל 5. תגר חלב מבוקר. מעקב שנתי.' },
      { heading: 'מתי לפנות לרופא אלרגיה', purpose: 'emergency escalation', contentGuidance: 'סימני אנפילקסיס, ירידה במשקל, אקזמה חמורה, חשש FPIES.' },
    ],

    faqSuggestions: [
      { question: 'מה ההבדל בין אלרגיה לחלב לאי-סבילות ללקטוז?', suggestedAnswer: 'אלרגיה לחלב היא תגובה חיסונית לחלבון שבחלב ועלולה להיות מסוכנת. אי-סבילות ללקטוז היא בעיה בעיכול סוכר החלב - לא חיסונית ולא מסוכנת.', intent: 'definition' },
      { question: 'האם אלרגיה לחלב עוברת?', suggestedAnswer: 'כ-80% מהילדים עם אלרגיה לחלב מתגברים עליה עד גיל 3-5. מעקב שנתי עם בדיקות ותגר מזון מבוקר קובעים מתי ניתן להחזיר חלב.', intent: 'reassurance' },
      { question: 'מה התסמינים של אלרגיה לחלב בתינוקות?', suggestedAnswer: 'תסמינים נפוצים: הקאות, שלשולים, דם בצואה, אקזמה, חוסר שקט אחרי שתיית חלב. תסמינים מיידיים (אורטיקריה, נפיחות) מצביעים על אלרגיית IgE.', intent: 'symptom' },
    ],

    internalLinkingSuggestions: [
      { anchorText: 'המדריך המלא לאלרגיה בילדים', targetPath: '/אלרגיה-בילדים-מדריך-מלא', context: 'פתיחה - קישור ל-Pillar' },
      { anchorText: 'תגר מזון - איך זה נראה', targetPath: '/knowledge/תגר-מזון-איך-זה-נראה', context: 'סקציית אבחון' },
      { anchorText: 'הקאה אחרי טחינה - האם זה FPIES?', targetPath: '/knowledge/הקאה-אחרי-טחינה', context: 'סקציית תסמינים non-IgE' },
      { anchorText: 'בדיקות אלרגיה לילדים', targetPath: '/guides/בדיקות-אלרגיה-ילדים-ישראל', context: 'סקציית אבחון' },
    ],

    trustSignalImprovements: [
      'הוסף AuthorBadge: "ד״ר אנה ברמלי, מומחית אלרגיה ואימונולוגיה"',
      'הוסף disclaimer רפואי',
      'הוסף MedicalCondition JSON-LD (cma, symptoms, diagnosis)',
      'הפנה למקורות: הנחיות BSACI/EAACI על CMA',
      'הוסף reviewed date',
    ],

    structureNotes: 'דף חדש. יש ליצור /knowledge/אלרגיה-לחלב-בילדים ולקשר אליו מכל מאמר שמזכיר חלב + מ-Pillar Guide.',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. BAMBA / PEANUT REACTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'bamba-reaction',
    pagePath: '/knowledge/פריחה-אחרי-במבה',
    pageType: 'satellite',
    currentTitle: 'פריחה אחרי במבה - מה לעשות',
    currentGeoScore: 6.3,
    targetGeoScore: 8.0,
    issues: [
      'חסרה תשובת פתיחה ישירה: "האם פריחה אחרי במבה = אלרגיה?"',
      'חסרה טבלת אלרגיה vs contact irritation',
      'חסרה רשימת סימני אזהרה (אנפילקסיס)',
      'חסר CTA ספציפי: "מודאגים? קבעו בדיקת אלרגיה"',
      'חסרים קישורים ל-bamba-at-4-months ו-skin-prick',
    ],
    rewritePriority: 'high',
    rewriteRationale: '"פריחה אחרי במבה" היא שאילתת הורים בעלת חרדה גבוהה. הדף חייב להרגיע + להכווין. כרגע הוא דל מדי.',

    suggestedTitle: 'פריחה אחרי במבה - האם זו אלרגיה לבוטנים? | ד״ר אנה ברמלי',
    suggestedMetaDescription: 'פריחה אחרי אכילת במבה לא בהכרח מעידה על אלרגיה לבוטנים. איך להבדיל בין גירוי מקומי לאלרגיה אמיתית, מתי לפנות לרופא, ומה הצעד הבא.',
    answerFirstIntro: 'פריחה סביב הפה או על הגוף אחרי אכילת במבה לא בהכרח מעידה על אלרגיה לבוטנים. במקרים רבים מדובר בגירוי עורי מקומי (contact irritation) שאינו מסוכן. עם זאת, אם הפריחה מלווה בנפיחות שפתיים, קושי בנשימה, או הקאות - יש לפנות מיידית לחדר מיון.',

    sectionOutline: [
      { heading: 'פריחה אחרי במבה - האם זו אלרגיה?', purpose: 'answer-first', contentGuidance: 'תשובה ישירה + הבחנה: לרוב לא. אבל יש סימנים שכן.' },
      { heading: 'אלרגיה לבוטנים vs גירוי עורי', purpose: 'comparison table', contentGuidance: 'טבלה: מיקום, מראה, עיתוי, תסמינים נלווים, סיכון, צעד הבא.' },
      { heading: 'סימני אזהרה - מתי לפנות מיד', purpose: 'emergency escalation', contentGuidance: 'רשימה ברורה: נפיחות, קושי בנשימה, הקאות, חיוורון. CTA: "חייגו 101".' },
      { heading: 'מה לעשות אם חושדים באלרגיה', purpose: 'actionable next step', contentGuidance: '3 צעדים: 1) צלמו את הפריחה 2) הפסיקו את המזון 3) קבעו בדיקה.' },
      { heading: 'מחקר LEAP - למה כדאי להתחיל במבה מוקדם', purpose: 'educational + authority', contentGuidance: 'תקציר LEAP: הכנסת בוטנים מגיל 4-6 חודשים מפחיתה סיכון ב-80%.' },
    ],

    faqSuggestions: [
      { question: 'האם פריחה אחרי במבה זו אלרגיה?', suggestedAnswer: 'לא בהכרח. פריחה מקומית סביב הפה לרוב היא גירוי עורי ולא אלרגיה. אלרגיה אמיתית מלווה בדרך כלל בתגובה מערכתית - אורטיקריה, נפיחות, או הקאות.', intent: 'reassurance' },
      { question: 'מה לעשות אם הילד פיתח פריחה מבמבה?', suggestedAnswer: 'צלמו את הפריחה, הפסיקו לתת במבה, ופנו לרופא אלרגיה לבירור. אם יש נפיחות או קושי בנשימה - חדר מיון מיד.', intent: 'treatment' },
      { question: 'מאיזה גיל מתחילים לתת במבה?', suggestedAnswer: 'לפי מחקר LEAP, מומלץ להתחיל מגיל 4-6 חודשים, בהתייעצות עם רופא ילדים - במיוחד אם יש אקזמה או היסטוריה משפחתית.', intent: 'treatment' },
    ],

    internalLinkingSuggestions: [
      { anchorText: 'במבה בגיל 4 חודשים - מתי להתחיל', targetPath: '/knowledge/במבה-גיל-4-חודשים', context: 'סקציית LEAP' },
      { anchorText: 'אודם סביב הפה אחרי אלרגן', targetPath: '/knowledge/אודם-סביב-הפה-אחרי-אלרגן', context: 'סקציית אלרגיה vs גירוי' },
      { anchorText: 'בדיקת עור - האם כואב?', targetPath: '/knowledge/תבחיני-עור-כואב-לילדים', context: 'סקציית "מה לעשות"' },
      { anchorText: 'המדריך המלא לאלרגיה בילדים', targetPath: '/אלרגיה-בילדים-מדריך-מלא', context: 'סגירה' },
    ],

    trustSignalImprovements: [
      'הוסף AuthorBadge עם קישור לביוגרפיה',
      'הוסף הפניה ל-LEAP study (PMID: 25803)',
      'הוסף disclaimer רפואי',
      'הוסף reviewed date',
      'הוסף MedicalWebPage schema עם author + dateModified',
    ],

    structureNotes: 'דף reassurance - ההורה מגיע מבוהל. הפתיחה חייבת להרגיע ולאחר מכן להכווין. סימני אזהרה חייבים לבלוט ויזואלית (background box).',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. FIRST FOOD INTRODUCTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'first-foods',
    pagePath: '/guides/טעימות-ראשונות-אלרגנים',
    pageType: 'guide',
    currentTitle: 'טעימות ראשונות - מדריך אלרגנים',
    currentGeoScore: 7.2,
    targetGeoScore: 8.5,
    issues: [
      'חסר ציר זמן ויזואלי: "באיזה גיל להכניס כל אלרגן"',
      'חסרה טבלת גיל → אלרגן → מינון ראשוני',
      'חסר בלוק "מה אם הילד הגיב?"',
      'חסרות הפניות למחקרים (LEAP, EAT)',
      'FAQ יכול להיות מפורט יותר',
    ],
    rewritePriority: 'medium',
    rewriteRationale: 'דף חזק שצריך שיפורים מבניים. הוספת ציר זמן וטבלה יהפכו אותו ל-best-in-class על השאילתה.',

    suggestedTitle: 'טעימות ראשונות לתינוקות - מתי ואיך להכניס אלרגנים בבטחה | ד״ר אנה ברמלי',
    suggestedMetaDescription: 'מדריך להכנסת אלרגנים לתינוקות: במבה, ביצה, חלב, שומשום ועוד. טבלת גיל-מזון, מינון ראשוני, וסימני אזהרה. מבוסס LEAP + הנחיות AAP.',
    answerFirstIntro: 'הכנסת אלרגנים מוקדמת (מגיל 4-6 חודשים) היא הדרך המוכחת מחקרית להפחית את הסיכון לפתח אלרגיות מזון. המדריך הזה מפרט מתי להכניס כל אלרגן, באיזה מינון להתחיל, ומה לעשות אם הילד מגיב.',

    sectionOutline: [
      { heading: 'למה להתחיל מוקדם?', purpose: 'evidence-based framing', contentGuidance: 'תקציר LEAP+EAT: הקדמה מפחיתה סיכון. הפניות למחקרים.' },
      { heading: 'טבלת הכנסת אלרגנים לפי גיל', purpose: 'core extractable asset', contentGuidance: 'טבלה: אלרגן, גיל מומלץ, מינון ראשוני, צורת הגשה, הערות.', schemaHint: 'Table' },
      { heading: 'איך לתת טעימה ראשונה', purpose: 'step-by-step', contentGuidance: '5 צעדים: בחרו אלרגן, הכינו מינון, תנו בבוקר, המתינו, תעדו.', schemaHint: 'HowTo' },
      { heading: 'מה לעשות אם הילד הגיב', purpose: 'emergency + reassurance', contentGuidance: 'הבחנה: גירוי קל (המשיכו) vs תגובה אלרגית (הפסיקו + רופא) vs חירום (101).' },
      { heading: 'ילדים בסיכון גבוה - מתי להתייעץ קודם', purpose: 'risk stratification', contentGuidance: 'אקזמה חמורה, אלרגיה קיימת, היסטוריה משפחתית - התייעצו לפני.' },
      { heading: 'שאלות נפוצות', purpose: 'FAQ schema', contentGuidance: 'שאלות על מרווח ימים, סדר אלרגנים, התחלה עם במבה.', schemaHint: 'FAQPage' },
    ],

    faqSuggestions: [
      { question: 'כמה ימים לחכות בין אלרגנים?', suggestedAnswer: 'ההמלצה העדכנית היא 2-3 ימים בין אלרגן חדש, כדי לזהות תגובה. אין צורך בהפרש של שבוע.', intent: 'treatment' },
      { question: 'באיזה סדר להכניס אלרגנים?', suggestedAnswer: 'אין סדר חובה. מומלץ להתחיל מבוטנים (במבה) ושומשום (טחינה) בגלל השכיחות הגבוהה בישראל.', intent: 'treatment' },
      { question: 'מה לעשות אם הילד סירב לאכול?', suggestedAnswer: 'נסו שוב ביום אחר, בצורה אחרת (ערבוב עם מחית). סירוב לא מעיד על אלרגיה.', intent: 'reassurance' },
      { question: 'האם ילד עם אקזמה יכול להתחיל טעימות?', suggestedAnswer: 'כן, ודווקא מומלץ - ילדים עם אקזמה בסיכון גבוה יותר לאלרגיה, והכנסה מוקדמת מפחיתה סיכון. התייעצו עם אלרגולוג.', intent: 'treatment' },
    ],

    internalLinkingSuggestions: [
      { anchorText: 'במבה בגיל 4 חודשים', targetPath: '/knowledge/במבה-גיל-4-חודשים', context: 'סקציית טבלה' },
      { anchorText: 'פריחה אחרי במבה - מה זה אומר', targetPath: '/knowledge/פריחה-אחרי-במבה', context: 'סקציית "מה אם הגיב"' },
      { anchorText: 'הקאה אחרי טחינה', targetPath: '/knowledge/הקאה-אחרי-טחינה', context: 'סקציית "מה אם הגיב"' },
      { anchorText: 'כמה ימים בין אלרגנים', targetPath: '/knowledge/כמה-ימים-בין-אלרגנים', context: 'FAQ' },
      { anchorText: 'המדריך המלא לאלרגיה בילדים', targetPath: '/אלרגיה-בילדים-מדריך-מלא', context: 'סגירה' },
    ],

    trustSignalImprovements: [
      'הוסף הפניות: LEAP study, EAT study, הנחיות AAP 2023',
      'הוסף AuthorBadge עם Vanderbilt + שניידר',
      'הוסף reviewed date',
      'הוסף ציר זמן ויזואלי (infographic-style)',
      'הוסף HowTo JSON-LD לסקציית "איך לתת טעימה"',
    ],

    structureNotes: 'הדף הזה כבר טוב. שיפורים מבניים: טבלה, ציר זמן, ו-FAQ מורחב יהפכו אותו ל-definitive guide על טעימות ראשונות.',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. ATOPIC DERMATITIS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'atopic-dermatitis',
    pagePath: '/knowledge/אקזמה-אטופית-בילדים',
    pageType: 'knowledge (חסר - צריך ליצור)',
    currentTitle: 'לא קיים',
    currentGeoScore: 0,
    targetGeoScore: 7.5,
    issues: [
      'הדף לא קיים - פער קריטי באשכול "תסמינים ועור"',
      '"אקזמה בילדים" היא שאילתה בנפח גבוה ללא כיסוי',
      'אקזמה קשורה ישירות לאלרגיה - חסר את הקשר',
      'אין מידע על טיפול, מניעה, ומתי לפנות לאלרגולוג',
    ],
    rewritePriority: 'critical',
    rewriteRationale: 'אקזמה אטופית היא הקשר הישיר ביותר בין עור לאלרגיה. הורים מחפשים "אקזמה בילדים" ומגלים שזה קשור לאלרגיה - זה gateway content.',

    suggestedTitle: 'אקזמה אטופית בילדים - הקשר לאלרגיה, טיפול וניהול | ד״ר אנה ברמלי',
    suggestedMetaDescription: 'אקזמה אטופית (דלקת עור אטופית) בילדים: תסמינים, הקשר לאלרגיות מזון, טיפול יומיומי, ומתי לפנות לאלרגולוג. מד״ר אנה ברמלי, מומחית אלרגיה.',
    answerFirstIntro: 'אקזמה אטופית (Atopic Dermatitis) היא מחלת עור כרונית שכיחה בילדים, המתאפיינת בעור יבש, אדום וגרדני. אצל כ-30% מהילדים עם אקזמה חמורה, הסיבה קשורה לאלרגיית מזון. זיהוי הקשר הזה מאפשר טיפול ממוקד - הן בעור והן באלרגיה.',

    sectionOutline: [
      { heading: 'מהי אקזמה אטופית?', purpose: 'definition', contentGuidance: 'הגדרה: מחלת עור כרונית, מחסום עור פגום, תגובה חיסונית. שכיחות: 15-20% מהילדים.', schemaHint: 'MedicalCondition' },
      { heading: 'תסמינים של אקזמה בילדים', purpose: 'symptom mapping', contentGuidance: 'לפי גיל: תינוקות (פנים, קרקפת), פעוטות (קפלי ברכיים, מרפקים), גדולים (ידיים, צוואר).' },
      { heading: 'הקשר בין אקזמה לאלרגיה', purpose: 'core allergy connection', contentGuidance: 'Atopic March: אקזמה → אלרגיית מזון → אסתמה. 30% עם אקזמה חמורה = אלרגיה למזון.' },
      { heading: 'מתי אקזמה דורשת בדיקת אלרגיה?', purpose: 'diagnostic guidance', contentGuidance: 'אקזמה שלא מגיבה לטיפול, אקזמה + תגובה למזון, אקזמה חמורה לפני גיל שנה.' },
      { heading: 'טיפול יומיומי באקזמה', purpose: 'practical management', contentGuidance: 'שגרת לחות, מקלחות קצרות, משחות סטרואידים, הימנעות מטריגרים. טיפים להורים.' },
      { heading: 'טיפולים מתקדמים', purpose: 'specialist treatment', contentGuidance: 'Dupixent, פוטותרפיה, אימונותרפיה - מתי רלוונטי.' },
      { heading: 'מתי לפנות לאלרגולוג', purpose: 'escalation', contentGuidance: 'אקזמה שלא מגיבה, חשד לאלרגיה, שיקולי טעימות ראשונות.' },
    ],

    faqSuggestions: [
      { question: 'האם אקזמה בילדים קשורה לאלרגיה?', suggestedAnswer: 'כן - כ-30% מהילדים עם אקזמה חמורה יש גם אלרגיית מזון. אקזמה היא חלק מ-"הצעדה האטופית" שמקדימה אלרגיות ואסתמה.', intent: 'definition' },
      { question: 'איך מטפלים באקזמה בילדים?', suggestedAnswer: 'שגרת לחות יומית, מקלחות קצרות בפושרים, משחות סטרואידים לפי הנחיית רופא, והימנעות ממגרים (סבונים, בדים מגרדים).', intent: 'treatment' },
      { question: 'מתי לעשות בדיקת אלרגיה לילד עם אקזמה?', suggestedAnswer: 'כשהאקזמה חמורה, לא מגיבה לטיפול, או מופיעה עם תגובות למזונות - מומלץ בדיקת אלרגיה לזהות גורמים.', intent: 'diagnosis' },
      { question: 'האם אקזמה עוברת?', suggestedAnswer: 'ברוב הילדים האקזמה משתפרת עם הגיל. כ-60% מהילדים ישתפרו משמעותית עד גיל 5, אך חלק ימשיכו עם עור רגיש.', intent: 'reassurance' },
    ],

    internalLinkingSuggestions: [
      { anchorText: 'אלרגיה בילדים - מדריך מלא', targetPath: '/אלרגיה-בילדים-מדריך-מלא', context: 'פתיחה - Pillar link' },
      { anchorText: 'טעימות ראשונות לתינוקות', targetPath: '/guides/טעימות-ראשונות-אלרגנים', context: 'סקציית "הקשר לאלרגיה" - ילדים עם אקזמה צריכים התחלה מוקדמת' },
      { anchorText: 'בדיקות אלרגיה לילדים', targetPath: '/guides/בדיקות-אלרגיה-ילדים-ישראל', context: 'סקציית "מתי לבדוק"' },
      { anchorText: 'פריחה אחרי במבה', targetPath: '/knowledge/פריחה-אחרי-במבה', context: 'סקציית תסמינים - הבדל מאקזמה' },
    ],

    trustSignalImprovements: [
      'הוסף MedicalCondition JSON-LD (atopic dermatitis)',
      'הוסף AuthorBadge: ד״ר ברמלי עם ניסיון באלרגיה ועור',
      'הוסף הפניות: NICE guidelines, AAP Position Paper on AD',
      'הוסף disclaimer רפואי',
      'הוסף reviewed date + "נכתב ע"י אלרגולוגית מוסמכת"',
    ],

    structureNotes: 'דף חדש. אקזמה היא gateway content - הורים מחפשים "אקזמה בילדים" ומגלים את הקשר לאלרגיה. הדף חייב לחבר בין עולם העור לעולם האלרגיה ולהפנות לבדיקה.',
  },
];
