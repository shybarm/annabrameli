/* ─── Sprint 5 — GEO Scoring Engine ─── */

export type ScoreDimension =
  | 'answerClarity'
  | 'topicalSpecificity'
  | 'medicalTrust'
  | 'expertVisibility'
  | 'extractability'
  | 'internalLinking'
  | 'snippetUniqueness'
  | 'conversionClarity'
  | 'entityConsistency'
  | 'updateReadiness';

export const DIMENSION_META: Record<
  ScoreDimension,
  { label: string; labelEn: string; weight: number; icon: string }
> = {
  answerClarity:      { label: 'בהירות תשובה',       labelEn: 'Answer Clarity',        weight: 15, icon: '💡' },
  topicalSpecificity: { label: 'ספציפיות נושאית',     labelEn: 'Topical Specificity',   weight: 12, icon: '🎯' },
  medicalTrust:       { label: 'אמון רפואי',          labelEn: 'Medical Trust',         weight: 14, icon: '🏥' },
  expertVisibility:   { label: 'נראות מומחה',         labelEn: 'Expert Visibility',     weight: 12, icon: '👨‍⚕️' },
  extractability:     { label: 'יכולת חילוץ ל-AI',    labelEn: 'AI Extractability',     weight: 14, icon: '🤖' },
  internalLinking:    { label: 'קישור פנימי',         labelEn: 'Internal Linking',      weight: 8,  icon: '🔗' },
  snippetUniqueness:  { label: 'ייחוד Snippet',       labelEn: 'Snippet Uniqueness',    weight: 8,  icon: '✂️' },
  conversionClarity:  { label: 'בהירות המרה',         labelEn: 'Conversion Clarity',    weight: 7,  icon: '📞' },
  entityConsistency:  { label: 'עקביות ישויות',       labelEn: 'Entity Consistency',    weight: 5,  icon: '🏷️' },
  updateReadiness:    { label: 'עדכניות ומוכנות',     labelEn: 'Update Readiness',      weight: 5,  icon: '🔄' },
};

export type RecommendationLabel =
  | 'quick-win'
  | 'structural-change'
  | 'authority-project'
  | 'rewrite-required'
  | 'merge-consolidate'
  | 'new-page-needed';

