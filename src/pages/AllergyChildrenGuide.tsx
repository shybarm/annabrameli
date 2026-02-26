import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { AuthorBadge } from "@/components/blog/AuthorBadge";
import { ArticleCTA } from "@/components/blog/ArticleCTA";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import { buildMedicalPageSchema, buildBreadcrumbSchema, buildFaqSchema } from "@/utils/medicalSchema";

const CANONICAL = "https://ihaveallergy.com/אלרגיה-בילדים-מדריך-מלא";

const tocItems = [
  { id: "what-is", label: "מהי אלרגיה?" },
  { id: "types", label: "סוגי אלרגיה בילדים" },
  { id: "symptoms", label: "תסמינים ואיך לזהות" },
  { id: "diagnosis", label: "אבחון אלרגיה בישראל" },
  { id: "treatment", label: "שיטות טיפול" },
  { id: "prevention", label: "מניעה וחשיפה מוקדמת" },
  { id: "daily-life", label: "חיים עם אלרגיה" },
  { id: "rights", label: "זכויות במערכת החינוך" },
  { id: "emergency", label: "מצבי חירום ואנפילקסיס" },
  { id: "faq", label: "שאלות נפוצות" },
];

const faqs = [
  {
    question: "מאיזה גיל אפשר לבצע בדיקות אלרגיה?",
    answer: "בדיקות דם אפשריות בכל גיל, כולל תינוקות. תבחיני עור אפשריים בדרך כלל מגיל 6 חודשים. אלרגולוג ילדים יתאים את סוג הבדיקה לגיל ולמצב הקליני של הילד.",
  },
  {
    question: "האם ילד יכול להתגבר על אלרגיה למזון?",
    answer: "כן, חלק מהאלרגיות נעלמות עם הגיל. אלרגיה לחלב ולביצים – כ-80% מהילדים מתגברים עליה עד גיל 16. אלרגיה לבוטנים ואגוזי עץ נוטה להישאר, אם כי 15-20% מהילדים עם אלרגיה לבוטנים מתגברים עליה.",
  },
  {
    question: "מה ההבדל בין אלרגיה לרגישות למזון?",
    answer: "אלרגיה היא תגובה של מערכת החיסון שעלולה לסכן חיים. רגישות (אי-סבילות) היא תגובת מערכת העיכול שאינה מסוכנת. ההבדל קריטי לניהול נכון של המצב.",
  },
  {
    question: "האם צריך לשאת אפיפן תמיד?",
    answer: "ילד שאובחן עם אלרגיה שעלולה לגרום לאנפילקסיס חייב לשאת אפיפן בכל עת. האלרגולוג ידריך בדיוק מתי ואיך להשתמש. חשוב: אפיפן הוא תרופה בטוחה – עדיף להזריק ולגלות שלא היה צורך.",
  },
  {
    question: "איך מכינים את הגן/בית הספר לילד אלרגי?",
    answer: "יש להגיש אישור רפואי מפורט, לוודא שהצוות מודרך בזיהוי תגובה אלרגית ובהזרקת אפיפן, ולהכין תוכנית חירום כתובה. להורים יש זכויות ברורות מול מערכת החינוך.",
  },
  {
    question: "האם אלרגיה תורשתית?",
    answer: "יש מרכיב גנטי משמעותי. ילד עם הורה אלרגי – סיכון של 30-40%. שני הורים אלרגיים – סיכון של 60-80%. הסוג הספציפי לא בהכרח עובר בתורשה.",
  },
  {
    question: "מתי עדיף אלרגולוג פרטי על פני קופת חולים?",
    answer: "כשצריך תור מהיר, בדיקה מקיפה, או מעקב צמוד. בפרטי הביקור ארוך יותר (30-45 דקות), יש מגוון רחב יותר של בדיקות, ותוכנית טיפול מותאמת אישית.",
  },
  {
    question: "האם חשיפה מוקדמת לאלרגנים באמת מונעת אלרגיה?",
    answer: "כן, מחקרים גדולים (כמו מחקר LEAP) הראו שהכנסת בוטנים לתפריט בגיל 4-6 חודשים מפחיתה את הסיכון לאלרגיה לבוטנים ב-80%. ההנחיות הישראליות והבינלאומיות תומכות בגישה זו.",
  },
];

