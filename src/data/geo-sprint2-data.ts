/**
 * Sprint 2 — GEO Page Template System
 * Reusable, AI-readable medical content templates for ihaveallergy.com
 */

export type TemplateType =
  | 'medical-condition'
  | 'symptom'
  | 'service'
  | 'faq'
  | 'expert-bio'
  | 'comparison'
  | 'parent-guidance';

export interface TemplateSection {
  id: string;
  key: string;
  labelHe: string;
  labelEn: string;
  description: string;
  required: boolean;
  placeholder: string;
  format: 'paragraph' | 'bullets' | 'heading' | 'faq' | 'meta' | 'links' | 'schema';
  aiTip: string;
  currentContent?: string;
}

export interface GeoTemplate {
  id: TemplateType;
  nameHe: string;
  nameEn: string;
  description: string;
  icon: string;
  schemaTypes: string[];
  sections: TemplateSection[];
  examplePages: { path: string; titleHe: string }[];
}

// ── Shared base sections (A–L from spec) ──────────────────────────────

function sharedSections(overrides?: Partial<Record<string, string>>): TemplateSection[] {
  return [
    {
      id: 'title', key: 'title', labelHe: 'כותרת ממוקדת כוונה', labelEn: 'Intent-Focused Title',
      description: 'כותרת H1 שעונה על כוונת חיפוש אחת ספציפית. עד 60 תווים.',
      required: true, placeholder: overrides?.title || 'אלרגיה לחלב בילדים — מדריך הורים מלא',
      format: 'heading',
      aiTip: 'AI systems extract H1 as the topic anchor. Make it a clear, searchable statement.',
    },
    {
      id: 'direct-answer', key: 'directAnswer', labelHe: 'תשובה ישירה (פסקה אחת)', labelEn: 'Direct Answer Block',
      description: 'פסקה אחת (2-3 משפטים) שעונה ישירות על השאלה. זה מה שמנועי AI יצטטו.',
      required: true, placeholder: overrides?.directAnswer || 'אלרגיה לחלב פרה היא תגובה חיסונית למרכיבי חלב, הנפוצה בעיקר בתינוקות וילדים צעירים. הסימנים כוללים פריחה, הקאות או שלשולים לאחר צריכת מוצרי חלב. אבחון מדויק מתבצע על ידי אלרגולוג באמצעות בדיקות עור ודם.',
      format: 'paragraph',
      aiTip: 'This is the #1 citation target. Write as if an AI will quote this verbatim. Keep under 50 words.',
    },
    {
      id: 'who-relevant', key: 'whoRelevant', labelHe: 'למי זה רלוונטי?', labelEn: 'Who Is This Relevant For?',
      description: 'לאיזה קהל הדף מיועד? הורים, מטפלים, צוות חינוכי?',
      required: true, placeholder: overrides?.whoRelevant || 'להורים לתינוקות וילדים עם חשד לאלרגיה למזון, ולצוות חינוכי בגנים ובתי ספר.',
      format: 'paragraph',
      aiTip: 'Helps AI match this page to user intent. Be specific about the audience.',
    },
    {
      id: 'when-to-worry', key: 'whenToWorry', labelHe: 'מתי לדאוג / מתי לפנות לרופא', labelEn: 'When to Seek Care',
      description: 'Red flags ותסמינים שדורשים פנייה רפואית. ברשימת נקודות.',
      required: true, placeholder: overrides?.whenToWorry || '• קוצר נשימה או צפצופים\n• נפיחות בשפתיים או בלשון\n• הקאות חוזרות\n• ירידה בלחץ דם או חיוורון',
      format: 'bullets',
      aiTip: 'Critical for medical trust. AI systems prioritize pages with clear red-flag guidance.',
    },
    {
      id: 'main-content', key: 'mainContent', labelHe: 'הסבר מרכזי (כותרות משנה)', labelEn: 'Main Explanation',
      description: 'גוף התוכן העיקרי, מחולק לכותרות H2/H3 ברורות.',
      required: true, placeholder: overrides?.mainContent || '## מהי אלרגיה לחלב?\n\nאלרגיה לחלב פרה היא תגובה של מערכת החיסון...\n\n## סוגי תגובות\n\nישנם שני מנגנונים...',
      format: 'paragraph',
      aiTip: 'Structure with clear H2 headings. Each section should be independently extractable.',
    },
    {
      id: 'summary-bullets', key: 'summaryBullets', labelHe: 'סיכום בנקודות', labelEn: 'Summary Bullets',
      description: '5-7 נקודות סיכום מרכזיות. קצר וברור.',
      required: true, placeholder: '• אלרגיה לחלב שכיחה בתינוקות — רוב הילדים מתגברים עליה\n• אבחון באמצעות בדיקות עור/דם ותגר מזון\n• יש להימנע ממוצרי חלב עד אישור רפואי\n• לשאת אפיפן אם יש סיכון לאנפילקסיס\n• מעקב שנתי אצל אלרגולוג',
      format: 'bullets',
      aiTip: 'AI systems love concise bullet summaries. Each bullet should be a standalone fact.',
    },
    {
      id: 'faq-block', key: 'faqBlock', labelHe: 'שאלות נפוצות', labelEn: 'FAQ Block',
      description: '3-5 שאלות נפוצות עם תשובה ישירה של 1-2 משפטים + הרחבה קצרה.',
      required: true, placeholder: 'ש: האם אלרגיה לחלב זה כמו אי-סבילות ללקטוז?\nת: לא. אלרגיה לחלב היא תגובה חיסונית לחלבוני החלב, בעוד אי-סבילות ללקטוז היא בעיית עיכול...',
      format: 'faq',
      aiTip: 'Use FAQPage schema. Each answer should start with a direct 1-sentence answer.',
    },
    {
      id: 'medical-review', key: 'medicalReview', labelHe: 'נבדק רפואית', labelEn: 'Medical Review',
      description: 'ייחוס מחבר: שם הרופא/ה, התמחות, ותאריך ביקורת.',
      required: true, placeholder: 'נבדק רפואית על ידי ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה קלינית.',
      format: 'meta',
      aiTip: 'E-E-A-T critical. Always include physician name, specialty, and review date.',
    },
    {
      id: 'last-updated', key: 'lastUpdated', labelHe: 'עודכן לאחרונה', labelEn: 'Last Updated',
      description: 'תאריך עדכון אחרון של התוכן.',
      required: true, placeholder: 'עודכן לאחרונה: אפריל 2026',
      format: 'meta',
      aiTip: 'Freshness signal. AI systems prefer recently updated medical content.',
    },
    {
      id: 'trust-contact', key: 'trustContact', labelHe: 'אמון ויצירת קשר', labelEn: 'Trust & Contact',
      description: 'מידע על המרפאה, disclaimer רפואי, ו-CTA ליצירת קשר.',
      required: true, placeholder: 'מרפאת ד״ר אנה ברמלי, הוד השרון | טלפון: ... | WhatsApp: ...\nהמידע בדף זה הוא לצורכי הסברה בלבד ואינו מהווה ייעוץ רפואי.',
      format: 'paragraph',
      aiTip: 'Disclaimer + contact info builds trust. Include clinic name, location, phone.',
    },
    {
      id: 'internal-links', key: 'internalLinks', labelHe: 'קישורים פנימיים מומלצים', labelEn: 'Internal Linking',
      description: '3-5 קישורים פנימיים למאמרים קשורים ולדף העמוד.',
      required: false, placeholder: '• מדריך מלא: אלרגיה בילדים (/אלרגיה-בילדים-מדריך-מלא)\n• פריחה אחרי במבה (/knowledge/פריחה-אחרי-במבה)\n• בדיקות אלרגיה (/guides/בדיקות-אלרגיה)',
      format: 'links',
      aiTip: 'Internal links strengthen topical authority. Link to pillar page and 2-3 satellite articles.',
    },
    {
      id: 'schema-suggestions', key: 'schemaSuggestions', labelHe: 'הזדמנויות Schema', labelEn: 'Schema Opportunities',
      description: 'סוגי structured data מומלצים לדף זה.',
      required: false, placeholder: 'MedicalWebPage, FAQPage, BreadcrumbList, Physician (author)',
      format: 'schema',
      aiTip: 'Schema markup helps AI systems classify and trust this content.',
    },
  ];
}

