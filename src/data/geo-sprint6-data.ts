export type TaskOwner = 'content' | 'seo' | 'brand' | 'dev' | 'medical';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Impact = 'high' | 'medium' | 'low';
export type Phase = 1 | 2 | 3;
export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked';

export interface ExecutionTask {
  id: string;
  phase: Phase;
  title: string;
  description: string;
  owner: TaskOwner;
  difficulty: Difficulty;
  impact: Impact;
  dependency: string | null;
  estimatedOutcome: string;
  status: TaskStatus;
  week: number;
  daysEstimate: number;
}

export const PHASE_META: Record<Phase, { title: string; titleHe: string; weeks: string; color: string; goal: string }> = {
  1: { title: 'Foundation', titleHe: 'יסודות', weeks: '1–4', color: 'primary', goal: 'חיזוק מבנה בסיסי, אמינות מומחה, ובהירות מסרים - מ-6.0 ל-6.8' },
  2: { title: 'Content Structure', titleHe: 'מבנה תוכן', weeks: '5–8', color: 'amber', goal: 'שכתוב תבניות, מאמרים, ודפי שירות - מ-6.8 ל-7.4' },
  3: { title: 'Authority & Expansion', titleHe: 'סמכות והרחבה', weeks: '9–12', color: 'emerald', goal: 'אשכולות חסרים, דפי השוואה, ומעגל GEO חודשי - מ-7.4 ל-8.0' },
};