export const REC_LABEL_META: Record<RecommendationLabel, { label: string; color: string; bg: string }> = {
  'quick-win':          { label: 'ניצחון מהיר',     color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950' },
  'structural-change':  { label: 'שינוי מבני',      color: 'text-blue-700 dark:text-blue-400',       bg: 'bg-blue-100 dark:bg-blue-950' },
  'authority-project':  { label: 'פרויקט סמכות',    color: 'text-purple-700 dark:text-purple-400',   bg: 'bg-purple-100 dark:bg-purple-950' },
  'rewrite-required':   { label: 'שכתוב נדרש',      color: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-100 dark:bg-amber-950' },
  'merge-consolidate':  { label: 'מיזוג / איחוד',   color: 'text-orange-700 dark:text-orange-400',   bg: 'bg-orange-100 dark:bg-orange-950' },
  'new-page-needed':    { label: 'דף חדש נדרש',     color: 'text-destructive',                       bg: 'bg-destructive/10' },
};

export interface DimensionScore {
  dimension: ScoreDimension;
  score: number; // 1-10
  working: string[];
  missing: string[];
  fixes: string[];
  impact: string;
}

export interface PageRecommendation {
  label: RecommendationLabel;
  text: string;
}

export type StrategicTag = 'ai-citable-first' | 'high-value-weak-format' | 'overbroad-needs-narrowing';

export interface ScoredPage {
  id: string;
  path: string;
  titleHe: string;
  type: 'article' | 'service' | 'homepage' | 'about' | 'faq' | 'contact' | 'guide' | 'knowledge';
  dimensions: DimensionScore[];
  weightedScore: number; // computed 1-10
  recommendations: PageRecommendation[];
  strategicTags: StrategicTag[];
}

/* helper to compute weighted score */
function computeWeighted(dims: DimensionScore[]): number {
  let totalW = 0;
  let totalS = 0;
  dims.forEach(d => {
    const w = DIMENSION_META[d.dimension].weight;
    totalW += w;
    totalS += d.score * w;
  });
  return Math.round((totalS / totalW) * 10) / 10;
}

/* ─── Page definitions ─── */

function mkPage(
  id: string,
  path: string,
  titleHe: string,
  type: ScoredPage['type'],
  dims: Omit<DimensionScore, 'dimension'>[],
  recs: PageRecommendation[],
  tags: StrategicTag[] = [],
): ScoredPage {
  const dimKeys: ScoreDimension[] = [
    'answerClarity','topicalSpecificity','medicalTrust','expertVisibility','extractability',
    'internalLinking','snippetUniqueness','conversionClarity','entityConsistency','updateReadiness',
  ];
  const dimensions = dimKeys.map((k, i) => ({ ...dims[i], dimension: k }));
  return { id, path, titleHe, type, dimensions, weightedScore: computeWeighted(dimensions), recommendations: recs, strategicTags: tags };
}

export const SCORED_PAGES: ScoredPage[] = [
  mkPage('home', '/', 'עמוד הבית', 'homepage',
    [
      { score: 6, working: ['כותרת ברורה', 'מבנה סקציות'], missing: ['תשובה ישירה לשאלה "מה זה אלרגיה בילדים"'], fixes: ['הוסף פסקת TL;DR מעל ה-fold'], impact: 'שיפור סיכוי לציטוט כתשובה מרכזית' },
      { score: 5, working: ['מיקוד באלרגיה'], missing: ['ספציפיות — הדף רחב מדי'], fixes: ['הגדר intent ראשי: שער כניסה לנושא אלרגיה בילדים'], impact: 'AI יבין שזה hub ולא דף תוכן' },
      { score: 7, working: ['שם הרופאה מופיע'], missing: ['תעודות רפואיות בולטות'], fixes: ['הוסף badge מומחיות מעל ה-fold'], impact: 'חיזוק E-E-A-T signal' },
      { score: 5, working: ['שם מופיע'], missing: ['תמונה מקצועית, credentials בולטים'], fixes: ['הוסף AuthorBadge עם תמונה ותואר'], impact: 'זיהוי מומחה מידי' },
      { score: 4, working: ['מבנה HTML סביר'], missing: ['בלוקים מובנים לחילוץ'], fixes: ['הוסף definition box, FAQ schema, key-facts'], impact: 'גידול משמעותי בסיכוי ציטוט' },
      { score: 6, working: ['קישורים לשירותים'], missing: ['קישורים למאמרים ומדריכים'], fixes: ['הוסף 4-6 קישורים למדריכים מרכזיים'], impact: 'חיזוק topical authority' },
      { score: 5, working: ['כותרת ייחודית'], missing: ['meta description ייחודי ומדויק'], fixes: ['שכתב meta desc עם מענה לשאלה'], impact: 'snippet ברור יותר בתוצאות' },
      { score: 7, working: ['CTA לוואטסאפ'], missing: ['CTA לקביעת תור'], fixes: ['הוסף כפתור "קבע בדיקת אלרגיה"'], impact: 'שיפור conversion rate' },
      { score: 6, working: ['שם קליניקה עקבי'], missing: ['שם דומיין ומותג אחיד'], fixes: ['תקן שימוש ב-ihaveallergy.com בכל מקום'], impact: 'עקביות brand signal' },
      { score: 4, working: ['דף פעיל'], missing: ['תאריך עדכון, תג "נבדק רפואית"'], fixes: ['הוסף "עודכן לאחרונה" ו-"נבדק ע"י ד"ר..."'], impact: 'אמון ועדכניות' },
    ],
    [
      { label: 'quick-win', text: 'הוסף פסקת TL;DR ו-AuthorBadge מעל ה-fold' },
      { label: 'structural-change', text: 'הגדר את הדף כ-hub עם קישורים ברורים לכל אשכול' },
      { label: 'quick-win', text: 'הוסף FAQ schema עם 3-5 שאלות נפוצות' },
    ],
    ['high-value-weak-format'],
  ),

  mkPage('about', '/about', 'אודות — ד"ר אנה ברמלי', 'about',
    [
      { score: 7, working: ['סיפור אישי ברור'], missing: ['תשובה ישירה: "מיהי ד"ר אנה ברמלי"'], fixes: ['פתח ב-1 משפט ישיר מי היא ומה המומחיות'], impact: 'תשובה ברורה לשאילתת AI' },
      { score: 8, working: ['ממוקד באלרגיה ואימונולוגיה'], missing: [], fixes: [], impact: '' },
      { score: 8, working: ['credentials ברורים'], missing: ['מספר רישיון, פרסומים'], fixes: ['הוסף מספר רישיון ורשימת פרסומים'], impact: 'חיזוק legitimacy' },
      { score: 7, working: ['תמונה מקצועית'], missing: ['Physician schema מלא'], fixes: ['הוסף JSON-LD Physician עם כל השדות'], impact: 'Knowledge Graph eligibility' },
      { score: 6, working: ['טקסט ברור'], missing: ['quote box, credentials list מובנים'], fixes: ['הוסף blockquote עם ציטוט מרכזי'], impact: 'חילוץ ציטוט קל' },
      { score: 5, working: ['קישור לשירותים'], missing: ['קישורים למאמרים שכתבה'], fixes: ['הוסף "מאמרים שכתבתי" עם 5 קישורים'], impact: 'authorship signals' },
      { score: 7, working: ['כותרת ייחודית'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['קישור ליצירת קשר'], missing: ['CTA ישיר לקביעת תור'], fixes: ['הוסף כפתור "קבע פגישה"'], impact: 'conversion' },
      { score: 8, working: ['שם עקבי'], missing: [], fixes: [], impact: '' },
      { score: 5, working: ['דף קיים'], missing: ['תאריך עדכון'], fixes: ['הוסף lastReviewed date'], impact: 'freshness signal' },
    ],
    [
      { label: 'quick-win', text: 'הוסף JSON-LD Physician schema מלא' },
      { label: 'quick-win', text: 'פתח ב-1 משפט ישיר "ד"ר אנה ברמלי היא..."' },
      { label: 'authority-project', text: 'הוסף רשימת פרסומים ומספר רישיון' },
    ],
    ['ai-citable-first'],
  ),

  mkPage('faq', '/faq', 'שאלות נפוצות', 'faq',
    [
      { score: 8, working: ['מבנה שאלה-תשובה ברור'], missing: ['תשובה ראשונה קצרה מדי'], fixes: ['הרחב כל תשובה ל-2-3 משפטים'], impact: 'יותר תוכן לחילוץ' },
      { score: 7, working: ['שאלות ספציפיות'], missing: ['קיבוץ לקטגוריות'], fixes: ['קבץ שאלות: תסמינים, אבחון, טיפול, זכויות'], impact: 'ניווט ברור יותר' },
      { score: 7, working: ['תוכן רפואי אמין'], missing: ['הפניות למקורות'], fixes: ['הוסף 2-3 הפניות למחקרים'], impact: 'trust signal' },
      { score: 5, working: ['שם מופיע בפוטר'], missing: ['AuthorBadge בדף'], fixes: ['הוסף "נכתב ע"י ד"ר..." בראש הדף'], impact: 'expert attribution' },
      { score: 9, working: ['מבנה FAQ מושלם לחילוץ'], missing: [], fixes: [], impact: '' },
      { score: 5, working: ['קישור לדף הבית'], missing: ['קישורים למאמרים רלוונטיים'], fixes: ['הוסף "קרא עוד" בסוף כל תשובה'], impact: 'internal linking + depth' },
      { score: 7, working: ['שאלות ייחודיות'], missing: ['חפיפה עם knowledge articles'], fixes: ['ודא שכל שאלה ב-FAQ מפנה למאמר מעמיק'], impact: 'de-duplicate' },
      { score: 6, working: ['CTA כללי'], missing: ['CTA מותאם לכל קטגוריית שאלה'], fixes: ['הוסף CTA ספציפי: "רוצה לבדוק?"'], impact: 'conversion' },
      { score: 7, working: ['עקבי'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['דף פעיל'], missing: ['תאריך עדכון אחרון'], fixes: ['הוסף "עודכן: ..."'], impact: 'freshness' },
    ],
    [
      { label: 'quick-win', text: 'הוסף FAQPage schema עם כל השאלות' },
      { label: 'structural-change', text: 'קבץ שאלות לקטגוריות עם קישורים למאמרים' },
      { label: 'quick-win', text: 'הוסף AuthorBadge בראש הדף' },
    ],
    ['ai-citable-first'],
  ),

  mkPage('contact', '/contact', 'יצירת קשר', 'contact',
    [
      { score: 5, working: ['פרטי קשר'], missing: ['תשובה ל-"איך להגיע" / "מספר טלפון"'], fixes: ['הוסף מענה ישיר בראש הדף'], impact: 'AI יכול לענות על שאילתת קשר' },
      { score: 6, working: ['ממוקד בקשר'], missing: [], fixes: [], impact: '' },
      { score: 5, working: ['כתובת'], missing: ['שעות פעילות, ביטוח, חניה'], fixes: ['הוסף פרטים מעשיים'], impact: 'trust + utility' },
      { score: 4, working: ['שם'], missing: ['credentials'], fixes: ['הוסף שורת credentials'], impact: 'authority' },
      { score: 5, working: ['מידע בסיסי'], missing: ['LocalBusiness schema'], fixes: ['הוסף JSON-LD LocalBusiness מלא'], impact: 'local SEO + AI' },
      { score: 3, working: [], missing: ['קישורים לשירותים'], fixes: ['הוסף "השירותים שלנו" עם 3-4 קישורים'], impact: 'internal linking' },
      { score: 6, working: ['כותרת ייחודית'], missing: [], fixes: [], impact: '' },
      { score: 7, working: ['טופס, וואטסאפ'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['שם עקבי'], missing: [], fixes: [], impact: '' },
      { score: 4, working: [], missing: ['שעות עדכניות, תאריך עדכון'], fixes: ['הוסף שעות + עדכון אחרון'], impact: 'freshness' },
    ],
    [
      { label: 'quick-win', text: 'הוסף LocalBusiness JSON-LD schema' },
      { label: 'quick-win', text: 'הוסף שעות פעילות, חניה, ביטוח' },
      { label: 'structural-change', text: 'הוסף קישורים לשירותים ולמאמרים' },
    ],
    [],
  ),

  mkPage('allergy-pillar', '/אלרגיה-בילדים-מדריך-מלא', 'אלרגיה בילדים — מדריך מלא', 'guide',
    [
      { score: 7, working: ['מדריך מקיף', 'מבנה ברור'], missing: ['TL;DR בראש'], fixes: ['הוסף פסקת סיכום 2-3 משפטים בראש'], impact: 'תשובה מיידית ל-AI' },
      { score: 9, working: ['ספציפי לאלרגיה בילדים'], missing: [], fixes: [], impact: '' },
      { score: 8, working: ['תוכן רפואי מעמיק'], missing: ['הפניות למחקרים'], fixes: ['הוסף 3-5 references'], impact: 'academic trust' },
      { score: 7, working: ['AuthorBadge'], missing: ['credentials בגוף המאמר'], fixes: ['הוסף שורת מומחיות בפתיחה'], impact: 'expert signal' },
      { score: 6, working: ['כותרות משנה'], missing: ['definition boxes, key-facts'], fixes: ['הוסף 2-3 תיבות הגדרה מוקפות'], impact: 'extractability for AI' },
      { score: 8, working: ['קישורים רבים למאמרי ידע'], missing: [], fixes: [], impact: '' },
      { score: 8, working: ['כותרת ייחודית ומדויקת'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['CTA בסוף'], missing: ['CTA באמצע'], fixes: ['הוסף CTA עדין אחרי סקציה 3'], impact: 'conversion' },
      { score: 8, working: ['שם עקבי'], missing: [], fixes: [], impact: '' },
      { score: 7, working: ['תאריך עדכון'], missing: ['תג "נבדק רפואית"'], fixes: ['הוסף reviewed badge'], impact: 'trust' },
    ],
    [
      { label: 'quick-win', text: 'הוסף TL;DR בראש + definition boxes' },
      { label: 'authority-project', text: 'הוסף הפניות למחקרים (PubMed)' },
    ],
    ['ai-citable-first'],
  ),

  mkPage('bamba', '/knowledge/bamba-at-4-months', 'במבה בגיל 4 חודשים', 'knowledge',
    [
      { score: 8, working: ['תשובה ישירה בפתיחה'], missing: [], fixes: [], impact: '' },
      { score: 9, working: ['ממוקד מאוד'], missing: [], fixes: [], impact: '' },
      { score: 7, working: ['תוכן אמין'], missing: ['מקור מחקרי (LEAP study)'], fixes: ['הוסף הפניה למחקר LEAP'], impact: 'evidence-based trust' },
      { score: 7, working: ['AuthorBadge'], missing: [], fixes: [], impact: '' },
      { score: 7, working: ['פסקאות קצרות'], missing: ['summary bullets'], fixes: ['הוסף 3-4 נקודות סיכום'], impact: 'snippet readiness' },
      { score: 6, working: ['קישור ל-pillar'], missing: ['קישורים ל-rash-after-bamba, oral-food-challenge'], fixes: ['הוסף 2 קישורים רלוונטיים'], impact: 'cluster strength' },
      { score: 8, working: ['כותרת ייחודית מאוד'], missing: [], fixes: [], impact: '' },
      { score: 5, working: ['CTA כללי'], missing: ['CTA ספציפי: "רוצה להתחיל במבה בבטחה?"'], fixes: ['שנה CTA לספציפי'], impact: 'conversion' },
      { score: 8, working: ['עקבי'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['פעיל'], missing: ['lastReviewed'], fixes: ['הוסף reviewed date'], impact: 'freshness' },
    ],
    [
      { label: 'quick-win', text: 'הוסף הפניה למחקר LEAP ו-summary bullets' },
      { label: 'quick-win', text: 'הוסף קישורים ל-2 מאמרים קשורים' },
    ],
    ['ai-citable-first'],
  ),

  mkPage('rash-bamba', '/knowledge/rash-after-bamba', 'פריחה אחרי במבה', 'knowledge',
    [
      { score: 7, working: ['כותרת ברורה'], missing: ['תשובה ישירה "האם זו אלרגיה?"'], fixes: ['פתח ב-"פריחה אחרי במבה לא בהכרח מעידה על אלרגיה"'], impact: 'reassurance answer' },
      { score: 8, working: ['ממוקד מאוד'], missing: [], fixes: [], impact: '' },
      { score: 7, working: ['אמין'], missing: ['סימני אזהרה מפורטים'], fixes: ['הוסף רשימת red flags'], impact: 'emergency guidance' },
      { score: 6, working: ['שם מופיע'], missing: ['AuthorBadge בולט'], fixes: ['הגדל AuthorBadge'], impact: 'expert signal' },
      { score: 6, working: ['מבנה סביר'], missing: ['comparison table: אלרגיה vs רגישות'], fixes: ['הוסף טבלת השוואה'], impact: 'high extractability' },
      { score: 5, working: ['קישור ל-pillar'], missing: ['קישור ל-bamba-at-4-months, skin-prick'], fixes: ['הוסף 2 internal links'], impact: 'cluster linking' },
      { score: 7, working: ['ייחודי'], missing: [], fixes: [], impact: '' },
      { score: 5, working: ['CTA'], missing: ['CTA ממוקד'], fixes: ['הוסף "מודאג? קבע בדיקה"'], impact: 'conversion' },
      { score: 7, working: ['עקבי'], missing: [], fixes: [], impact: '' },
      { score: 5, working: ['פעיל'], missing: ['reviewed date'], fixes: ['הוסף תאריך בדיקה'], impact: 'freshness' },
    ],
    [
      { label: 'quick-win', text: 'פתח בתשובה ישירה + הוסף comparison table' },
      { label: 'structural-change', text: 'הוסף רשימת red flags לזיהוי חירום' },
    ],
    ['high-value-weak-format'],
  ),

  mkPage('oral-challenge', '/knowledge/oral-food-challenge', 'אתגר מזון אוראלי', 'knowledge',
    [
      { score: 7, working: ['מבנה ברור'], missing: ['הגדרה ישירה בשורה 1'], fixes: ['פתח ב-"אתגר מזון הוא בדיקה מבוקרת ש..."'], impact: 'definition for AI' },
      { score: 9, working: ['ממוקד ביותר'], missing: [], fixes: [], impact: '' },
      { score: 8, working: ['תהליך רפואי מפורט'], missing: [], fixes: [], impact: '' },
      { score: 7, working: ['AuthorBadge'], missing: [], fixes: [], impact: '' },
      { score: 7, working: ['steps list'], missing: ['תיבת "מה לצפות"'], fixes: ['הוסף expectation box'], impact: 'extractable block' },
      { score: 7, working: ['קישורים רלוונטיים'], missing: [], fixes: [], impact: '' },
      { score: 8, working: ['ייחודי מאוד'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['CTA כללי'], missing: ['CTA: "לקבוע אתגר מזון"'], fixes: ['CTA ספציפי לשירות'], impact: 'conversion' },
      { score: 8, working: ['עקבי'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['פעיל'], missing: ['reviewed date'], fixes: ['הוסף תאריך'], impact: 'freshness' },
    ],
    [
      { label: 'quick-win', text: 'פתח בהגדרה ישירה + הוסף expectation box' },
    ],
    ['ai-citable-first'],
  ),

  mkPage('golden-guide', '/golden-guide', 'המדריך המוזהב', 'guide',
    [
      { score: 6, working: ['תוכן עשיר'], missing: ['TL;DR + מבנה answer-first'], fixes: ['הוסף סיכום 3 משפטים בראש'], impact: 'AI summary' },
      { score: 7, working: ['ממוקד'], missing: ['כותרות משנה ספציפיות יותר'], fixes: ['שכתב כותרות ל-H2 שאלתיות'], impact: 'retrieval precision' },
      { score: 8, working: ['אמין, עמוק'], missing: [], fixes: [], impact: '' },
      { score: 7, working: ['AuthorBadge'], missing: [], fixes: [], impact: '' },
      { score: 5, working: ['טקסט ארוך'], missing: ['בלוקים מובנים, key-facts'], fixes: ['הוסף 3-4 fact boxes ו-summary bullets'], impact: 'extractability boost' },
      { score: 7, working: ['קישורים פנימיים'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['כותרת ייחודית'], missing: ['meta desc מדויק יותר'], fixes: ['שכתב meta description'], impact: 'snippet quality' },
      { score: 5, working: ['CTA בסוף'], missing: ['CTA עדין באמצע'], fixes: ['הוסף soft CTA אחרי סקציה 2'], impact: 'conversion' },
      { score: 8, working: ['עקבי'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['פעיל'], missing: ['reviewed badge'], fixes: ['הוסף "נבדק רפואית"'], impact: 'trust' },
    ],
    [
      { label: 'rewrite-required', text: 'שכתב כותרות ל-H2 שאלתיות + הוסף fact boxes' },
      { label: 'quick-win', text: 'הוסף TL;DR בראש ו-reviewed badge' },
    ],
    ['high-value-weak-format', 'overbroad-needs-narrowing'],
  ),

  mkPage('golden-rights', '/golden-guide-rights', 'מדריך זכויות ילדים אלרגיים', 'guide',
    [
      { score: 8, working: ['תשובות ישירות לשאלות זכויות'], missing: [], fixes: [], impact: '' },
      { score: 9, working: ['ייחודי ומאוד ספציפי'], missing: [], fixes: [], impact: '' },
      { score: 7, working: ['מידע מהימן'], missing: ['הפניות לחוקים'], fixes: ['הוסף הפניות לחוק חינוך מיוחד'], impact: 'legal trust' },
      { score: 6, working: ['שם מופיע'], missing: ['AuthorBadge בולט'], fixes: ['הגדל AuthorBadge'], impact: 'authority' },
      { score: 8, working: ['רשימות, מבנה ברור'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['קישור ל-pillar'], missing: ['קישורים ל-garden-refusal, medical-aide'], fixes: ['הוסף 2 internal links'], impact: 'cluster' },
      { score: 9, working: ['ייחודי ביותר — אין מתחרים'], missing: [], fixes: [], impact: '' },
      { score: 5, working: ['CTA כללי'], missing: ['CTA: "צריך אישור רפואי?"'], fixes: ['CTA ספציפי'], impact: 'conversion' },
      { score: 8, working: ['עקבי'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['פעיל'], missing: ['reviewed date'], fixes: ['הוסף תאריך'], impact: 'freshness' },
    ],
    [
      { label: 'quick-win', text: 'הוסף קישורים ל-2 מאמרים קשורים' },
      { label: 'authority-project', text: 'הוסף הפניות לחוקים ותקנות' },
    ],
    ['ai-citable-first'],
  ),

  mkPage('services', '/services', 'השירותים שלנו', 'service',
    [
      { score: 4, working: ['רשימת שירותים'], missing: ['תיאור ברור של כל שירות'], fixes: ['הוסף 2-3 משפטים לכל שירות'], impact: 'answer clarity per service' },
      { score: 5, working: ['ממוקד בשירותים'], missing: ['ספציפי מדי מול רחב מדי'], fixes: ['שקול פיצול לדפי שירות נפרדים'], impact: 'ranking per service' },
      { score: 6, working: ['הקשר רפואי'], missing: ['מה כולל כל ביקור'], fixes: ['הוסף "מה צפוי בביקור"'], impact: 'trust + booking' },
      { score: 4, working: ['שם'], missing: ['credentials, ניסיון'], fixes: ['הוסף שורת ניסיון'], impact: 'expert signal' },
      { score: 3, working: ['מבנה רשימה'], missing: ['definition per service, FAQ'], fixes: ['הוסף FAQ לכל שירות'], impact: 'extractability' },
      { score: 4, working: ['מעט קישורים'], missing: ['קישורים למאמרים רלוונטיים'], fixes: ['קשר כל שירות למאמרים'], impact: 'topical authority' },
      { score: 4, working: ['כותרת'], missing: ['meta desc ייחודי'], fixes: ['שכתב meta description'], impact: 'snippet' },
      { score: 6, working: ['CTA'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['עקבי'], missing: [], fixes: [], impact: '' },
      { score: 3, working: [], missing: ['תאריך, reviewed'], fixes: ['הוסף reviewed badge + date'], impact: 'trust' },
    ],
    [
      { label: 'rewrite-required', text: 'שכתב כל שירות עם תיאור מלא + FAQ' },
      { label: 'structural-change', text: 'שקול פיצול לדפי שירות עצמאיים' },
      { label: 'new-page-needed', text: 'צור דפי שירות נפרדים לבדיקות עור, אתגר מזון, ייעוץ' },
    ],
    ['overbroad-needs-narrowing'],
  ),

  mkPage('skin-prick', '/knowledge/skin-prick-pain', 'האם בדיקת דקירה כואבת?', 'knowledge',
    [
      { score: 9, working: ['תשובה ישירה בכותרת ובפתיחה'], missing: [], fixes: [], impact: '' },
      { score: 9, working: ['שאלה אחת ממוקדת'], missing: [], fixes: [], impact: '' },
      { score: 7, working: ['אמין'], missing: [], fixes: [], impact: '' },
      { score: 7, working: ['AuthorBadge'], missing: [], fixes: [], impact: '' },
      { score: 8, working: ['פסקה קצרה וברורה'], missing: ['comparison: דקירה vs דם'], fixes: ['הוסף טבלת השוואה קצרה'], impact: 'extractable comparison' },
      { score: 6, working: ['קישור ל-pillar'], missing: ['קישור ל-blood-test'], fixes: ['הוסף קישור'], impact: 'linking' },
      { score: 9, working: ['ייחודי ביותר'], missing: [], fixes: [], impact: '' },
      { score: 5, working: ['CTA'], missing: ['CTA: "רוצה לקבוע בדיקה?"'], fixes: ['CTA ספציפי'], impact: 'conversion' },
      { score: 8, working: ['עקבי'], missing: [], fixes: [], impact: '' },
      { score: 6, working: ['פעיל'], missing: ['reviewed date'], fixes: ['הוסף'], impact: 'freshness' },
    ],
    [
      { label: 'quick-win', text: 'הוסף comparison table: דקירה vs בדיקת דם' },
    ],
    ['ai-citable-first'],
  ),
];

/* ─── Strategic lists computed from data ─── */
export function getAICitableFirst(): ScoredPage[] {
  return SCORED_PAGES.filter(p => p.strategicTags.includes('ai-citable-first'))
    .sort((a, b) => b.weightedScore - a.weightedScore);
}

export function getHighValueWeakFormat(): ScoredPage[] {
  return SCORED_PAGES.filter(p => p.strategicTags.includes('high-value-weak-format'))
    .sort((a, b) => b.weightedScore - a.weightedScore);
}

export function getOverbroadPages(): ScoredPage[] {
  return SCORED_PAGES.filter(p => p.strategicTags.includes('overbroad-needs-narrowing'));
}