const AllergyChildrenGuide = () => {
  const articleSchema = buildMedicalPageSchema({
    headline: "אלרגיה בילדים – מדריך מלא להורים: תסמינים, אבחון, טיפול וזכויות",
    description: "מדריך רפואי מקיף על אלרגיה בילדים: סוגי אלרגיה, תסמינים, שיטות אבחון, טיפולים מתקדמים, חשיפה מוקדמת, זכויות במערכת החינוך, וניהול חיי יומיום. מאת ד״ר אנה ברמלי.",
    datePublished: "2026-02-26",
    dateModified: "2026-02-26",
    canonicalUrl: CANONICAL,
    about: {
      "@type": "MedicalCondition",
      name: "Allergy in Children",
      alternateName: "אלרגיה בילדים",
    },
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "ראשי", item: "https://ihaveallergy.com/" },
    { name: "אלרגיה בילדים – מדריך מלא" },
  ]);

  const faqSchema = buildFaqSchema(faqs);

  return (
    <>
      <Helmet>
        <title>אלרגיה בילדים – מדריך מלא להורים | ד״ר אנה ברמלי</title>
        <meta name="description" content="מדריך רפואי מקיף על אלרגיה בילדים: סוגי אלרגיה, תסמינים, אבחון, טיפול, מניעה, זכויות במערכת החינוך, וניהול חיי יומיום. נכתב ונסקר על ידי ד״ר אנה ברמלי." />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:title" content="אלרגיה בילדים – מדריך מלא להורים | ד״ר אנה ברמלי" />
        <meta property="og:description" content="מדריך רפואי מקיף על אלרגיה בילדים: סוגי אלרגיה, תסמינים, אבחון, טיפול, מניעה וזכויות." />
        <meta property="og:image" content="https://ihaveallergy.com/og-logo.png" />
        <meta property="og:locale" content="he_IL" />
        <meta property="article:published_time" content="2026-02-26" />
        <meta property="article:modified_time" content="2026-02-26" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="אלרגיה בילדים – מדריך מלא להורים | ד״ר אנה ברמלי" />
        <meta name="twitter:description" content="מדריך רפואי מקיף על אלרגיה בילדים: תסמינים, אבחון, טיפול וזכויות." />
        <meta name="twitter:image" content="https://ihaveallergy.com/og-logo.png" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="gradient-hero py-12 md:py-16">
        <div className="container-medical max-w-3xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">ראשי</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-foreground">אלרגיה בילדים – מדריך מלא</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full mb-4">מדריך מקיף</span>
            <h1 className="font-bold text-foreground mb-6 text-balance">אלרגיה בילדים – מדריך מלא להורים: תסמינים, אבחון, טיפול וזכויות</h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6 max-w-2xl">
              כל מה שהורים צריכים לדעת על אלרגיה בילדים – מזיהוי תסמינים ראשוניים, דרך אבחון וטיפול, ועד ניהול חיי יומיום וזכויות במערכת החינוך. מידע רפואי מהימן ומבוסס ראיות.
            </p>
            <AuthorBadge compact />
          </motion.div>
        </div>
      </section>

      {/* Table of Contents */}
      <div className="container-medical max-w-3xl py-8">
        <nav className="bg-card rounded-2xl border border-border/60 p-6">
          <h2 className="text-base font-bold text-foreground mb-4">תוכן עניינים</h2>
          <ol className="grid sm:grid-cols-2 gap-2">
            {tocItems.map((item, i) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-sm text-primary hover:underline">
                  {i + 1}. {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Content */}
      <div className="container-medical max-w-3xl pb-16 space-y-12">

        {/* Section 1 */}
        <motion.section id="what-is" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">מהי אלרגיה?</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              אלרגיה היא תגובת יתר של מערכת החיסון לחומרים שבדרך כלל אינם מזיקים – כמו מזון, אבקנים, אבק בית, או פרוות חיות מחמד. במקום להתעלם מחומרים אלה, מערכת החיסון מזהה אותם כ"איום" ומגיבה בצורה מוגזמת, שגורמת לתסמינים שונים – מפריחה קלה ועד תגובה מסכנת חיים.
            </p>
            <p>
              אצל ילדים, אלרגיה היא אחת הבעיות הרפואיות השכיחות ביותר. בישראל, כ-8% מהילדים סובלים מאלרגיה למזון, וכ-20-30% מנזלת אלרגית. ההבנה שאלרגיה היא תגובה חיסונית – ולא "רגישות" רגילה – היא המפתח לניהול נכון ובטוח של המצב.
            </p>
            <p>
              המנגנון המרכזי ברוב האלרגיות הוא ייצור נוגדני IgE. כשהגוף נחשף לאלרגן, נוגדנים אלה מפעילים תאי פיטום שמשחררים היסטמין – החומר שגורם לתסמינים כמו פריחה, נפיחות, גרד, שיעול וקוצר נשימה.
            </p>
          </div>
        </motion.section>

        {/* Section 2 */}
        <motion.section id="types" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">סוגי אלרגיה נפוצים בילדים</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <h3 className="text-lg font-semibold text-foreground">אלרגיה למזון</h3>
            <p>
              אלרגיה למזון היא התגובה האלרגית המדאיגה ביותר בילדים, משום שהיא עלולה לגרום לאנפילקסיס – תגובה חמורה ומסכנת חיים. האלרגנים הנפוצים ביותר בקרב ילדים ישראליים הם חלב פרה, ביצים, בוטנים, שומשום (טחינה), אגוזי עץ, חיטה וסויה. לתינוקות שמתחילים בהכנסת מזונות מוצקים, מומלץ לקרוא את <Link to="/guides/טעימות-ראשונות-אלרגנים" className="text-primary font-medium hover:underline">המדריך המלא לטעימות ראשונות וחשיפה לאלרגנים</Link>, שמסביר כיצד להכניס מזונות אלרגניים בצורה בטוחה ומבוססת מחקר.
            </p>

            <h3 className="text-lg font-semibold text-foreground">אטופיק דרמטיטיס (אגזמה)</h3>
            <p>
              כ-20% מהילדים בישראל סובלים מאגזמה – מחלת עור כרונית שמתאפיינת בעור יבש, אדום ומגרד. אגזמה קשורה קשר הדוק לנטייה אלרגית, וילדים שסובלים ממנה נמצאים בסיכון מוגבר לפתח אלרגיה למזון, נזלת אלרגית ואסתמה. מאמר מפורט בנושא <Link to="/blog/אטופיק-דרמטיטיס-תינוקות" className="text-primary font-medium hover:underline">אטופיק דרמטיטיס בתינוקות – מדריך טיפול מקיף</Link> מסביר כיצד לזהות, לטפל ולמנוע התלקחויות.
            </p>

            <h3 className="text-lg font-semibold text-foreground">נזלת אלרגית</h3>
            <p>
              נזלת אלרגית פוגעת ב-20-30% מהילדים ומתבטאת בגודש באף, עיטושים, נזילה שקופה וגרד בעיניים. היא יכולה להיות עונתית (אלרגיה לאבקנים) או רב-שנתית (אלרגיה לאבק בית או לחיות מחמד). נזלת אלרגית לא מטופלת עלולה להוביל לדלקות אוזניים חוזרות ולהחמרת אסתמה. לפירוט מלא, ראו <Link to="/blog/נזלת-אלרגית-ילדים-אבחון-וטיפול" className="text-primary font-medium hover:underline">נזלת אלרגית בילדים – אבחון וטיפול</Link>.
            </p>

            <h3 className="text-lg font-semibold text-foreground">אסתמה אלרגית</h3>
            <p>
              אסתמה שמקורה באלרגיות מתאפיינת בשיעול לילי חוזר, צפצופים, וקוצר נשימה – בעיקר בחשיפה לאלרגנים סביבתיים כמו <Link to="/blog/אלרגיה-לאבק-בית-אבחון-וטיפול" className="text-primary font-medium hover:underline">קרדית אבק הבית</Link> ו<Link to="/blog/אלרגיה-לחיות-מחמד-כלבים-חתולים" className="text-primary font-medium hover:underline">חיות מחמד</Link>, או במאמץ גופני. אסתמה שלא מאוזנת יכולה להשפיע על התפתחות הריאות ועל איכות החיים של הילד. אם הילד שלכם משתעל בלילה באופן חוזר, כדאי לקרוא על ההבדל בין שיעול אלרגי לאסתמה.
            </p>

            <h3 className="text-lg font-semibold text-foreground">אלרגיה לתרופות</h3>
            <p>
              תגובות אלרגיות לתרופות, בעיקר אנטיביוטיקה מקבוצת הפניצילינים, נפוצות יותר ממה שחושבים. חשוב לדעת שרוב הילדים שמדווחים כ"אלרגיים לפניצילין" אינם באמת אלרגיים – אבחון מדויק אצל אלרגולוג יכול לחסוך שנים של הימנעות מיותרת.
            </p>
          </div>
        </motion.section>

        {/* Section 3 */}
        <motion.section id="symptoms" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">תסמינים – איך לזהות אלרגיה אצל ילדים</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              תסמיני אלרגיה יכולים להשתנות מאוד – מתגובה עורית קלה ועד מצב חירום. ההורים הם הראשונים שמבחינים בדרך כלל בתגובה. הנה הסימנים שחשוב להכיר:
            </p>
            <p>
              <strong className="text-foreground">תגובות עוריות:</strong> פריחה אדומה, חרלות (אורטיקריה), נפיחות בשפתיים או בעיניים, גרד. תינוקות שמפתחים פריחה לאחר אכילת מזון חדש – כמו <Link to="/blog/פריחה-אחרי-במבה-לתינוק" className="text-primary font-medium hover:underline">פריחה אחרי במבה</Link> – צריכים הערכה מדוקדקת כדי להבחין בין גירוי עור לבין אלרגיה אמיתית.
            </p>
            <p>
              <strong className="text-foreground">תגובות מערכת העיכול:</strong> הקאות, שלשול, כאבי בטן חוזרים – בעיקר לאחר אכילת מזון מסוים. אצל תינוקות, סירוב לאכול מזון מסוים יכול להיות סימן.
            </p>
            <p>
              <strong className="text-foreground">תגובות נשימתיות:</strong> שיעול, צפצופים, גודש באף, נשימה רועשת. שיעול לילי חוזר שאינו קשור להצטננות הוא אחד הסימנים הנפוצים לאסתמה אלרגית.
            </p>
            <p>
              <strong className="text-foreground">אנפילקסיס – מצב חירום:</strong> תגובה מערכתית חמורה שמערבת שתי מערכות גוף או יותר – למשל פריחה יחד עם קשיי נשימה, או הקאות עם ירידת לחץ דם. מצב זה דורש הזרקת אפיפן מיידית.
            </p>
          </div>
        </motion.section>

        {/* Section 4 */}
        <motion.section id="diagnosis" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">אבחון אלרגיה בילדים בישראל</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              אבחון מדויק הוא הבסיס לטיפול נכון. בישראל קיימות מספר שיטות אבחון, וחשוב להבין מתי כל אחת מתאימה. אם אתם לא בטוחים אם מדובר באלרגיה, <Link to="/blog/איך-לדעת-אם-יש-אלרגיה-מדריך" className="text-primary font-medium hover:underline">המדריך המלא לזיהוי סימני אלרגיה</Link> יעזור לכם להבין מתי לפנות לרופא. למידע מפורט על כל סוגי הבדיקות, עלויות, ומה לצפות – ראו את <Link to="/guides/בדיקות-אלרגיה-ילדים-ישראל" className="text-primary font-medium hover:underline">המדריך המלא לבדיקות אלרגיה לילדים בישראל</Link>.
            </p>

            <h3 className="text-lg font-semibold text-foreground">תבחיני עור (Skin Prick Test)</h3>
            <p>
              הבדיקה הנפוצה ביותר באלרגולוגיה. טיפות תמציות אלרגנים מונחות על העור ונעשית דקירה עדינה. תוצאה תוך 15-20 דקות. הבדיקה רגישה, מהירה, ויכולה לבדוק עשרות אלרגנים בפגישה אחת. מתאימה מגיל 6 חודשים.
            </p>

            <h3 className="text-lg font-semibold text-foreground">בדיקת דם (IgE ספציפי)</h3>
            <p>
              מודדת רמת נוגדנים ספציפיים בדם. מתאימה כשיש אגזמה פעילה שמונעת בדיקת עור, כשהילד נוטל אנטיהיסטמינים, או כשרוצים ערך מספרי למעקב לאורך זמן. חשוב לדעת: תוצאה חיובית בבדיקת דם לא בהכרח אומרת אלרגיה קלינית – כ-50% מהתוצאות החיוביות הן "חיוביות כוזבות".
            </p>

            <h3 className="text-lg font-semibold text-foreground">תגר מזון (Oral Food Challenge)</h3>
            <p>
              תקן הזהב באבחון אלרגיה למזון. הילד אוכל כמויות הולכות וגדלות של המזון החשוד, תחת פיקוח רפואי צמוד. הבדיקה מתבצעת במרפאה מאובזרת ואורכת מספר שעות. לא כל ילד צריך תגר – האלרגולוג מחליט על פי ההיסטוריה ותוצאות הבדיקות.
            </p>

            <h3 className="text-lg font-semibold text-foreground">בדיקות מולקולריות</h3>
            <p>
              בדיקות מתקדמות שמזהות את הרכיב הספציפי באלרגן. מסייעות להבחין בין אלרגיה אמיתית לרגישות צולבת ולחזות את חומרת התגובה. שימושיות במיוחד באלרגיה לאגוזים ולפירות.
            </p>
          </div>
        </motion.section>

        <ArticleCTA variant="inline" />

        {/* Section 5 */}
        <motion.section id="treatment" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">שיטות טיפול באלרגיה בילדים</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <h3 className="text-lg font-semibold text-foreground">הימנעות מבוקרת</h3>
            <p>
              זיהוי מדויק של האלרגנים והימנעות ממגע עמם – תוך שמירה על תזונה מאוזנת. כולל הדרכה לקריאת תוויות מזון, תכנון תפריט, והדרכת המסגרת החינוכית. חשוב: הימנעות צריכה להיות ממוקדת בלבד – הימנעות גורפת ומיותרת מזיקה לתזונה ולאיכות החיים.
            </p>

            <h3 className="text-lg font-semibold text-foreground">טיפול תרופתי</h3>
            <p>
              אנטיהיסטמינים לטיפול בתסמינים (פריחה, גרד, נזלת), משאפים וסטרואידים אינהלציוניים לאסתמה, תרסיסים סטרואידיים לנזלת אלרגית, ומשחות אנטי-דלקתיות לאגזמה. טיפול ביולוגי (כמו אומליזומאב) שמור למקרים חמורים שלא מגיבים לטיפול רגיל.
            </p>

            <h3 className="text-lg font-semibold text-foreground">אימונותרפיה (חיסוני אלרגיה)</h3>
            <p>
              הטיפול היחיד שמשנה את מהלך המחלה ולא רק מקל על תסמינים. חשיפה מבוקרת והדרגתית לאלרגן כדי לבנות סבילות. קיימת בצורת זריקות, טיפות מתחת ללשון, ואימונותרפיה דרך הפה למזון (OIT). הטיפול נמשך 3-5 שנים אך ההשפעה ארוכת טווח.
            </p>

            <h3 className="text-lg font-semibold text-foreground">דה-סנסיטיזציה למזון (OIT)</h3>
            <p>
              פרוטוקול שבו הילד צורך כמויות הולכות וגדלות של המזון האלרגני תחת השגחה רפואית צמודה. מתאים לאלרגיה לבוטנים, חלב, ביצים ושומשום. שיעורי הצלחה של 70-85%. מבוצע רק אצל אלרגולוג מנוסה.
            </p>
          </div>
        </motion.section>

        {/* Section 6 */}
        <motion.section id="prevention" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">מניעת אלרגיה – חשיפה מוקדמת</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              אחד הפריצות הגדולות בתחום האלרגיה בעשור האחרון היא ההבנה שחשיפה מוקדמת למזונות אלרגניים דווקא מפחיתה את הסיכון לפתח אלרגיה. מחקר LEAP ההיסטורי הראה הפחתה של 80% בשכיחות אלרגיה לבוטנים בקרב תינוקות שצרכו בוטנים מגיל מוקדם.
            </p>
            <p>
              ההנחיות הישראליות מעודדות הכנסת מזונות אלרגניים – כולל במבה (בוטנים), טחינה (שומשום), ביצה וחלב – לתפריט התינוק בגיל 4-6 חודשים. <Link to="/guides/טעימות-ראשונות-אלרגנים" className="text-primary font-medium hover:underline">המדריך המלא לטעימות ראשונות</Link> מפרט בדיוק כיצד לעשות זאת בצורה בטוחה ומדורגת.
            </p>
            <p>
              תינוקות בסיכון מוגבר – כאלה עם אגזמה בינונית-חמורה או עם אח/ות עם אלרגיה – מומלץ שיתייעצו עם אלרגולוג ילדים לפני תחילת החשיפה. במקרים מסוימים, תבוצע בדיקת עור לפני הכנסת האלרגן.
            </p>
          </div>
        </motion.section>

        {/* Section 7 */}
        <motion.section id="daily-life" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">חיים עם אלרגיה – ניהול יומיומי</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              ניהול אלרגיה ביומיום הוא אתגר מתמשך למשפחות. מדובר לא רק בהימנעות ממזון, אלא בשורה של החלטות יומיומיות: מה קונים בסופרמרקט, מה מכינים לארוחת צהריים, לאן הולכים לאכול בחוץ, ואיך מוודאים שהילד בטוח גם כשאתם לא לידו.
            </p>
            <p>
              <strong className="text-foreground">קריאת תוויות:</strong> כל רכישה דורשת בדיקת רשימת רכיבים. חשוב לשים לב לא רק לרכיב עצמו אלא גם לאזהרות כמו "עלול להכיל" ו"מיוצר בסביבה". סימון כשרותי ("פרווה" או "חלבי") אינו מחליף בדיקת אלרגנים – <Link to="/blog/protein-milk-pareve-risk" className="text-primary font-medium hover:underline">מוצר פרווה יכול להכיל חלבון חלב שמסוכן לאלרגיים</Link>.
            </p>
            <p>
              <strong className="text-foreground">אכילה מחוץ לבית:</strong> תקשורת ברורה עם מלצרים ושפים, שאלות ספציפיות על רכיבים ושיטות הכנה, ונשיאת אפיפן תמיד.
            </p>
            <p>
              <strong className="text-foreground">העצמת הילד:</strong> ילדים גדולים יותר לומדים לנהל את האלרגיה באופן עצמאי – לשאול על מרכיבים, לסרב באדיבות למזון לא בטוח, ולדעת מתי לבקש עזרה. המטרה היא לבנות ביטחון, לא פחד.
            </p>
          </div>
        </motion.section>

        {/* Section 8 */}
        <motion.section id="rights" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">זכויות ילד אלרגי במערכת החינוך</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              להורים לילדים אלרגיים יש זכויות ברורות מול מערכת החינוך הישראלית. חוזרי מנכ"ל משרד החינוך מגדירים חובות של צוות חינוכי בנוגע לילדים עם אלרגיות מזון, כולל: התאמת תפריט, הדרכת צוות בהזרקת אפיפן, והבטחת סביבה בטוחה.
            </p>
            <p>
              <Link to="/guides/זכויות-ילד-אלרגי-ישראל" className="text-primary font-medium hover:underline">המדריך המלא לזכויות של ילד אלרגי בישראל</Link> מפרט את כל הזכויות, כולל: הזכות לסביבה מותאמת, הזכות להשתתפות בטיולים ופעילויות, הזכות לסייעת רפואית במקרים מסוימים, וצ'קליסט להורדה להכנת אישור רפואי למסגרת.
            </p>
            <p>
              חשוב לדעת: גן או בית ספר אינם רשאים לסרב לקבל ילד בגלל אלרגיה. אם נתקלתם בסירוב – יש לכם כלים משפטיים ברורים.
            </p>
          </div>
        </motion.section>

        {/* Section 9 */}
        <motion.section id="emergency" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">מצבי חירום – אנפילקסיס</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              אנפילקסיס היא תגובה אלרגית חמורה ומסכנת חיים שדורשת טיפול מיידי. כל הורה לילד אלרגי חייב להכיר את הסימנים ולדעת לפעול:
            </p>
            <div className="bg-destructive/5 rounded-2xl p-5 border border-destructive/20">
              <p className="font-semibold text-foreground mb-3">סימנים לאנפילקסיס:</p>
              <ul className="space-y-1 text-sm">
                <li>• נפיחות בשפתיים, לשון או גרון</li>
                <li>• קשיי נשימה, צפצופים, שיעול עמוק</li>
                <li>• חיוורון חמור, סחרחורת, אובדן הכרה</li>
                <li>• הקאות או שלשולים פתאומיים עם פריחה</li>
              </ul>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border/60">
              <p className="font-semibold text-foreground mb-3">מה לעשות:</p>
              <ol className="space-y-2 text-sm">
                <li><strong>1.</strong> הזריקו אפיפן מיד – בירך החיצונית, דרך הבגד</li>
                <li><strong>2.</strong> התקשרו ל-101 – גם אם נראה שהמצב משתפר</li>
                <li><strong>3.</strong> שכיבו את הילד עם רגליים מורמות</li>
                <li><strong>4.</strong> מנת אפיפן שנייה אם אין שיפור תוך 5-15 דקות</li>
                <li><strong>5.</strong> אל תשאירו את הילד לבד – המתינו לצוות רפואי</li>
              </ol>
            </div>
            <p>
              <strong className="text-foreground">חשוב:</strong> אפיפן הוא תרופה בטוחה. עדיף להזריק ולגלות שלא היה צורך, מאשר להסס כשיש צורך. כל ילד שאובחן עם אלרגיה מסכנת חיים צריך לשאת אפיפן בכל עת.
            </p>
          </div>
        </motion.section>

        {/* FAQ */}
        <section id="faq" className="pt-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">שאלות נפוצות על אלרגיה בילדים</h2>
          <FAQAccordion items={faqs} />
        </section>

        {/* Bottom CTA */}
        <ArticleCTA variant="section" />

        {/* Related Guides */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">מדריכים מומלצים</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { to: "/guides/טעימות-ראשונות-אלרגנים", label: "טעימות ראשונות – מדריך חשיפה לאלרגנים לתינוקות" },
              { to: "/guides/בדיקות-אלרגיה-ילדים-ישראל", label: "בדיקות אלרגיה לילדים – מה עושים, מתי ואיפה" },
              { to: "/guides/זכויות-ילד-אלרגי-ישראל", label: "זכויות הילד האלרגי בישראל – מדריך מלא להורים" },
              { to: "/guides/אלרגיה-מדריך-מקיף", label: "אלרגיה – המדריך המקיף: סוגים, אבחון וטיפול" },
              { to: "/blog/פריחה-אחרי-במבה-לתינוק", label: "פריחה אחרי במבה – מתי זו אלרגיה ומתי לא" },
              { to: "/blog/נזלת-אלרגית-ילדים-אבחון-וטיפול", label: "נזלת אלרגית בילדים – אבחון וטיפול מקיף" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 bg-card rounded-xl p-4 border border-border/60 card-hover group text-sm"
              >
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-foreground group-hover:text-primary transition-colors font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Author */}
        <div className="space-y-6">
          <AuthorBadge />
          <div className="bg-surface rounded-2xl p-5 border border-border/40 text-xs text-muted-foreground leading-relaxed">
            <p className="mb-2">
              <strong className="text-foreground">הבהרה רפואית:</strong> המידע בעמוד זה נועד לצרכי הסברה בלבד ואינו מהווה תחליף לייעוץ רפואי מקצועי.
            </p>
            <p>
              תוכן זה נכתב ונסקר רפואית על ידי ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה. עודכן: פברואר 2026.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AllergyChildrenGuide;