// ── Template Definitions ──────────────────────────────────────────────

export const GEO_TEMPLATES: GeoTemplate[] = [
  {
    id: 'medical-condition',
    nameHe: 'מאמר מצב רפואי',
    nameEn: 'Medical Condition Article',
    description: 'מאמר מקיף על מצב אלרגי ספציפי. מותאם לציטוט ישיר על ידי מנועי AI.',
    icon: '🩺',
    schemaTypes: ['MedicalWebPage', 'MedicalCondition', 'FAQPage', 'BreadcrumbList'],
    sections: [
      ...sharedSections({
        title: 'אלרגיה לחלב בילדים — מדריך הורים',
        directAnswer: 'אלרגיה לחלב פרה היא תגובה חיסונית שכיחה בתינוקות, המתבטאת בפריחה, הקאות או בעיות עיכול.',
      }),
      // Medical-specific blocks
      {
        id: 'what-is-it', key: 'whatIsIt', labelHe: 'מהו המצב', labelEn: 'What Is It',
        description: 'הגדרה רפואית ברורה של המצב. 2-3 משפטים.',
        required: true, placeholder: 'אלרגיה לחלב פרה היא תגובה של מערכת החיסון לחלבונים שבחלב פרה...',
        format: 'paragraph', aiTip: 'Definition block — AI will extract this as a definition.',
      },
      {
        id: 'common-symptoms', key: 'commonSymptoms', labelHe: 'תסמינים נפוצים', labelEn: 'Common Symptoms',
        description: 'רשימת תסמינים מרכזיים.',
        required: true, placeholder: '• פריחה או אורטיקריה\n• הקאות או בחילות\n• שלשולים\n• כאבי בטן\n• גודש באף',
        format: 'bullets', aiTip: 'Symptom lists are highly extractable by AI for comparison queries.',
      },
      {
        id: 'triggers', key: 'triggers', labelHe: 'גורמים אפשריים', labelEn: 'Possible Triggers',
        description: 'מה מפעיל את התגובה.',
        required: true, placeholder: '• חלב פרה ומוצריו\n• חלב עיזים (תגובה צולבת)\n• מוצרים מעובדים המכילים קזאין או מי גבינה',
        format: 'bullets', aiTip: 'Trigger lists help AI answer "what causes..." queries.',
      },
      {
        id: 'when-appears', key: 'whenAppears', labelHe: 'מתי מופיע', labelEn: 'When It Appears',
        description: 'גיל הופעה טיפוסי ותנאים.',
        required: true, placeholder: 'מופיעה בדרך כלל בשנה הראשונה לחיים, עם מעבר לתחליפי חלב או מזון מוצק.',
        format: 'paragraph', aiTip: 'Age/timing info is valuable for parent-intent queries.',
      },
      {
        id: 'common-confusion', key: 'commonConfusion', labelHe: 'מה הורים בדרך כלל מבלבלים', labelEn: 'Common Confusion',
        description: 'מצבים דומים שנוטים להתבלבל עם המצב הזה.',
        required: true, placeholder: '• אי-סבילות ללקטוז (לא חיסונית)\n• רפלוקס תינוקות\n• פריחת חום',
        format: 'bullets', aiTip: 'Comparison content is gold for AI disambiguation queries.',
      },
      {
        id: 'what-to-do', key: 'whatToDo', labelHe: 'מה לעשות עכשיו', labelEn: 'What to Do Now',
        description: 'צעדים מעשיים ומיידיים.',
        required: true, placeholder: '1. הפסיקו לתת מוצרי חלב\n2. תעדו את התסמינים\n3. קבעו תור לאלרגולוג',
        format: 'bullets', aiTip: 'Actionable steps. AI loves "what to do" content for guidance queries.',
      },
      {
        id: 'urgent-care', key: 'urgentCare', labelHe: 'מתי צריך טיפול דחוף', labelEn: 'When Urgent Care Is Needed',
        description: 'סימני מצוקה שדורשים פנייה מיידית.',
        required: true, placeholder: '• קוצר נשימה\n• נפיחות בפנים/גרון\n• חיוורון וחולשה\n→ חייגו 101 או השתמשו באפיפן',
        format: 'bullets', aiTip: 'Safety-critical section. Must be clear and unambiguous.',
      },
      {
        id: 'diagnosis', key: 'diagnosis', labelHe: 'מה כולל האבחון', labelEn: 'What Diagnosis May Include',
        description: 'סוגי בדיקות ותהליך אבחוני.',
        required: true, placeholder: '• בדיקת עור (Skin Prick Test)\n• בדיקת דם ל-IgE ספציפי\n• תגר מזון מבוקר בפיקוח רפואי',
        format: 'bullets', aiTip: 'Diagnosis content helps AI answer "how is X diagnosed" queries.',
      },
      {
        id: 'related-questions', key: 'relatedQuestions', labelHe: 'שאלות קשורות', labelEn: 'Related Questions',
        description: 'שאלות People Also Ask שקשורות לנושא.',
        required: false, placeholder: '• האם ילד עם אלרגיה לחלב יכול לאכול גבינה?\n• מתי ילדים מתגברים על אלרגיה לחלב?\n• מה ההבדל בין אלרגיה לחלב לאי-סבילות?',
        format: 'faq', aiTip: 'Related questions strengthen topical coverage and enable PAA snippets.',
      },
    ],
    examplePages: [
      { path: '/knowledge/אלרגיה-לחלב-מדריך-הורים', titleHe: 'אלרגיה לחלב' },
      { path: '/knowledge/אטופיק-דרמטיטיס-אכזמה-ילדים', titleHe: 'אטופיק דרמטיטיס' },
    ],
  },

  {
    id: 'symptom',
    nameHe: 'מאמר תסמין',
    nameEn: 'Symptom Article',
    description: 'מאמר ממוקד בתסמין ספציפי. עונה על "ילד שלי הראה X — מה זה?"',
    icon: '🔬',
    schemaTypes: ['MedicalWebPage', 'FAQPage', 'BreadcrumbList'],
    sections: [
      ...sharedSections({
        title: 'פריחה אחרי במבה — תגובה אלרגית?',
        directAnswer: 'פריחה שמופיעה אחרי אכילת במבה עשויה להצביע על אלרגיה לבוטנים, אך יכולה גם להיות תגובת מגע לא אלרגית.',
        whoRelevant: 'להורים שהבחינו בפריחה, אדמומיות, או תגובת עור אצל תינוק/ילד אחרי אכילת במבה או חטיף בוטנים.',
      }),
      {
        id: 'what-parents-see', key: 'whatParentsSee', labelHe: 'מה ההורה רואה', labelEn: 'What Parents See',
        description: 'תיאור ויזואלי של התסמין מנקודת מבט ההורה.',
        required: true, placeholder: 'פריחה אדומה סביב הפה, לעיתים עם גרד, שמופיעה תוך דקות עד שעה מאכילת במבה.',
        format: 'paragraph', aiTip: 'Parent-perspective descriptions match real search queries.',
      },
      {
        id: 'is-it-dangerous', key: 'isItDangerous', labelHe: 'האם זה מסוכן?', labelEn: 'Is It Dangerous?',
        description: 'הערכת חומרה כנה וברורה.',
        required: true, placeholder: 'ברוב המקרים פריחה קלה סביב הפה אינה מסוכנת ונובעת ממגע. אם מלווה בנפיחות, קוצר נשימה או הקאות — זו תגובה אלרגית שדורשת טיפול מיידי.',
        format: 'paragraph', aiTip: 'Severity assessment is highly cited by AI for safety queries.',
      },
    ],
    examplePages: [
      { path: '/knowledge/פריחה-אחרי-במבה', titleHe: 'פריחה אחרי במבה' },
      { path: '/knowledge/אודם-סביב-הפה-אחרי-אלרגן', titleHe: 'אודם סביב הפה' },
      { path: '/knowledge/הקאה-אחרי-טחינה', titleHe: 'הקאה אחרי טחינה' },
    ],
  },

  {
    id: 'service',
    nameHe: 'דף שירות',
    nameEn: 'Service Page',
    description: 'דף שירות רפואי. מותאם לשאלת "מה קורה כשאני מגיע/ה לבדיקה?"',
    icon: '🏥',
    schemaTypes: ['MedicalProcedure', 'FAQPage', 'Physician', 'BreadcrumbList'],
    sections: [
      ...sharedSections({
        title: 'בדיקת אלרגיה לילדים — תבחיני עור',
        directAnswer: 'בדיקת אלרגיה בתבחיני עור (Skin Prick Test) היא בדיקה מהירה, בטוחה ולא כואבת שמאפשרת לזהות אלרגנים ספציפיים תוך 20 דקות.',
      }),
      {
        id: 'what-service', key: 'whatService', labelHe: 'מהו השירות', labelEn: 'What the Service Is',
        description: 'הגדרה ברורה של מה כוללת הבדיקה/הטיפול.',
        required: true, placeholder: 'תבחיני עור הם בדיקה אלרגולוגית שבה מניחים טיפות מתמציות אלרגניות...',
        format: 'paragraph', aiTip: 'Clear definition for "what is X test" queries.',
      },
      {
        id: 'who-for', key: 'whoFor', labelHe: 'למי מיועד', labelEn: 'Who It Is For',
        description: 'לאיזה מטופלים/גילאים מתאים השירות.',
        required: true, placeholder: 'לילדים מגיל 4 חודשים ומעלה עם חשד לאלרגיה למזון, לאבקה, לאבק בית או לבעלי חיים.',
        format: 'paragraph', aiTip: 'Age/eligibility info is key for service queries.',
      },
      {
        id: 'during-visit', key: 'duringVisit', labelHe: 'מה קורה בביקור', labelEn: 'What Happens During Visit',
        description: 'תיאור שלב-אחר-שלב של חוויית המטופל.',
        required: true, placeholder: '1. שיחה עם הרופאה על ההיסטוריה\n2. בחירת אלרגנים לבדיקה\n3. הנחת טיפות על העור\n4. המתנה 15-20 דקות\n5. קריאת תוצאות והסבר',
        format: 'bullets', aiTip: 'Step-by-step format is ideal for "what happens during" queries.',
      },
      {
        id: 'conditions-evaluated', key: 'conditionsEvaluated', labelHe: 'אילו מצבים מאבחנים', labelEn: 'Conditions Evaluated',
        description: 'רשימת מצבים/אלרגיות שהשירות מסייע באבחונם.',
        required: true, placeholder: '• אלרגיה למזון (חלב, ביצה, בוטנים, שומשום)\n• נזלת אלרגית\n• אסתמה אלרגית\n• אלרגיה לתרופות',
        format: 'bullets', aiTip: 'Condition lists enable AI to match this page to diagnostic queries.',
      },
      {
        id: 'when-to-book', key: 'whenToBook', labelHe: 'מתי לקבוע תור', labelEn: 'When to Book',
        description: 'סימנים שמצביעים על הצורך בבדיקה.',
        required: true, placeholder: 'כשהילד/ה מראה תגובה חוזרת למזון מסוים, פריחה עונתית חוזרת, או כשרופא הילדים מפנה לאלרגולוג.',
        format: 'paragraph', aiTip: 'Booking triggers match "should I get tested" queries.',
      },
      {
        id: 'why-this-clinic', key: 'whyThisClinic', labelHe: 'למה מרפאה זו', labelEn: 'Why This Clinic/Expert',
        description: 'מה מייחד את הגישה הרפואית של המרפאה.',
        required: true, placeholder: 'ד״ר אנה ברמלי היא מומחית אלרגיה ואימונולוגיה קלינית עם ניסיון של למעלה מ-15 שנה באבחון אלרגיות בילדים.',
        format: 'paragraph', aiTip: 'Expertise differentiation — critical for E-E-A-T.',
      },
      {
        id: 'parent-concerns', key: 'parentConcerns', labelHe: 'חששות נפוצים של הורים', labelEn: 'Common Parent Concerns',
        description: 'שאלות שהורים שואלים לפני הבדיקה.',
        required: true, placeholder: '• האם הבדיקה כואבת?\n• כמה זמן לוקח?\n• האם צריך הכנה מיוחדת?\n• מגיל כמה אפשר לבדוק?',
        format: 'faq', aiTip: 'Parent concerns are high-intent queries that AI surfaces frequently.',
      },
      {
        id: 'cta', key: 'cta', labelHe: 'קריאה לפעולה', labelEn: 'CTA Area',
        description: 'CTA מרוסן ומתאים להקשר רפואי.',
        required: true, placeholder: 'לקביעת תור לבדיקת אלרגיה — צרו קשר בוואטסאפ או בטלפון.',
        format: 'paragraph', aiTip: 'Soft, medical-appropriate CTA. Never aggressive marketing language.',
      },
    ],
    examplePages: [
      { path: '/services', titleHe: 'שירותים' },
    ],
  },

  {
    id: 'faq',
    nameHe: 'דף שאלות נפוצות',
    nameEn: 'FAQ Page',
    description: 'דף FAQ מובנה. כל תשובה פותחת במשפט ישיר לפני הרחבה.',
    icon: '❓',
    schemaTypes: ['FAQPage', 'MedicalWebPage', 'BreadcrumbList'],
    sections: [
      ...sharedSections({
        title: 'שאלות נפוצות על אלרגיה בילדים — ד״ר אנה ברמלי',
        directAnswer: 'תשובות מומחה לשאלות נפוצות של הורים על אלרגיה, בדיקות, וטיפול בילדים אלרגיים.',
      }),
      {
        id: 'faq-format-guide', key: 'faqFormatGuide', labelHe: 'מדריך פורמט FAQ', labelEn: 'FAQ Format Guide',
        description: 'כל תשובה חייבת לעקוב אחרי הפורמט: משפט ישיר → הרחבה → מקור/קישור.',
        required: true, placeholder: 'פורמט:\nש: [שאלה ברורה]?\nת: [תשובה ישירה של משפט אחד]. [הרחבה של 1-2 משפטים]. [קישור: קראו עוד ב...]',
        format: 'meta', aiTip: 'Answer-first format is mandatory. AI extracts the first sentence.',
      },
    ],
    examplePages: [
      { path: '/faq', titleHe: 'שאלות נפוצות' },
    ],
  },

  {
    id: 'expert-bio',
    nameHe: 'ביוגרפיית מומחה',
    nameEn: 'Expert Bio Page',
    description: 'דף פרופיל רופא/ה מותאם ל-Knowledge Panel ו-E-E-A-T.',
    icon: '👩‍⚕️',
    schemaTypes: ['Physician', 'MedicalBusiness', 'Person', 'BreadcrumbList'],
    sections: [
      ...sharedSections({
        title: 'ד״ר אנה ברמלי — מומחית אלרגיה ואימונולוגיה קלינית',
        directAnswer: 'ד״ר אנה ברמלי היא מומחית בתחום האלרגיה והאימונולוגיה הקלינית, מנהלת מרפאה פרטית בהוד השרון המתמחה באבחון וטיפול באלרגיות בילדים.',
      }),
      {
        id: 'at-a-glance', key: 'atAGlance', labelHe: 'כרטיס מידע מהיר', labelEn: 'At a Glance Card',
        description: 'עובדות מפתח בפורמט מובנה: שם, התמחות, מיקום, שפות, השכלה.',
        required: true, placeholder: '• שם: ד״ר אנה ברמלי\n• התמחות: אלרגיה ואימונולוגיה קלינית\n• מיקום: הוד השרון\n• שפות: עברית, רוסית, אנגלית\n• ניסיון: 15+ שנים',
        format: 'bullets', aiTip: 'Structured facts enable Knowledge Panel eligibility.',
      },
      {
        id: 'credentials', key: 'credentials', labelHe: 'הסמכות וניסיון', labelEn: 'Credentials',
        description: 'Board certification, fellowship, השתייכויות מקצועיות.',
        required: true, placeholder: '• תואר MD מאוניברסיטת...\n• התמחות באלרגיה ואימונולוגיה ב...\n• חברה באגודה הישראלית לאלרגיה',
        format: 'bullets', aiTip: 'Credentials are the #1 E-E-A-T signal for physician entities.',
      },
      {
        id: 'publications', key: 'publications', labelHe: 'פרסומים והופעות', labelEn: 'Publications & Media',
        description: 'רשימת פרסומים, כנסים, הופעות בתקשורת.',
        required: false, placeholder: '• פרסום ב-Journal of Allergy...\n• הרצאה בכנס האלרגיה הארצי 2025',
        format: 'bullets', aiTip: 'Publications strengthen entity authority dramatically.',
      },
      {
        id: 'same-as', key: 'sameAs', labelHe: 'קישורים חיצוניים (sameAs)', labelEn: 'External Links',
        description: 'קישורים לפנקס רופאים, LinkedIn, פורטלי בריאות.',
        required: true, placeholder: '• פנקס רופאים: ...\n• LinkedIn: ...\n• רופאים בישראל: ...',
        format: 'links', aiTip: 'sameAs links are critical for Knowledge Panel and entity disambiguation.',
      },
    ],
    examplePages: [
      { path: '/dr-anna-brameli', titleHe: 'ד״ר אנה ברמלי' },
      { path: '/about', titleHe: 'אודות' },
      { path: '/whois', titleHe: 'מי זה' },
    ],
  },

  {
    id: 'comparison',
    nameHe: 'דף השוואה',
    nameEn: 'Comparison Page',
    description: 'השוואה בין שני מצבים, בדיקות, או גישות. אידיאלי לציטוט AI.',
    icon: '⚖️',
    schemaTypes: ['MedicalWebPage', 'FAQPage', 'Table', 'BreadcrumbList'],
    sections: [
      ...sharedSections({
        title: 'אלרגיה לחלב מול אי-סבילות ללקטוז — מה ההבדל?',
        directAnswer: 'אלרגיה לחלב היא תגובה חיסונית לחלבוני חלב שעלולה להיות מסוכנת. אי-סבילות ללקטוז היא בעיית עיכול שאינה מערבת את מערכת החיסון.',
      }),
      {
        id: 'comparison-table', key: 'comparisonTable', labelHe: 'טבלת השוואה', labelEn: 'Comparison Table',
        description: 'טבלה מובנית עם קריטריונים ברורים.',
        required: true, placeholder: '| קריטריון | אלרגיה לחלב | אי-סבילות ללקטוז |\n|---|---|---|\n| מנגנון | חיסוני | עיכולי |\n| סכנה | אנפילקסיס | לא מסוכן |\n| גיל | תינוקות | כל גיל |',
        format: 'paragraph', aiTip: 'Comparison tables are the #1 most-cited format by AI for "vs" queries.',
      },
      {
        id: 'key-differences', key: 'keyDifferences', labelHe: 'הבדלים מרכזיים', labelEn: 'Key Differences',
        description: '3-5 הבדלים עיקריים בפורמט bullet.',
        required: true, placeholder: '• אלרגיה = תגובה חיסונית; אי-סבילות = בעיית עיכול\n• אלרגיה יכולה להיות מסכנת חיים; אי-סבילות לא\n• אלרגיה נפוצה יותר בתינוקות; אי-סבילות — במבוגרים',
        format: 'bullets', aiTip: 'Bullet differences are directly extractable for AI comparison answers.',
      },
    ],
    examplePages: [
      { path: '/knowledge/בדיקות-אלרגיה-פרטי-או-קופה', titleHe: 'פרטי או קופת חולים' },
    ],
  },

  {
    id: 'parent-guidance',
    nameHe: 'מדריך הורים',
    nameEn: 'Parent Guidance Page',
    description: 'מדריך מעשי להורים. טון רגוע, מעשי, ומסמיך.',
    icon: '👨‍👩‍👧',
    schemaTypes: ['MedicalWebPage', 'HowTo', 'FAQPage', 'BreadcrumbList'],
    sections: [
      ...sharedSections({
        title: 'טעימות ראשונות — מדריך הורים להחשפת אלרגנים',
        directAnswer: 'החשפה מוקדמת לאלרגנים (במבה, ביצה, שומשום) מגיל 4-6 חודשים מפחיתה משמעותית את הסיכון לפתח אלרגיות מזון.',
      }),
      {
        id: 'step-by-step', key: 'stepByStep', labelHe: 'הנחיות שלב אחר שלב', labelEn: 'Step-by-Step Guide',
        description: 'הוראות מעשיות מדורגות.',
        required: true, placeholder: '1. התחילו מאלרגן אחד בכל פעם\n2. תנו כמות קטנה (חצי כפית)\n3. המתינו 2-3 שעות\n4. רשמו תגובות\n5. חזרו על האלרגן 3 פעמים לפחות',
        format: 'bullets', aiTip: 'Step-by-step content enables HowTo schema and AI process extraction.',
      },
      {
        id: 'age-timeline', key: 'ageTimeline', labelHe: 'לוח זמנים לפי גיל', labelEn: 'Age-Based Timeline',
        description: 'המלצות לפי גיל.',
        required: true, placeholder: '4 חודשים: במבה מומסת\n6 חודשים: ביצה מבושלת\n6-7 חודשים: טחינה\n8 חודשים: חלב בבישול',
        format: 'bullets', aiTip: 'Age-based timelines are highly cited for "when should I start" queries.',
      },
      {
        id: 'mistakes-to-avoid', key: 'mistakesToAvoid', labelHe: 'טעויות נפוצות', labelEn: 'Common Mistakes',
        description: 'מה לא לעשות.',
        required: true, placeholder: '• לא לדחות החשפה — דחייה מגדילה סיכון\n• לא לתת אלרגן חדש כשהילד חולה\n• לא לוותר אחרי פעם אחת',
        format: 'bullets', aiTip: 'Mistake-avoidance content is valuable for parent guidance queries.',
      },
    ],
    examplePages: [
      { path: '/guides/טעימות-ראשונות-אלרגנים', titleHe: 'טעימות ראשונות' },
      { path: '/אלרגיה-בילדים-מדריך-מלא', titleHe: 'מדריך מלא' },
    ],
  },
];
