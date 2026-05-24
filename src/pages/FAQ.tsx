import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { motion } from "framer-motion";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { buildFaqSchema, buildBreadcrumbSchema } from "@/utils/medicalSchema";

const faqCategories = [
  {
    title: "אלרגיה למזון",
    items: [
      {
        question: "האם אלרגיה למזון יכולה להופיע בפתאומיות?",
        answer: "כן. גם מזון שנאכל בעבר ללא תגובה יכול לעורר אלרגיה IgE-מתווכת בהמשך החיים. תגובה אלרגית אמיתית מופיעה בדרך כלל בתוך 5 דקות עד שעתיים מהחשיפה, וכוללת חרלות, נפיחות בשפתיים או בעיניים, הקאה מיידית, שיעול או צפצוף. כל תגובה כזו מחייבת בירור אצל אלרגולוג ילדים."
      },
      {
        question: "איך אדע אם מדובר בהרעלת מזון ולא באלרגיה?",
        answer: "אלרגיה מופיעה תוך דקות עד שעתיים מהחשיפה, ולרוב כוללת תסמיני עור (פריחה, חרלות, נפיחות) או נשימה (שיעול, צפצוף, קוצר נשימה). הרעלת מזון מתחילה לרוב 6-24 שעות לאחר האכילה, כוללת חום, כאבי בטן, הקאות ושלשולים מתמשכים, ואינה כוללת תסמיני עור או נשימה."
      },
      {
        question: "האם אלרגיה למזון יכולה לעבור עם הזמן?",
        answer: "כן, חלקית. כ-80% מהילדים האלרגיים לחלב פרה או לביצה מפתחים סבילות עד גיל 5-6, וכ-50% עד גיל 8-10. אלרגיה לבוטנים חולפת רק בכ-20% מהילדים, ואלרגיה לאגוזי עץ ולדגים נשארת לרוב לכל החיים. מעקב תקופתי במרפאת אלרגיה עם בדיקות IgE ולעיתים תגר מזון מבוקר מאפשר לזהות מתי בטוח להחזיר את המזון לתפריט."
      },
      {
        question: "מה לעשות במקרה של תגובה ראשונית?",
        answer: "להפסיק מיד את האכילה, לצלם את הפריחה, ולתעד מה נאכל וכמה זמן עבר עד התגובה. תגובה קלה ומקומית בלבד - לפנות לאלרגולוג ילדים תוך כמה ימים. תגובה מערכתית (נפיחות בשפתיים/לשון, שיעול, צפצוף, חיוורון, הקאות חוזרות) - להתקשר מיד ל-101 ולגשת לחדר מיון. אסור לנסות שוב לחשוף את הילד למזון לפני בירור רפואי מסודר."
      },
      {
        question: "האם צריך להחזיק מזרק אדרנלין (EpiPen) בבית?",
        answer: "כן, לכל ילד עם אלרגיה מאומתת לבוטנים, אגוזים, שומשום, דגים או חלב, ולכל ילד עם תגובה מערכתית קודמת או עם אסתמה לא מאוזנת ברקע. רושמים בדרך כלל 2 מזרקים (אחד בבית ואחד בגן/בית הספר), מחליפים אחת ל-12-18 חודשים, ומתרגלים את אופן השימוש עם כל המבוגרים בסביבת הילד. ההחלטה תמיד מתקבלת על ידי אלרגולוג."
      },
    ]
  },
  {
    title: "אלרגיה לחלב",
    items: [
      {
        question: "איך מבדילים בין אלרגיה לחלב לבין אי-סבילות ללקטוז?",
        answer: "אלרגיה לחלב פרה היא תגובה של מערכת החיסון לחלבון החלב (קזאין או β-לקטוגלובולין), ומופיעה בתוך דקות עד שעות עם פריחה, חרלות, נפיחות, הקאה, שיעול או צפצוף. אי-סבילות ללקטוז היא חסר באנזים לקטאז המפרק את סוכר החלב, גורמת לגזים, נפיחות בטן ושלשול 30 דקות עד שעתיים אחרי שתיית חלב, ואינה מערבת תגובה חיסונית או סיכון לאנפילקסיס. אלרגיה נפוצה בתינוקות ופעוטות; אי-סבילות נפוצה בגיל בית הספר ומעלה."
      },
      {
        question: "האם ניתן להחליף פורמולה לתינוק אלרגי?",
        answer: "כן. לתינוק עם אלרגיה מוכחת לחלבון חלב פרה משתמשים בפורמולה מפורקת עמוקות (eHF) כקו ראשון, ובפורמולה על בסיס חומצות אמינו (AAF) במקרים חמורים או בכישלון של eHF. פורמולות סויה מתאימות רק לחלק מהתינוקות מעל גיל 6 חודשים. הבחירה תמיד נעשית על ידי רופא ילדים או אלרגולוג, לא ברכישה עצמית."
      },
      {
        question: "האם ילד אלרגי לחלב יכול לצרוך מוצרי חלב אפויים?",
        answer: "כ-70% מהילדים האלרגיים לחלב פרה סובלים מוצרי חלב אפויים (עוגה, מאפינס) כי האפייה בטמפרטורה גבוהה (180°C מעל 30 דקות) משנה את מבנה החלבון. מחקרים מראים שצריכה קבועה של חלב אפוי מזרזת את חלוף האלרגיה. את ההכנסה הראשונה חייבים לעשות במרפאת אלרגיה כתגר מבוקר, אף פעם לא לבד בבית."
      },
    ]
  },
  {
    title: "אלרגיה לבוטנים",
    items: [
      {
        question: "מה ההבדל בין אלרגיה לבוטנים לבין אלרגיה לאגוזים?",
        answer: "בוטנים אינם אגוזים מבחינה בוטנית - הם קטניות. ולכן התגובה שונה. אך מי שאלרגי לבוטנים עלול להיות רגיש גם לאגוזים אחרים, ולהפך."
      },
      {
        question: "האם יש טיפול שמפחית את האלרגיה?",
        answer: "במקרים מסוימים ניתן לבצע טיפול חשיפה מבוקר (אימונותרפיה) במרפאה מיוחדת. הטיפול מפחית את הסיכון לתגובה חמורה אך דורש מעקב צמוד."
      },
      {
        question: "האם הילדים חייבים לשאת אדרנלין?",
        answer: "אם מדובר באלרגיה מוכחת עם סיכון לתגובה חמורה - כן. זה מציל חיים. הרופא יקבע את הצורך בהתאם לאבחון."
      },
    ]
  },
  {
    title: "אלרגיה לתרופות",
    items: [
      {
        question: "האם רגישות לפניצילין פירושה שאסור לקחת את כל משפחת האנטיביוטיקות?",
        answer: "לא. לרוב יש תרופות חלופיות בטוחות לחלוטין - והרופא יתאים אותן למטופל. בנוסף, רבים מהאנשים שחושבים שהם אלרגיים לפניצילין - אינם אלרגיים בפועל."
      },
      {
        question: "איך מאבחנים אלרגיה לתרופות?",
        answer: "באמצעות בדיקות עור, בדיקות דם, או תגר תרופתי במרפאה - תחת השגחה מלאה. התהליך בטוח ומבוצע בהדרגה."
      },
      {
        question: "האם ניתן לבטל 'אלרגיה' לתרופה שנרשמה לפני שנים?",
        answer: "בהחלט. פעמים רבות אלרגיה שאובחנה בילדות אינה קיימת בבגרות. בדיקה מסודרת יכולה להסיר את ה'תווית' ולאפשר שימוש בתרופה."
      },
    ]
  },
  {
    title: "אלרגיה לדבורים ועקיצות חרקים",
    items: [
      {
        question: "האם כל נפיחות אחרי עקיצה היא אלרגיה?",
        answer: "לא. נפיחות מקומית גדולה היא תגובה נפוצה ולא מעידה בהכרח על אלרגיה מסכנת חיים. אלרגיה אמיתית כוללת תסמינים מערכתיים."
      },
      {
        question: "מתי העקיצה מסוכנת?",
        answer: "כאשר מופיעים: קוצר נשימה, סחרחורת, נפיחות בפנים או ירידת לחץ דם. אלה סימנים לאנפילקסיס הדורש טיפול מיידי."
      },
      {
        question: "האם יש טיפול שמעלים את האלרגיה?",
        answer: "כן - טיפול חיסוני (אימונותרפיה) שמפחית את הסיכון לתגובה חמורה. הטיפול נמשך מספר שנים ויעיל מאוד."
      },
    ]
  },
  {
    title: "אלרגיות עונתיות (אבקנים)",
    items: [
      {
        question: "למה האלרגיה מופיעה רק בעונות מסוימות?",
        answer: "בגלל ריכוז גבוה של אבקנים של צמחים באוויר - לרוב באביב ובסתיו. כל צמח מפריח בזמן אחר, ולכן ישנם אנשים שמגיבים בעונות שונות."
      },
      {
        question: "האם מסכות עוזרות?",
        answer: "כן - מסכה איכותית מפחיתה משמעותית חשיפה לאבקנים ויכולה להקל על התסמינים, במיוחד בימים עם ריכוז אבקנים גבוה."
      },
      {
        question: "האם טיפול תרופתי ממושך מסוכן?",
        answer: "לא. מרבית תרופות האלרגיה (אנטי-היסטמינים, תרסיסים) בטוחות ונמצאות בשימוש שנים רבות ללא תופעות לוואי משמעותיות."
      },
    ]
  },
  {
    title: "אורטיקריה (חרלת)",
    items: [
      {
        question: "האם אורטיקריה היא אלרגיה?",
        answer: "לא תמיד. ברוב המקרים זו תגובה של העור שאינה קשורה לאלרגיה אמיתית לחומר ספציפי. לעיתים היא קשורה לזיהום, לחץ או גורמים לא ידועים."
      },
      {
        question: "מה מעורר חרלת?",
        answer: "לחץ נפשי, מזון מסוים, חום/קור, זיהומים ותרופות - תלוי בסוג. בחרלת כרונית, הגורם לעיתים לא נמצא."
      },
      {
        question: "האם זה עובר מעצמו?",
        answer: "ברוב המקרים כן. חרלת חריפה חולפת תוך ימים עד שבועות. מצבים כרוניים (מעל 6 שבועות) דורשים מעקב וטיפול מתאים."
      },
    ]
  },
  {
    title: "אסתמה אלרגית",
    items: [
      {
        question: "האם ילד עם אלרגיה נמצא בסיכון מוגבר לאסתמה?",
        answer: "כן. הקשר מכונה ב\"מצעד האטופי\" (Atopic March) - מהלך טיפוסי שמתחיל בילדות עם אגזמה אטופית (אקזמה), ממשיך באלרגיה למזון, נזלת אלרגית ולעיתים מסתיים באסתמה. ילדים עם אגזמה בינונית-חמורה לפני גיל שנה נמצאים בסיכון של עד 50% לפתח אסתמה עד גיל בית הספר. אבחון מוקדם וטיפול נכון באגזמה ובאלרגיות מפחיתים סיכון זה."
      },
      {
        question: "מה ההבדל בין אסתמה רגילה לאסתמה אלרגית?",
        answer: "כ-80% מהאסתמה בילדים היא אלרגית - מופעלת על ידי אלרגנים סביבתיים כמו קרדית אבק הבית, פרוות חתול וכלב, אבקנים ועובש. הטיפול משלב משאף סטרואידי קבוע, ברונכודילטור לפי צורך, הימנעות מטריגרים, ולעיתים אימונותרפיה (חיסוני אלרגיה) שמפחיתה את הצורך במשאפים. אסתמה לא-אלרגית נדירה בילדים וקשורה לזיהומים או לפעילות גופנית."
      },
      {
        question: "האם הטיפול מרפא אסתמה?",
        answer: "אסתמה אינה נרפאת, אך מאוזנת היטב בקרוב ל-90% מהילדים. כשהטיפול נכון - הילד פעיל באופן מלא, ישן ברצף, ומשתמש במשאף ההצלה פחות מפעמיים בשבוע. כ-50% מהילדים חווים שיפור משמעותי בגיל ההתבגרות. מעקב אצל אלרגולוג ילדים מאפשר התאמה אישית של הטיפול ומניעת התקפים."
      },
    ]
  },
  {
    title: "אגזמה (אטופיק דרמטיטיס) ואלרגיה",
    items: [
      {
        question: "האם אגזמה זה סימן לאלרגיה?",
        answer: "אגזמה (אטופיק דרמטיטיס) היא מחלת עור דלקתית עם רקע גנטי, שלעיתים קרובות מתלווה לאלרגיות אך אינה נגרמת ישירות מהן. ילדים עם אגזמה בינונית-חמורה לפני גיל שנה נמצאים בסיכון של עד פי 6 לפתח אלרגיה למזון, ובסיכון מוגבר גם לנזלת אלרגית ולאסתמה. בדיקת IgE ספציפי או תבחיני עור אצל אלרגולוג ילדים עוזרת לזהות אלרגנים רלוונטיים, אך לא כל ילד עם אגזמה צריך דיאטה."
      },
      {
        question: "האם להוציא מזון מהתפריט כשיש אגזמה?",
        answer: "לא לפני אבחון. הוצאת מזון על דעת עצמכם עלולה לגרום אובדן סבילות ולאלרגיה אמיתית בעת חזרה. ההמלצה הרפואית הברורה היום: לטפל היטב באגזמה (מקלחת קצרה, סבון עדין, קרם לחות, סטרואיד מקומי לפי הצורך), ולהתחיל בירור אלרגיה רק אם יש החמרה ברורה אחרי מזון מסוים או חוסר תגובה לטיפול מקסימלי."
      },
    ]
  },
  {
    title: "אנפילקסיס - סימני אזהרה וטיפול",
    items: [
      {
        question: "מהם סימני האזהרה לאנפילקסיס בילד?",
        answer: "אנפילקסיס מאובחן כאשר מופיעים תוך דקות עד שעתיים מחשיפה תסמינים בשתי מערכות או יותר: עור (חרלות מפושטות, נפיחות בשפתיים/לשון/עיניים), נשימה (שיעול פתאומי, צפצוף, קוצר נשימה, צרידות), מערכת עיכול (הקאות חוזרות, כאב בטן עז), או מחזור הדם (חיוורון, רפיון, חוסר תגובה, התעלפות). כל שילוב כזה הוא מצב חירום."
      },
      {
        question: "האם לתת אדרנלין גם אם לא בטוחים?",
        answer: "כן. עיכוב במתן אדרנלין הוא הסיבה העיקרית לתמותה באנפילקסיס. האדרנלין במזרק EpiPen בטוח לחלוטין גם אם בדיעבד הסתבר שזו לא הייתה תגובה אמיתית. הוראה ברורה: בכל ספק - לתת אדרנלין מיד לשריר הירך, לשכב על הגב עם הרגליים מורמות, ולהתקשר ל-101. אם התסמינים לא משתפרים תוך 5-15 דקות - לתת מזרק שני."
      },
    ]
  },
  {
    title: "בדיקות אלרגיה לילדים",
    items: [
      {
        question: "מה ההבדל בין תבחיני עור (Skin Prick) לבדיקת IgE בדם?",
        answer: "תבחיני עור (SPT) מתבצעים במרפאה: טיפה מהאלרגן מונחת על אמת היד, וסריטה קלה מאפשרת לעור להגיב. התוצאה מתקבלת תוך 15-20 דקות, ורגישות הבדיקה גבוהה. בדיקת IgE בדם (ImmunoCAP) מודדת נוגדנים ספציפיים לאלרגן ומתאימה לילדים עם אגזמה נרחבת, נטילת אנטי-היסטמינים שלא ניתן להפסיק, או חשש מתגובה מערכתית. התוצאה מגיעה תוך 3-7 ימים. שתי הבדיקות משלימות, ולא תמיד נחוצות יחד."
      },
      {
        question: "האם הבדיקה כואבת?",
        answer: "תבחיני עור אינם בדיקת מחט - הסריטה שטחית ומורגשת כצביטה קלה. רוב הילדים מתחילים לחייך תוך דקה. בדיקת IgE בדם היא כמו כל בדיקת דם, ונעשית לרוב מורידן ביד. במרפאה אנחנו מסבירים לילד מראש בשפה שמתאימה לו, ויושבים עם ההורה לידו לאורך כל הבדיקה."
      },
      {
        question: "מתי נכון לבצע בדיקות אלרגיה?",
        answer: "כשיש תגובה חוזרת ומזוהה לחשיפה לאלרגן: פריחה, נפיחות, שיעול או הקאה תוך שעתיים ממזון מסוים; נזלת וגירוד בעיניים בעונה חוזרת; קוצר נשימה אחרי מאמץ או במגע עם בעלי חיים; תגובה אחרי עקיצה או נטילת תרופה. אין טעם לבדוק \"כל מה שיש\" - הבדיקה מתפרשת רק לאור התסמינים."
      },
      {
        question: "מאיזה גיל אפשר לאבחן אלרגיה?",
        answer: "אין גיל מינימום. תבחיני עור ובדיקות IgE בדם תקפים כבר מגיל מספר חודשים, ולעיתים נעשים אצל תינוקות עם אגזמה חמורה לפני התחלת מזון מוצק. הפרשנות בגיל הצעיר דורשת ניסיון של אלרגולוג ילדים - לכן מומלץ לפנות למרפאה מוכוונת ילדים."
      },
      {
        question: "מתי כדאי לפנות לאלרגולוג ילדים פרטי?",
        answer: "כשרוצים תור תוך שבועות ולא חודשים, כשיש צורך בבירור מקיף בביקור אחד (אנמנזה + תבחיני עור + תכנית טיפול), כשיש אגזמה לא מאוזנת או חשד לאלרגיה למזון מרובה, או כשנדרש תגר מזון מבוקר לפני חזרה לתפריט. במרפאת ד״ר אנה ברמלי בהוד השרון הבירור הראשוני נעשה בביקור אחד הכולל בדיקות עור והמלצות כתובות."
      },
    ]
  },
  {
    title: "מימוש זכויות מול חברות הביטוח",
    items: [
      {
        question: "האם אני זכאי להחזר על הביקור?",
        answer: "מטופלים המבוטחים בביטוחים פרטיים עשויים להיות זכאים להחזר חלקי או מלא על הביקור אצל ד״ר אנה ברמלי, בהתאם לתנאי הפוליסה שלהם."
      },
      {
        question: "מתי כדאי לבדוק את הזכאות?",
        answer: "ניתן לבדוק את הזכאות מול חברת הביטוח לפני או לאחר קבלת השירות. מומלץ לבדוק מראש כדי לדעת למה לצפות."
      },
      {
        question: "מי אחראי על גובה ההחזר?",
        answer: "חשוב לדעת: ההחזרים נקבעים על ידי חברות הביטוח בלבד, וד״ר אנה ברמלי או המרפאה אינם אחראים לגובה ההחזר או לאישורו."
      },
      {
        question: "אילו מסמכים אני צריך לקבלת החזר?",
        answer: "בדרך כלל תזדקקו לקבלה מקורית ולסיכום הביקור. ניתן לבקש מסמכים אלו במרפאה לאחר הביקור."
      },
    ]
  },
];

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState<string>(faqCategories[0].title);
  const faqSchema = buildFaqSchema(
    faqCategories.flatMap((c) => c.items.map((i) => ({ question: i.question, answer: i.answer })))
  );

  return (
    <>
      <Helmet>
        <title>שאלות ותשובות | ד״ר אנה ברמלי</title>
        <meta 
          name="description" 
          content="תשובות מקצועיות לשאלות נפוצות על אלרגיות: אלרגיה למזון, לחלב, לבוטנים, לתרופות, לדבורים, אסתמה, אנפילקסיס ובדיקות אלרגיה." 
        />
        <link rel="canonical" href="https://ihaveallergy.com/faq" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ihaveallergy.com/faq" />
        <meta property="og:title" content="שאלות ותשובות על אלרגיות - ד״ר אנה ברמלי" />
        <meta property="og:description" content="תשובות מקצועיות לשאלות הנפוצות ביותר של הורים בנושא אלרגיות בילדים ובמבוגרים." />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema([
          { name: "דף הבית", item: "https://ihaveallergy.com/" },
          { name: "שאלות ותשובות", item: "https://ihaveallergy.com/faq" },
        ]))}</script>
      </Helmet>
      <SchemaMarkup type="medicalWebPage" />

      {/* Hero */}
      <section className="gradient-hero py-20 md:py-28">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="font-bold text-foreground mb-6">
              שאלות ותשובות
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              תשובות מקצועיות לשאלות הנפוצות ביותר של הורים בנושא אלרגיות. המידע מסייע להבין את המצבים השונים ולדעת מתי לפנות לייעוץ מקצועי.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="section-spacing-lg">
        <div className="container-medical">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Category Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24 bg-card rounded-2xl border border-border/60 p-5">
                <h3 className="font-semibold text-foreground mb-4">קטגוריות</h3>
                <nav className="space-y-1">
                  {faqCategories.map((category) => (
                    <button
                      key={category.title}
                      onClick={() => {
                        setActiveCategory(category.title);
                        // Scroll to the category section with offset for header
                        const element = document.getElementById(category.title.replace(/\s+/g, "-"));
                        if (element) {
                          const headerOffset = 100; // Account for sticky header
                          const elementPosition = element.getBoundingClientRect().top;
                          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                        }
                      }}
                      className={`w-full text-right px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        activeCategory === category.title
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {category.title}
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* FAQ Accordions */}
            <div className="lg:col-span-3 space-y-8">
              {faqCategories.map((category) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: activeCategory === category.title ? 1 : 0.5,
                    y: 0
                  }}
                  className={activeCategory === category.title ? "" : "hidden lg:block"}
                  id={category.title.replace(/\s+/g, "-")}
                >
                  <FAQAccordion items={category.items} title={category.title} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reassurance Section */}
      <section className="section-spacing-lg bg-surface-warm">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-bold text-foreground mb-6">
              אתם לא לבד
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              כשילד מראה סימני אלרגיה - זה טבעי להרגיש לחץ. התגובות יכולות להיות מבלבלות ומהירות, והחשש מפני אירוע נוסף מלווה כמעט כל הורה. המטרה שלנו היא לעזור לכם להבין מה באמת קורה, ולהחזיר אליכם את תחושת השליטה.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              החשש שלכם מובן וטבעי - ודווקא בגלל זה חשוב לבדוק את הדברים בצורה מסודרת. פגישה קצרה עם מומחית אלרגיה יכולה לשנות מהיסוד את הביטחון וההתנהלות היומיומית בבית.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Related Resources - internal linking */}
      <section className="py-10 md:py-12 bg-surface-warm">
        <div className="container-medical">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-5 text-center">
              להרחבה - מקורות מקצועיים נוספים
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <a href="/services" className="block bg-card rounded-xl border border-border/60 p-5 hover:border-primary/40 transition-colors">
                <h3 className="font-semibold text-foreground mb-1">תחומי טיפול</h3>
                <p className="text-sm text-muted-foreground">סקירת בדיקות אלרגיה, תגרי מזון, אימונותרפיה וטיפול באסתמה.</p>
              </a>
              <a href="/dr-anna-brameli" className="block bg-card rounded-xl border border-border/60 p-5 hover:border-primary/40 transition-colors">
                <h3 className="font-semibold text-foreground mb-1">על ד״ר אנה ברמלי</h3>
                <p className="text-sm text-muted-foreground">רופאת ילדים ואלרגולוגית, מומחית באלרגיות ילדים בהוד השרון.</p>
              </a>
              <a href="/guides/בדיקות-אלרגיה-ילדים-ישראל" className="block bg-card rounded-xl border border-border/60 p-5 hover:border-primary/40 transition-colors">
                <h3 className="font-semibold text-foreground mb-1">מדריך בדיקות אלרגיה</h3>
                <p className="text-sm text-muted-foreground">תבחיני עור מול IgE בדם, פרטי מול קופה, ומה לצפות בביקור.</p>
              </a>
              <a href="/guides/טעימות-ראשונות-אלרגנים" className="block bg-card rounded-xl border border-border/60 p-5 hover:border-primary/40 transition-colors">
                <h3 className="font-semibold text-foreground mb-1">טעימות ראשונות לתינוקות</h3>
                <p className="text-sm text-muted-foreground">חשיפה מבוקרת לבמבה, טחינה, ביצה וחלב מבוססת מחקר LEAP ו-EAT.</p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-12 md:py-16">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center bg-primary/5 border border-primary/20 rounded-2xl p-8"
          >
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
              יש לכם שאלות נוספות?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              לא מצאתם תשובה לשאלה שלכם? אנחנו כאן לעזור. אתם מוזמנים <a href="/contact" className="text-primary underline">לפנות אלינו</a> או <a href="/book" className="text-primary underline">לקבוע ייעוץ פרטי</a> ישירות.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              צרו קשר
            </a>
          </motion.div>
        </div>
      </section>

    </>
  );
};

export default FAQ;
