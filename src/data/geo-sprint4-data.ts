
export type IntentType = 'definition' | 'symptom' | 'diagnosis' | 'treatment' | 'reassurance' | 'emergency' | 'booking';

export const INTENT_LABELS: Record<IntentType, { label: string; color: string; icon: string }> = {
  definition: { label: 'הגדרה', color: 'hsl(var(--primary))', icon: '📘' },
  symptom: { label: 'תסמין', color: 'hsl(25, 95%, 53%)', icon: '🔍' },
  diagnosis: { label: 'אבחון', color: 'hsl(262, 83%, 58%)', icon: '🧪' },
  treatment: { label: 'טיפול / צעד הבא', color: 'hsl(142, 76%, 36%)', icon: '💊' },
  reassurance: { label: 'הרגעה', color: 'hsl(199, 89%, 48%)', icon: '🤗' },
  emergency: { label: 'חירום', color: 'hsl(0, 84%, 60%)', icon: '🚨' },
  booking: { label: 'הזמנת תור', color: 'hsl(45, 93%, 47%)', icon: '📅' },
};

export interface ClusterPage {
  path: string;
  titleHe: string;
  role: 'pillar' | 'supporting' | 'missing' | 'duplicate' | 'weak';
  intent: IntentType;
  geoScore: number;
  notes?: string;
  linksTo?: string[];
  linksMissing?: string[];
}

export interface TopicCluster {
  id: string;
  nameHe: string;
  nameEn: string;
  coverageDepth: number; // 0-100
  coverageVerdict: 'comprehensive' | 'moderate' | 'thin' | 'minimal';
  pages: ClusterPage[];
  missingIntents: IntentType[];
  summary: string;
}

function verdict(d: number): TopicCluster['coverageVerdict'] {
  if (d >= 75) return 'comprehensive';
  if (d >= 50) return 'moderate';
  if (d >= 25) return 'thin';
  return 'minimal';
}