export const OWNER_LABELS: Record<TaskOwner, { label: string; color: string }> = {
  content: { label: 'תוכן', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  seo: { label: 'SEO', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  brand: { label: 'מיתוג', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300' },
  dev: { label: 'פיתוח', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' },
  medical: { label: 'רפואי', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

export const EXECUTION_TASKS: ExecutionTask[] = [
  // Phase 1: Foundation (Weeks 1-4)
  {
    id: 'p1-01', phase: 1, week: 1, daysEstimate: 2,
    title: 'שכתוב Hero של דף הבית',
    description: 'תשובה ישירה בפסקה ראשונה: מי הרופאה, מה המומחיות, למי מתאים. כותרת H1 ממוקדת עם שם + התמחות.',
    owner: 'content', difficulty: 'easy', impact: 'high', dependency: null,
    estimatedOutcome: 'עלייה ב-Answer Clarity מ-5 ל-8; AI יזהה את דף הבית כמקור סמכותי',
    status: 'todo',
  },
  {
    id: 'p1-02', phase: 1, week: 1, daysEstimate: 3,
    title: 'חיזוק דף אודות - ביוגרפיה מומחית',
    description: 'הוספת קטע credentials מובנה, ניסיון מקצועי, התמחויות, ושורת סמכות רפואית ברורה.',
    owner: 'content', difficulty: 'medium', impact: 'high', dependency: null,
    estimatedOutcome: 'Expert Visibility מ-4 ל-7; דף אודות הופך למקור ציטוט עיקרי',
    status: 'todo',
  },
  {
    id: 'p1-03', phase: 1, week: 1, daysEstimate: 1,
    title: 'אחידות שם מומחה בכל הדפים',
    description: 'סריקה והחלפה: שם מלא + תואר + התמחות - זהה בכל byline, כותרת, ו-footer.',
    owner: 'seo', difficulty: 'easy', impact: 'high', dependency: null,
    estimatedOutcome: 'Entity Consistency מ-6 ל-9; AI מזהה ישות אחת ברורה',
    status: 'todo',
  },
  {
    id: 'p1-04', phase: 1, week: 2, daysEstimate: 2,
    title: 'ארכיטקטורת אמון - פוטר ודפים משפטיים',
    description: 'הוספת שורת אמון בפוטר: רישיון, כתובת, טלפון, שעות. עדכון דפי פרטיות ונגישות.',
    owner: 'dev', difficulty: 'easy', impact: 'medium', dependency: null,
    estimatedOutcome: 'Medical Trust מ-6 ל-7; אותות אמינות גלויים לכל דף',
    status: 'todo',
  },
  {
    id: 'p1-05', phase: 1, week: 2, daysEstimate: 2,
    title: 'חידוד meta titles ו-descriptions - 10 דפים מרכזיים',
    description: 'כתיבת title < 60 תווים עם מילת מפתח + שם מומחה. Description < 160 תווים עם תשובה ישירה.',
    owner: 'seo', difficulty: 'easy', impact: 'medium', dependency: 'p1-01',
    estimatedOutcome: 'Extractability מ-5 ל-7; שיפור CTR ממנועי חיפוש',
    status: 'todo',
  },
  {
    id: 'p1-06', phase: 1, week: 3, daysEstimate: 3,
    title: 'שכתוב 5 דפים מרכזיים - answer-first',
    description: 'דף הבית, אודות, FAQ, בדיקות אלרגיה, אלרגיה למזון אצל תינוקות. תשובה ישירה בפסקה ראשונה.',
    owner: 'content', difficulty: 'medium', impact: 'high', dependency: 'p1-01',
    estimatedOutcome: 'ציון GEO ממוצע עולה מ-6.0 ל-6.5 על 5 דפים מרכזיים',
    status: 'todo',
  },
  {
    id: 'p1-07', phase: 1, week: 3, daysEstimate: 1,
    title: 'הוספת JSON-LD MedicalWebPage Schema',
    description: 'סכימה מובנית עם author, reviewer, dateModified, medicalSpecialty לכל דף רפואי.',
    owner: 'dev', difficulty: 'easy', impact: 'medium', dependency: 'p1-02',
    estimatedOutcome: 'Extractability מ-5 ל-7; AI מפענח metadata מובנה',
    status: 'todo',
  },
  {
    id: 'p1-08', phase: 1, week: 4, daysEstimate: 2,
    title: 'ביקורת רפואית - חותמת סקירה על 10 מאמרים',
    description: 'הוספת AuthorBadge עם תאריך סקירה אחרון ושם הרופא/ה הסוקר/ת.',
    owner: 'medical', difficulty: 'easy', impact: 'high', dependency: 'p1-03',
    estimatedOutcome: 'Medical Trust מ-6 ל-8; AI מזהה תוכן שנסקר רפואית',
    status: 'todo',
  },

  // Phase 2: Content Structure (Weeks 5-8)
  {
    id: 'p2-01', phase: 2, week: 5, daysEstimate: 3,
    title: 'פריסת תבניות תוכן - 7 סוגי דף',
    description: 'הטמעת תבניות: מצב רפואי, סימפטום, שירות, FAQ, ביו מומחה, השוואה, הדרכת הורים.',
    owner: 'dev', difficulty: 'medium', impact: 'high', dependency: 'p1-06',
    estimatedOutcome: 'כל דף חדש נולד עם מבנה GEO-ready; Extractability בסיס 7+',
    status: 'todo',
  },
  {
    id: 'p2-02', phase: 2, week: 5, daysEstimate: 4,
    title: 'שכתוב דפי שירות - 4 דפים',
    description: 'בדיקות עור, אתגרי מזון, ייעוץ אלרגיה, מעקב אטופיק. מבנה: מה, למי, מתי, למה אצלנו.',
    owner: 'content', difficulty: 'medium', impact: 'high', dependency: 'p2-01',
    estimatedOutcome: 'Conversion Clarity מ-4 ל-7; דפי שירות הופכים ל-answer sources',
    status: 'todo',
  },
  {
    id: 'p2-03', phase: 2, week: 6, daysEstimate: 5,
    title: 'שכתוב 6 מאמרים רפואיים מובילים',
    description: 'חלב, בוטנים/במבה, אקזמה, מבוא מזון, זכויות ילד אלרגי, חירום. פורמט answer-first.',
    owner: 'content', difficulty: 'hard', impact: 'high', dependency: 'p2-01',
    estimatedOutcome: 'ציון GEO ממוצע מ-6.5 ל-7.2 על מאמרים מרכזיים',
    status: 'todo',
  },
  {
    id: 'p2-04', phase: 2, week: 7, daysEstimate: 3,
    title: 'שדרוג ארכיטקטורת FAQ',
    description: 'פיצול FAQ לפי אשכול נושאי, הוספת FAQPage schema, קישור לדפים רלוונטיים מכל שאלה.',
    owner: 'seo', difficulty: 'medium', impact: 'medium', dependency: 'p2-03',
    estimatedOutcome: 'Topical Specificity מ-5 ל-7; AI מצליח לשלוף תשובות ממוקדות',
    status: 'todo',
  },
  {
    id: 'p2-05', phase: 2, week: 7, daysEstimate: 2,
    title: 'הוספת פסקאות answer-first ל-15 דפים',
    description: 'כל דף מתחיל בפסקה אחת שעונה על השאלה המרכזית ישירות, לפני כל תוכן נוסף.',
    owner: 'content', difficulty: 'easy', impact: 'high', dependency: 'p2-03',
    estimatedOutcome: 'Answer Clarity ממוצע עולה ב-1.5 נקודות',
    status: 'todo',
  },
  {
    id: 'p2-06', phase: 2, week: 8, daysEstimate: 3,
    title: 'חיזוק קישור פנימי - רשת אשכולות',
    description: 'כל pillar page מקשר ל-3+ supporting pages ולהפך. הוספת "קרא עוד" contextual links.',
    owner: 'seo', difficulty: 'medium', impact: 'medium', dependency: 'p2-03',
    estimatedOutcome: 'Internal Linking מ-4 ל-7; AI מנווט בין דפים קשורים',
    status: 'todo',
  },

  // Phase 3: Authority & Expansion (Weeks 9-12)
  {
    id: 'p3-01', phase: 3, week: 9, daysEstimate: 5,
    title: 'בניית אשכולות נושאיים חסרים',
    description: 'יצירת pillar pages: חירום אלרגי, תסמיני עור, מוכנות גן/בי"ס. 3 supporting לכל אחד.',
    owner: 'content', difficulty: 'hard', impact: 'high', dependency: 'p2-06',
    estimatedOutcome: 'AI Coverage Depth עולה מ-55% ל-75%; כיסוי נושאי מקיף',
    status: 'todo',
  },
  {
    id: 'p3-02', phase: 3, week: 9, daysEstimate: 4,
    title: 'יצירת דפי השוואה ותמיכה בהחלטות',
    description: 'בדיקת עור vs דם, פרטי vs ציבורי, מתי לפנות vs לחכות. פורמט טבלת השוואה + המלצה.',
    owner: 'content', difficulty: 'medium', impact: 'high', dependency: 'p2-01',
    estimatedOutcome: 'Snippet Uniqueness מ-5 ל-8; תוכן שאין למתחרים',
    status: 'todo',
  },
  {
    id: 'p3-03', phase: 3, week: 10, daysEstimate: 3,
    title: 'חיזוק אותות סמכות חיצוניים',
    description: 'רישום בספריות רפואיות, פרופיל Google Scholar, ציטוטים בפורומים מקצועיים.',
    owner: 'brand', difficulty: 'medium', impact: 'medium', dependency: 'p1-02',
    estimatedOutcome: 'External Authority מ-30 ל-50; AI מוצא אזכורים חיצוניים',
    status: 'todo',
  },
  {
    id: 'p3-04', phase: 3, week: 10, daysEstimate: 2,
    title: 'איחוד מותג וישות - דומיין יחיד',
    description: 'הפניית כל הגרסאות לדומיין קנוני, אחידות שם בכל הפלטפורמות, og:image אחיד.',
    owner: 'brand', difficulty: 'easy', impact: 'medium', dependency: 'p1-03',
    estimatedOutcome: 'Entity Consistency 9+; AI מזהה ישות מותגית אחת',
    status: 'todo',
  },
  {
    id: 'p3-05', phase: 3, week: 11, daysEstimate: 2,
    title: 'תכנון תוכן חודשי - update signals',
    description: 'לוח שנה: מאמר חדש/עדכון כל שבועיים, סקירת dateModified, תוכן עונתי.',
    owner: 'content', difficulty: 'easy', impact: 'medium', dependency: null,
    estimatedOutcome: 'Update Readiness מ-4 ל-7; AI רואה אתר פעיל ומתעדכן',
    status: 'todo',
  },
  {
    id: 'p3-06', phase: 3, week: 11, daysEstimate: 1,
    title: 'הגדרת מעגל סקירת GEO חודשי',
    description: 'תהליך: בדיקת ציונים, זיהוי נסיגות, 3 משימות שיפור, ביקורת רפואית רבעונית.',
    owner: 'seo', difficulty: 'easy', impact: 'high', dependency: 'p3-05',
    estimatedOutcome: 'שמירה על ציון 8+ לטווח ארוך; מניעת נסיגה',
    status: 'todo',
  },
  {
    id: 'p3-07', phase: 3, week: 12, daysEstimate: 2,
    title: 'מדידת ציון GEO סופי וסיכום ספרינט',
    description: 'הרצת Sprint 5 scoring engine מחדש, השוואה ל-baseline, דו"ח התקדמות.',
    owner: 'seo', difficulty: 'easy', impact: 'low', dependency: 'p3-06',
    estimatedOutcome: 'ציון GEO ממוצע 8.0+; דו"ח ROI לצוות',
    status: 'todo',
  },
];

/**
 * Maps pageIds (from the transform system) to 90-day task IDs.
 * When a page is saved to DB, matching tasks are auto-completed.
 */
export const PAGE_TO_TASK_MAP: Record<string, string[]> = {
  'homepage': ['p1-01', 'p1-06'],
  'about': ['p1-02', 'p1-06'],
  'allergy-testing': ['p1-06', 'p2-02'],
  'first-foods': ['p1-06'],
  'bamba-reaction': ['p2-03'],
  'knowledge:פריחה-אחרי-במבה': ['p2-03'],
  'blog:אלרגולוג-ילדים-הרצליה-הוד-השרון': ['p2-03'],
};