export const TOPIC_CLUSTERS: TopicCluster[] = [
  {
    id: 'food-allergy',
    nameHe: 'אלרגיה למזון',
    nameEn: 'Food Allergy',
    coverageDepth: 72,
    coverageVerdict: 'moderate',
    summary: 'כיסוי טוב ברמת הגדרה ותסמינים. חסרים דפי טיפול ואבחון ייעודיים.',
    missingIntents: ['treatment', 'emergency'],
    pages: [
      { path: '/אלרגיה-בילדים-מדריך-מלא', titleHe: 'אלרגיה בילדים — מדריך מלא', role: 'pillar', intent: 'definition', geoScore: 8, linksTo: ['/knowledge/bamba-at-4-months', '/knowledge/oral-food-challenge'], linksMissing: ['/knowledge/blood-test-allergy'] },
      { path: '/knowledge/oral-food-challenge', titleHe: 'אתגר מזון אוראלי', role: 'supporting', intent: 'diagnosis', geoScore: 7 },
      { path: '/knowledge/blood-test-allergy', titleHe: 'בדיקת דם לאלרגיה', role: 'supporting', intent: 'diagnosis', geoScore: 6 },
      { path: '/knowledge/positive-without-symptoms', titleHe: 'תוצאה חיובית בלי תסמינים', role: 'supporting', intent: 'reassurance', geoScore: 7 },
      { path: '/knowledge/days-between-allergens', titleHe: 'כמה ימים בין אלרגנים', role: 'supporting', intent: 'treatment', geoScore: 6 },
      { path: '', titleHe: 'מה לעשות בתגובה אלרגית חריפה (אנפילקסיס)', role: 'missing', intent: 'emergency', geoScore: 0, notes: 'דף חירום קריטי חסר — נדרש בדחיפות' },
      { path: '', titleHe: 'טיפול באלרגיית מזון: גישות ותרופות', role: 'missing', intent: 'treatment', geoScore: 0, notes: 'אין דף מרכזי לטיפול — פער משמעותי' },
    ],
  },
  {
    id: 'milk-allergy',
    nameHe: 'אלרגיה לחלב',
    nameEn: 'Milk Allergy',
    coverageDepth: 28,
    coverageVerdict: 'thin',
    summary: 'נושא מבוקש מאוד עם כיסוי מינימלי. חסר דף pillar ייעודי.',
    missingIntents: ['definition', 'symptom', 'treatment', 'reassurance'],
    pages: [
      { path: '', titleHe: 'אלרגיה לחלב פרה אצל תינוקות — מדריך להורים', role: 'missing', intent: 'definition', geoScore: 0, notes: 'דף Pillar חסר לחלוטין' },
      { path: '', titleHe: 'תסמיני אלרגיה לחלב — מה לחפש', role: 'missing', intent: 'symptom', geoScore: 0 },
      { path: '', titleHe: 'תחליפי חלב בטוחים לתינוקות אלרגיים', role: 'missing', intent: 'treatment', geoScore: 0 },
      { path: '', titleHe: 'האם הילד שלי באמת אלרגי לחלב?', role: 'missing', intent: 'reassurance', geoScore: 0 },
    ],
  },
  {
    id: 'peanut-bamba',
    nameHe: 'בוטנים ובמבה',
    nameEn: 'Peanut & Bamba',
    coverageDepth: 65,
    coverageVerdict: 'moderate',
    summary: 'כיסוי סביר עם דפים קיימים. חסר דף אבחון ודף חירום.',
    missingIntents: ['diagnosis', 'emergency'],
    pages: [
      { path: '/knowledge/bamba-at-4-months', titleHe: 'במבה בגיל 4 חודשים', role: 'pillar', intent: 'treatment', geoScore: 7, linksTo: ['/knowledge/rash-after-bamba'] },
      { path: '/knowledge/rash-after-bamba', titleHe: 'פריחה אחרי במבה', role: 'supporting', intent: 'symptom', geoScore: 7 },
      { path: '/knowledge/vomiting-after-tahini', titleHe: 'הקאה אחרי טחינה', role: 'supporting', intent: 'symptom', geoScore: 6 },
      { path: '', titleHe: 'אבחון אלרגיה לבוטנים — מה כולל התהליך', role: 'missing', intent: 'diagnosis', geoScore: 0 },
      { path: '', titleHe: 'תגובה אלרגית לבוטנים — מתי לרוץ למיון', role: 'missing', intent: 'emergency', geoScore: 0 },
    ],
  },
  {
    id: 'baby-first-foods',
    nameHe: 'תגובות לתינוקות למזון ראשון',
    nameEn: 'Baby First Food Reactions',
    coverageDepth: 55,
    coverageVerdict: 'moderate',
    summary: 'מכוסה חלקית דרך דפי במבה וטחינה. חסר מדריך הכנסת מזונות מקיף.',
    missingIntents: ['definition', 'treatment'],
    pages: [
      { path: '/knowledge/bamba-at-4-months', titleHe: 'במבה בגיל 4 חודשים', role: 'supporting', intent: 'treatment', geoScore: 7 },
      { path: '/knowledge/rash-after-bamba', titleHe: 'פריחה אחרי במבה', role: 'supporting', intent: 'symptom', geoScore: 7 },
      { path: '/knowledge/vomiting-after-tahini', titleHe: 'הקאה אחרי טחינה', role: 'supporting', intent: 'symptom', geoScore: 6 },
      { path: '/knowledge/redness-around-mouth', titleHe: 'אדמומיות סביב הפה', role: 'supporting', intent: 'reassurance', geoScore: 6 },
      { path: '', titleHe: 'מדריך הכנסת אלרגנים לתינוקות — שלב אחר שלב', role: 'missing', intent: 'definition', geoScore: 0, notes: 'Pillar חסר — מדריך מרכזי' },
      { path: '', titleHe: 'לוח זמנים מומלץ להכנסת מזונות אלרגניים', role: 'missing', intent: 'treatment', geoScore: 0 },
    ],
  },
  {
    id: 'skin-eczema',
    nameHe: 'תסמיני עור ואקזמה',
    nameEn: 'Skin Symptoms & Eczema',
    coverageDepth: 22,
    coverageVerdict: 'thin',
    summary: 'כיסוי דל מאוד. נושא נפוץ בלי דף מרכזי או דפי תסמינים.',
    missingIntents: ['definition', 'symptom', 'diagnosis', 'treatment', 'reassurance'],
    pages: [
      { path: '/knowledge/rash-after-bamba', titleHe: 'פריחה אחרי במבה', role: 'weak', intent: 'symptom', geoScore: 5, notes: 'קשור חלקית — לא מכסה אקזמה' },
      { path: '/knowledge/redness-around-mouth', titleHe: 'אדמומיות סביב הפה', role: 'weak', intent: 'reassurance', geoScore: 5, notes: 'צר מדי — לא מכסה עור באופן כללי' },
      { path: '', titleHe: 'אטופיק דרמטיטיס (אקזמה) בילדים — מדריך מלא', role: 'missing', intent: 'definition', geoScore: 0, notes: 'Pillar חסר — עדיפות גבוהה' },
      { path: '', titleHe: 'האם הפריחה של הילד שלי קשורה לאלרגיה?', role: 'missing', intent: 'symptom', geoScore: 0 },
      { path: '', titleHe: 'טיפול באקזמה — קרמים, מניעה, ומתי לפנות לרופא', role: 'missing', intent: 'treatment', geoScore: 0 },
    ],
  },
  {
    id: 'allergy-testing',
    nameHe: 'בדיקות אלרגיה',
    nameEn: 'Allergy Testing',
    coverageDepth: 68,
    coverageVerdict: 'moderate',
    summary: 'כיסוי טוב בבדיקות ספציפיות. חסר דף מסכם של כל סוגי הבדיקות.',
    missingIntents: ['booking'],
    pages: [
      { path: '/knowledge/skin-prick-pain', titleHe: 'האם בדיקת דקירה כואבת?', role: 'supporting', intent: 'reassurance', geoScore: 7 },
      { path: '/knowledge/blood-test-allergy', titleHe: 'בדיקת דם לאלרגיה', role: 'supporting', intent: 'diagnosis', geoScore: 6 },
      { path: '/knowledge/oral-food-challenge', titleHe: 'אתגר מזון אוראלי', role: 'supporting', intent: 'diagnosis', geoScore: 7 },
      { path: '/knowledge/positive-without-symptoms', titleHe: 'חיובי בלי תסמינים', role: 'supporting', intent: 'reassurance', geoScore: 7 },
      { path: '', titleHe: 'כל בדיקות האלרגיה — מדריך השוואתי מלא', role: 'missing', intent: 'definition', geoScore: 0, notes: 'Pillar חסר — השוואה בין סוגי בדיקות' },
      { path: '', titleHe: 'לקבוע תור לבדיקת אלרגיה — מה צפוי', role: 'missing', intent: 'booking', geoScore: 0 },
    ],
  },
  {
    id: 'emergencies',
    nameHe: 'מצבי חירום אלרגיים',
    nameEn: 'Allergic Emergencies',
    coverageDepth: 18,
    coverageVerdict: 'minimal',
    summary: 'פער קריטי — אין דפים ייעודיים לאנפילקסיס, אפיפן, או פרוטוקול חירום.',
    missingIntents: ['definition', 'emergency', 'treatment'],
    pages: [
      { path: '/knowledge/epipen-responsibility', titleHe: 'אחריות אפיפן', role: 'supporting', intent: 'treatment', geoScore: 5, notes: 'מכסה אחריות בלבד — לא תהליך חירום' },
      { path: '', titleHe: 'אנפילקסיס — מדריך הורים למצב חירום', role: 'missing', intent: 'emergency', geoScore: 0, notes: 'דחיפות עליונה — בטיחות חיים' },
      { path: '', titleHe: 'איך להשתמש באפיפן — מדריך צעד אחר צעד', role: 'missing', intent: 'treatment', geoScore: 0 },
      { path: '', titleHe: 'תוכנית פעולה למצב אלרגי חירום', role: 'missing', intent: 'definition', geoScore: 0 },
    ],
  },
  {
    id: 'school-garden',
    nameHe: 'גן ובית ספר',
    nameEn: 'School & Kindergarten',
    coverageDepth: 60,
    coverageVerdict: 'moderate',
    summary: 'כיסוי בינוני עם דפים על גן, טיולים, ואישורים. חסר מדריך מקיף.',
    missingIntents: ['definition'],
    pages: [
      { path: '/knowledge/garden-refusal', titleHe: 'סירוב גן לקבל ילד אלרגי', role: 'supporting', intent: 'reassurance', geoScore: 7 },
      { path: '/knowledge/school-trip', titleHe: 'טיול שנתי וילד אלרגי', role: 'supporting', intent: 'treatment', geoScore: 6 },
      { path: '/knowledge/allergy-certificate', titleHe: 'אישור רפואי לאלרגיה', role: 'supporting', intent: 'diagnosis', geoScore: 7 },
      { path: '/knowledge/epipen-responsibility', titleHe: 'אחריות אפיפן במסגרת', role: 'supporting', intent: 'treatment', geoScore: 5 },
      { path: '', titleHe: 'מדריך שלם: ילד אלרגי בגן ובבית ספר', role: 'missing', intent: 'definition', geoScore: 0, notes: 'Pillar מסכם חסר' },
    ],
  },
  {
    id: 'rights-management',
    nameHe: 'זכויות וניהול יומיומי',
    nameEn: 'Rights & Daily Management',
    coverageDepth: 58,
    coverageVerdict: 'moderate',
    summary: 'כיסוי סביר עם מדריכים ודפי זכויות. חסר מדריך ניהול יומי מקיף.',
    missingIntents: ['treatment'],
    pages: [
      { path: '/golden-guide-rights', titleHe: 'מדריך זכויות ילדים אלרגיים', role: 'pillar', intent: 'definition', geoScore: 8 },
      { path: '/knowledge/medical-aide', titleHe: 'סייעת רפואית', role: 'supporting', intent: 'treatment', geoScore: 7 },
      { path: '/knowledge/private-vs-public', titleHe: 'פרטי מול ציבורי', role: 'supporting', intent: 'diagnosis', geoScore: 6 },
      { path: '', titleHe: 'ניהול יומיומי של ילד אלרגי — שגרה, תזונה, תרופות', role: 'missing', intent: 'treatment', geoScore: 0, notes: 'מדריך שגרה יומית חסר' },
    ],
  },
  {
    id: 'parent-guidance',
    nameHe: 'הדרכת הורים ותמיכה בהחלטות',
    nameEn: 'Parent Guidance & Decision Support',
    coverageDepth: 45,
    coverageVerdict: 'thin',
    summary: 'תוכן קיים מפוזר בין דפים שונים. חסר מרכז הדרכה ייעודי.',
    missingIntents: ['definition', 'reassurance'],
    pages: [
      { path: '/knowledge/positive-without-symptoms', titleHe: 'חיובי בלי תסמינים — מה עכשיו?', role: 'supporting', intent: 'reassurance', geoScore: 7 },
      { path: '/knowledge/days-between-allergens', titleHe: 'כמה ימים בין אלרגנים', role: 'supporting', intent: 'treatment', geoScore: 6 },
      { path: '/knowledge/skin-prick-pain', titleHe: 'האם הבדיקה כואבת?', role: 'supporting', intent: 'reassurance', geoScore: 7 },
      { path: '', titleHe: 'מרכז הדרכת הורים — שאלות נפוצות ותמיכה', role: 'missing', intent: 'definition', geoScore: 0, notes: 'Hub מרכזי חסר' },
      { path: '', titleHe: 'הילד שלי אובחן כאלרגי — מדריך ראשון', role: 'missing', intent: 'reassurance', geoScore: 0, notes: 'דף קריטי לרגע האבחון' },
    ],
  },
];

export const COVERAGE_VERDICT_MAP: Record<TopicCluster['coverageVerdict'], { label: string; color: string; bg: string }> = {
  comprehensive: { label: 'מקיף', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950' },
  moderate: { label: 'בינוני', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950' },
  thin: { label: 'דל', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-950' },
  minimal: { label: 'מינימלי', color: 'text-destructive', bg: 'bg-destructive/10' },
};

export const ROLE_META: Record<ClusterPage['role'], { label: string; color: string }> = {
  pillar: { label: 'Pillar', color: 'bg-primary text-primary-foreground' },
  supporting: { label: 'תומך', color: 'bg-secondary text-secondary-foreground' },
  missing: { label: 'חסר', color: 'bg-destructive text-destructive-foreground' },
  duplicate: { label: 'כפילות', color: 'bg-amber-500 text-white' },
  weak: { label: 'חלש', color: 'bg-orange-500 text-white' },
};
