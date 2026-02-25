import { Helmet } from "react-helmet-async";
import { buildMedicalPageSchema, buildBreadcrumbSchema, buildFaqSchema } from "@/utils/medicalSchema";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Baby,
  ShieldCheck,
  Heart,
  ArrowRight,
  Stethoscope,
  Pill,
  Apple,
  Wind,
  Eye,
  FlaskConical,
  BookOpen,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthorBadge } from "@/components/blog/AuthorBadge";
import { ArticleCTA } from "@/components/blog/ArticleCTA";
import { FAQAccordion } from "@/components/ui/faq-accordion";

const WHATSAPP_URL =
  "https://wa.me/972545808008?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%99%D7%99%D7%A2%D7%95%D7%A5%20%D7%9C%D7%92%D7%91%D7%99%20%D7%90%D7%9C%D7%A8%D7%92%D7%99%D7%94";

const SectionIcon = ({ icon: Icon }: { icon: React.ElementType }) => (
  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
    <Icon className="w-5 h-5 text-primary" />
  </div>
);

const Section = ({
  id,
  icon,
  title,
  children,
  delay = 0,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="mb-14"
    id={id}
  >
    <div className="flex items-center gap-3 mb-5">
      <SectionIcon icon={icon} />
      <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
    </div>
    <div className="text-muted-foreground leading-relaxed space-y-4">{children}</div>
  </motion.section>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-6">
    <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const InfoCard = ({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "warm" | "alert";
}) => {
  const classes = {
    default: "bg-card border-border/60",
    warm: "bg-surface-warm border-border/40",
    alert: "bg-destructive/5 border-destructive/20",
  };
  return (
    <div className={`rounded-2xl p-5 md:p-6 border ${classes[variant]}`}>{children}</div>
  );
};

/* ────────── Data ────────── */

const allergyTypes = [
  {
    name: "אלרגיה למזון",
    icon: Apple,
    desc: "תגובה חיסונית למרכיב במזון. השכיחות בילדים בישראל: 6-8%. אלרגנים נפוצים: חלב, ביצים, בוטנים, שומשום, אגוזי עץ, חיטה, סויה, דגים.",
    link: "/guides/טעימות-ראשונות-אלרגנים",
    linkLabel: "מדריך טעימות ראשונות",
  },
  {
    name: "אלרגיה נשימתית (אסתמה ונזלת אלרגית)",
    icon: Wind,
    desc: "תגובה לאלרגנים באוויר: אבקת פרחים, קרדית אבק הבית, שיער חיות מחמד, עובש. גורמת לנזלת, גודש, עיטוש, שיעול כרוני וקוצר נשימה.",
    link: "/services",
    linkLabel: "שירותי אבחון וטיפול",
  },
  {
    name: "אלרגיה לתרופות",
    icon: Pill,
    desc: "תגובה חיסונית לתרופה, הנפוצה ביותר: אנטיביוטיקה מקבוצת הפניצילינים ותרופות נוגדות דלקת (NSAIDs). יכולה להופיע גם בפעם הראשונה שהילד נחשף.",
    link: "/services",
    linkLabel: "בדיקת אלרגיה לתרופות",
  },
  {
    name: "אלרגיה עורית (אטופיק דרמטיטיס / אורטיקריה)",
    icon: Eye,
    desc: "אגזמה אטופית שכיחה ב-20% מהילדים בישראל. קשורה לנטייה אלרגית ומהווה גורם סיכון לפתח אלרגיה למזון. אורטיקריה (חרלות) יכולה להיות ביטוי של תגובה אלרגית חריפה.",
    link: "/blog",
    linkLabel: "מאמרים על אלרגיה עורית",
  },
];

const diagnosticMethods = [
  {
    name: "תבחיני עור (Skin Prick Test)",
    desc: "הבדיקה הנפוצה ביותר. טיפת תמצית אלרגן מונחת על העור, עם דקירה קלה. תוצאה תוך 15-20 דקות. מתאימה מגיל חודשיים.",
    link: "/knowledge/תבחיני-עור-כואב-לילדים",
    linkLabel: "האם תבחיני עור כואבים?",
  },
  {
    name: "בדיקת דם (IgE ספציפי)",
    desc: "בדיקת דם הבודקת רמות נוגדנים ספציפיים כנגד אלרגנים. שימושית כשלא ניתן להפסיק אנטיהיסטמינים או כשיש בעיות עור נרחבות.",
    link: "/knowledge/בדיקת-דם-לאלרגיה-ילדים",
    linkLabel: "מתי בדיקת דם מספיקה?",
  },
  {
    name: "תגר מזון (Oral Food Challenge)",
    desc: "תקן הזהב באבחון אלרגיה למזון. הילד אוכל כמויות הולכות וגדלות של המזון החשוד תחת השגחה רפואית. מתבצע בבית חולים או מרפאה מאובזרת.",
    link: "/knowledge/תגר-מזון-איך-זה-נראה",
    linkLabel: "איך נראה תגר מזון?",
  },
  {
    name: "בדיקות מולקולריות (Component Resolved Diagnostics)",
    desc: "בדיקות מתקדמות המזהות את הרכיב הספציפי באלרגן שאליו הגוף מגיב. מסייעות להבחין בין אלרגיה אמיתית לבין רגישות צולבת, ולחזות את חומרת התגובה.",
  },
];

const treatmentApproaches = [
  {
    name: "הימנעות מבוקרת",
    desc: "זיהוי מדויק של האלרגנים הספציפיים והימנעות ממגע עמם, תוך שמירה על תזונה מאוזנת ומגוונת. כולל הדרכה לקריאת תוויות מזון, תכנון תפריט, והדרכת המסגרת החינוכית.",
  },
  {
    name: "טיפול תרופתי",
    desc: "אנטיהיסטמינים לטיפול בתסמינים, משאפים ותרסיסים לאסתמה ונזלת אלרגית, אפינפרין (אפיפן) למקרי חירום. טיפול ביולוגי (אומליזומאב) למקרים חמורים שלא מגיבים לטיפול רגיל.",
  },
  {
    name: "אימונותרפיה (חיסוני אלרגיה)",
    desc: "חשיפה מבוקרת והדרגתית לאלרגן במטרה לבנות סבילות. קיימת בצורת זריקות (SCIT), טיפות מתחת ללשון (SLIT), ואימונותרפיה דרך הפה (OIT) למזון. הטיפול נמשך 3-5 שנים.",
  },
  {
    name: "דה-סנסיטיזציה למזון (OIT)",
    desc: "פרוטוקול מבוקר שבו הילד צורך כמויות הולכות וגדלות של המזון האלרגני תחת השגחה רפואית. מתאים לאלרגיה לבוטנים, חלב, ביצים ועוד. שיעורי הצלחה של 70-85%.",
  },
];

const emergencySteps = [
  { step: "1", title: "הזריקו אפיפן מיד", desc: "בירך החיצונית, דרך הבגד. אל תהססו." },
  { step: "2", title: "התקשרו ל-101", desc: "גם אם נראה שהמצב משתפר." },
  { step: "3", title: "שכיבו את המטופל", desc: "רגליים מורמות, אלא אם יש קשיי נשימה – אז ישיבה." },
  { step: "4", title: "מנת אפיפן שנייה", desc: "אם אין שיפור תוך 5-15 דקות." },
  { step: "5", title: "אל תשאירו לבד", desc: "המתינו לצוות רפואי והישארו ליד המטופל." },
];

const anaphylaxisSigns = [
  "נפיחות בשפתיים, לשון או גרון",
  "קשיי נשימה, צפצופים, שיעול עמוק",
  "חיוורון חמור, סחרחורת, אובדן הכרה",
  "הקאות או שלשולים פתאומיים עם פריחה",
  "דופק מהיר, ירידה בלחץ דם",
  "תחושת ״משהו רע קורה לי״",
];

const childrenSpecial = [
  {
    title: "אלרגיה למזון בתינוקות",
    desc: "6-8% מהתינוקות בישראל סובלים מאלרגיה למזון. הגישה המודרנית מבוססת על חשיפה מוקדמת למניעה. תינוקות עם אגזמה בינונית-חמורה נמצאים בסיכון מוגבר.",
    link: "/guides/טעימות-ראשונות-אלרגנים",
    linkLabel: "מדריך טעימות ראשונות",
  },
  {
    title: "אלרגיה בגיל הגן",
    desc: "ניהול אלרגיה במסגרת חינוכית דורש תכנון: אישור רפואי, הדרכת צוות, תוכנית חירום, והתאמת תפריט. להורים יש זכויות ברורות מול מערכת החינוך.",
    link: "/guides/זכויות-ילד-אלרגי-ישראל",
    linkLabel: "מדריך זכויות הילד האלרגי",
  },
  {
    title: "אלרגיה בגיל בית הספר",
    desc: "ילדים גדולים לומדים לנהל את האלרגיה באופן עצמאי: קריאת תוויות, נשיאת אפיפן, תקשורת עם מבוגרים. חשוב להעצים ולא להפחיד.",
    link: "/knowledge/טיול-שנתי-ילד-אלרגי",
    linkLabel: "טיול שנתי עם ילד אלרגי",
  },
];

const faqs = [
  {
    question: "מה ההבדל בין אלרגיה לרגישות למזון?",
    answer:
      "אלרגיה למזון היא תגובה של מערכת החיסון (בדרך כלל באמצעות נוגדני IgE) שיכולה לגרום לתסמינים מהירים ומסוכנים כמו אנפילקסיס. רגישות למזון (אי-סבילות) היא תגובה שאינה מערבת את מערכת החיסון – למשל אי-סבילות ללקטוז – וגורמת בעיקר לתסמינים עיכוליים לא מסוכנים. ההבדל קריטי: אלרגיה דורשת הימנעות מוחלטת ונשיאת אפיפן, בעוד אי-סבילות מאפשרת בדרך כלל צריכה בכמויות קטנות.",
  },
  {
    question: "האם ילד יכול להתגבר על אלרגיה למזון?",
    answer:
      "כן, חלק מהאלרגיות נעלמות עם הגיל. אלרגיה לחלב ולביצים – כ-80% מהילדים מתגברים עליה עד גיל 16. אלרגיה לבוטנים, אגוזי עץ, דגים ורכיכות – נוטה להישאר לאורך החיים אצל רוב המטופלים, אם כי 15-20% מהילדים עם אלרגיה לבוטנים מתגברים עליה. מעקב תקופתי אצל אלרגולוג מאפשר לזהות מתי ניתן לנסות חשיפה מחודשת בצורה בטוחה.",
  },
  {
    question: "מתי חייבים לפנות לאלרגולוג ולא להסתפק ברופא ילדים?",
    answer:
      "יש לפנות לאלרגולוג כאשר: הילד חווה תגובה אלרגית חמורה (אנפילקסיס), יש חשד לאלרגיה למספר מזונות, הילד סובל מאגזמה חמורה שלא מגיבה לטיפול, יש אסתמה שלא מאוזנת, נדרשת בדיקה לפני חיסונים או ניתוח, או כשיש צורך באישור רפואי למסגרת החינוכית. אלרגולוג מומחה יכול לבצע בדיקות מדויקות ולבנות תוכנית טיפול מותאמת.",
  },
  {
    question: "האם בדיקת דם לאלרגיה אמינה?",
    answer:
      "בדיקת דם (IgE ספציפי) היא כלי עזר חשוב אך אינה מספיקה לבדה. תוצאה חיובית מראה שהגוף ייצר נוגדנים כנגד אלרגן מסוים, אך לא תמיד משמעה אלרגיה קלינית. כ-50% מהתוצאות החיוביות הן \"חיוביות כוזבות\" – כלומר הילד סובלני למזון למרות הבדיקה. לכן, בדיקת דם צריכה להתפרש בהקשר הקליני המלא, ולפעמים נדרש תגר מזון לאישוש האבחנה.",
  },
  {
    question: "מה עושים במקרה של אנפילקסיס?",
    answer:
      "אנפילקסיס היא תגובה אלרגית חמורה ומסכנת חיים שדורשת טיפול מיידי. יש להזריק אפינפרין (אפיפן) מיד לירך החיצונית, להתקשר ל-101, ולהשכיב את המטופל עם רגליים מורמות. אם אין שיפור תוך 5-15 דקות – מנת אפיפן שנייה. חשוב: אפיפן הוא תרופה בטוחה, אין סיבה להסס להשתמש בו. עדיף להזריק ולגלות שלא היה צורך, מאשר לא להזריק כשיש צורך.",
  },
  {
    question: "האם אלרגיה תורשתית?",
    answer:
      "יש מרכיב גנטי משמעותי. ילד עם הורה אחד אלרגי – סיכון של 30-40% לפתח אלרגיה כלשהי. שני הורים אלרגיים – סיכון של 60-80%. עם זאת, הסוג הספציפי של האלרגיה לא בהכרח עובר בתורשה. ילד להורה עם אסתמה יכול לפתח אלרגיה למזון, ולהפך. גורמים סביבתיים (חשיפה מוקדמת, תזונה, מיקרוביום) משפיעים על הביטוי של הנטייה הגנטית.",
  },
  {
    question: "מה ההבדל בין בדיקה פרטית לבדיקה בקופת חולים?",
    answer:
      "בקופת חולים: ההמתנה ארוכה (שבועות-חודשים), הבדיקות מכוסות בסל הבריאות, וההיצע מוגבל בסוגי הבדיקות. בפרטי: זמינות מיידית (תוך ימים), מגוון רחב יותר של בדיקות כולל מולקולריות, ייעוץ ארוך ומפורט, ומעקב צמוד. בדיקות חיוניות כמו תבחיני עור ותגר מזון זמינות בשני המסלולים, אך הפרטי מאפשר גישה מהירה ומקיפה יותר.",
    link: "/knowledge/בדיקות-אלרגיה-פרטי-או-קופה",
  },
  {
    question: "האם אפשר להתחסן אם יש אלרגיה לביצים?",
    answer:
      "ברוב המוחלט של המקרים – כן. ההנחיות העדכניות מאפשרות מתן חיסון שפעת וחיסון MMR לילדים עם אלרגיה לביצים, כולל אלרגיה חמורה, ללא צורך באשפוז. חיסון חצבת-חזרת-אדמת (MMR) בטוח לחלוטין לילדים עם אלרגיה לביצים. חיסון שפעת ניתן גם הוא באופן שגרתי, עם המתנה של 30 דקות במקרים של אנפילקסיס קודם מביצים. אלרגולוג יכול להנחות במקרים ייחודיים.",
  },
];

const relatedGuides = [
  {
    to: "/guides/טעימות-ראשונות-אלרגנים",
    label: "טעימות ראשונות – מדריך חשיפה לאלרגנים לתינוקות",
    tag: "מדריך מקיף",
  },
  {
    to: "/guides/זכויות-ילד-אלרגי-ישראל",
    label: "זכויות הילד האלרגי בישראל – מדריך להורים",
    tag: "זכויות",
  },
  {
    to: "/guides/בדיקות-אלרגיה-ילדים-ישראל",
    label: "בדיקות אלרגיה לילדים – מה עושים ומתי",
    tag: "בדיקות",
  },
];

/* ────────── Component ────────── */

const AllergyPillar = () => {
  const faqSchema = buildFaqSchema(faqs);

  const articleSchema = buildMedicalPageSchema({
    headline: "אלרגיה – המדריך המקיף בעברית: סוגים, אבחון, טיפול וחיים עם אלרגיה",
    description: "מדריך רפואי מקיף בעברית על אלרגיות: סוגים, תסמינים, אבחון, טיפול, חיים עם אלרגיה בילדים ומבוגרים. נכתב ונסקר על ידי ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה.",
    datePublished: "2026-02-14",
    dateModified: "2026-02-14",
    canonicalUrl: "https://ihaveallergy.com/guides/אלרגיה-מדריך-מקיף",
    about: {
      "@type": "MedicalCondition",
      name: "Allergy",
      alternateName: "אלרגיה",
    },
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "ראשי", item: "https://ihaveallergy.com/" },
    { name: "מדריכים", item: "https://ihaveallergy.com/guides/טעימות-ראשונות-אלרגנים" },
    { name: "אלרגיה – המדריך המקיף" },
  ]);

  return (
    <>
      <Helmet>
        <title>אלרגיה – המדריך המקיף בעברית: סוגים, אבחון וטיפול | ד״ר אנה ברמלי</title>
        <meta
          name="description"
          content="מדריך רפואי מקיף על אלרגיות: סוגי אלרגיה, תסמינים, שיטות אבחון, אפשרויות טיפול, מניעה וניהול חיים עם אלרגיה. נכתב על ידי מומחית לאלרגיה ואימונולוגיה."
        />
        <link rel="canonical" href="https://ihaveallergy.com/guides/אלרגיה-מדריך-מקיף" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://ihaveallergy.com/guides/אלרגיה-מדריך-מקיף" />
        <meta property="og:title" content="אלרגיה – המדריך המקיף בעברית: סוגים, אבחון וטיפול | ד״ר אנה ברמלי" />
        <meta property="og:description" content="מדריך רפואי מקיף על אלרגיות: סוגי אלרגיה, תסמינים, שיטות אבחון, אפשרויות טיפול, מניעה וניהול חיים עם אלרגיה." />
        <meta property="og:image" content="https://ihaveallergy.com/og-logo.png" />
        <meta property="article:published_time" content="2026-02-14" />
        <meta property="article:modified_time" content="2026-02-14" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="אלרגיה – המדריך המקיף בעברית: סוגים, אבחון וטיפול | ד״ר אנה ברמלי" />
        <meta name="twitter:description" content="מדריך רפואי מקיף על אלרגיות: סוגי אלרגיה, תסמינים, שיטות אבחון, אפשרויות טיפול." />
        <meta name="twitter:image" content="https://ihaveallergy.com/og-logo.png" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* ── Hero ── */}
      <section className="gradient-hero py-14 md:py-20">
        <div className="container-medical max-w-3xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">ראשי</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <Link to="/blog" className="hover:text-foreground transition-colors">בלוג</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-foreground">אלרגיה – המדריך המקיף</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full mb-5">
              מדריך פילר
            </span>

            <h1 className="font-bold text-foreground mb-6 text-balance">
              אלרגיה – המדריך המקיף בעברית
              <span className="block text-primary mt-2 text-[22px] md:text-[28px] lg:text-[32px]">
                סוגים, אבחון, טיפול וחיים עם אלרגיה
              </span>
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                15 דקות קריאה
              </span>
              <span className="flex items-center gap-1.5">
                עודכן: פברואר 2026
              </span>
            </div>

            <AuthorBadge compact />
          </motion.div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="container-medical max-w-3xl py-12 md:py-16">

        {/* ── Intro ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <InfoCard variant="warm">
            <p className="text-lg text-foreground leading-relaxed mb-4">
              אלרגיה היא אחד המצבים הרפואיים הנפוצים ביותר בעולם – ובישראל בפרט. כ-25% מהאוכלוסייה הישראלית סובלת מסוג כלשהו של אלרגיה, וההיארעות ממשיכה לעלות בעשורים האחרונים.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              בין אם מדובר בילד שפיתח פריחה אחרי במבה, מבוגר עם נזלת עונתית שמחמירה כל אביב, או הורה שמנסה להבין אם בנו באמת אלרגי לביצים – <strong className="text-foreground">ידע מדויק הוא הכלי החשוב ביותר שיש לכם.</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              המדריך הזה נכתב כדי לרכז במקום אחד את כל מה שצריך לדעת: מהי אלרגיה, איך מזהים אותה, אילו בדיקות קיימות, מהן אפשרויות הטיפול, וכיצד לנהל חיים מלאים ובטוחים עם אלרגיה. נכתב ונסקר רפואית על ידי ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה.
            </p>
          </InfoCard>
        </motion.section>

        {/* ── 1. מהי אלרגיה ── */}
        <Section id="what-is-allergy" icon={BookOpen} title="מהי אלרגיה? הגדרה ומנגנון">
          <p>
            <strong className="text-foreground">אלרגיה היא תגובת יתר של מערכת החיסון לחומר שבדרך כלל אינו מזיק.</strong> חומר זה נקרא <strong className="text-foreground">אלרגן</strong>. אלרגנים יכולים להיות מזונות, אבקת פרחים, קרדית אבק, שיער חיות, תרופות, עקיצות חרקים ועוד.
          </p>
          <p>
            כשאדם אלרגי נחשף לאלרגן, מערכת החיסון שלו מזהה אותו בטעות כ״איום״ ומייצרת נוגדנים מסוג <strong className="text-foreground">IgE</strong>. נוגדנים אלה נקשרים לתאי פיטום (Mast Cells) ברקמות הגוף. בחשיפה הבאה, האלרגן נקשר לנוגדנים ומפעיל את תאי הפיטום לשחרר חומרים כמו <strong className="text-foreground">היסטמין</strong>, שגורמים לתסמינים המוכרים: גרד, נפיחות, נזלת, פריחה, ובמקרים חמורים – אנפילקסיס.
          </p>

          <SubSection title="מהי אטופיה?">
            <p>
              אטופיה היא נטייה גנטית לפתח תגובות אלרגיות. משפחות אטופיות נוטות לראות ״מצעד אטופי״ – רצף אופייני שמתחיל באגזמה בינקות, ממשיך באלרגיה למזון, ומתפתח לנזלת אלרגית ואסתמה. הבנת הנטייה הזו מאפשרת התערבות מוקדמת ומניעה.
            </p>
          </SubSection>

          <SubSection title="אלרגיה לעומת אי-סבילות – ההבדל הקריטי">
            <p>
              <strong className="text-foreground">אלרגיה</strong> מערבת את מערכת החיסון ויכולה לסכן חיים. <strong className="text-foreground">אי-סבילות</strong> (כמו אי-סבילות ללקטוז) אינה מערבת את מערכת החיסון, גורמת בעיקר לתסמינים עיכוליים, ואינה מסכנת חיים. ההבחנה חשובה כי הטיפול שונה לחלוטין: אלרגיה דורשת הימנעות מוחלטת ומוכנות לאנפילקסיס, בעוד אי-סבילות מאפשרת בדרך כלל צריכה מוגבלת.
            </p>
          </SubSection>
        </Section>

        {/* ── 2. סוגי אלרגיה ── */}
        <Section id="allergy-types" icon={Heart} title="סוגי אלרגיה עיקריים">
          <p>
            אלרגיות מתחלקות למספר קטגוריות עיקריות, כל אחת עם מאפיינים, אבחון וטיפול ייחודיים:
          </p>
          <div className="space-y-4 mt-4">
            {allergyTypes.map((type, i) => (
              <motion.div
                key={type.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <InfoCard>
                  <div className="flex items-start gap-3">
                    <SectionIcon icon={type.icon} />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{type.name}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{type.desc}</p>
                      {type.link && (
                        <Link
                          to={type.link}
                          className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3 hover:underline"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          {type.linkLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                </InfoCard>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── 3. תסמינים ── */}
        <Section id="symptoms" icon={AlertTriangle} title="תסמינים של אלרגיה – איך מזהים?">
          <p>
            תסמיני אלרגיה משתנים בהתאם לסוג האלרגן ולמערכת הגוף המעורבת. חשוב להכיר את הספקטרום המלא, מתגובה קלה ועד תגובה מסכנת חיים:
          </p>

          <SubSection title="תסמינים עוריים">
            <p>
              <strong className="text-foreground">אורטיקריה (חרלות):</strong> גבשושיות אדומות ומגרדות שמופיעות במהירות ויכולות לנדוד בגוף. <strong className="text-foreground">אגזמה:</strong> עור יבש, אדום ומגרד, בעיקר בקפלי המרפקים, הברכיים והפנים. <strong className="text-foreground">אנגיואדמה:</strong> נפיחות עמוקה יותר, בעיקר בשפתיים, עפעפיים וגרון.
            </p>
          </SubSection>

          <SubSection title="תסמינים נשימתיים">
            <p>
              נזלת, גודש באף, עיטוש חוזר, דמעות ועיניים מגרדות (נזלת אלרגית). שיעול כרוני, צפצופים וקוצר נשימה (אסתמה אלרגית). תסמינים אלו מחמירים בעונות מעבר, בסביבה מאובקת או ליד חיות מחמד.
            </p>
          </SubSection>

          <SubSection title="תסמינים עיכוליים">
            <p>
              בחילות, הקאות, כאבי בטן, שלשול. באלרגיות מסוג FPIES (תסמונת דלקתית לא-IgE) – הקאות חמורות 2-4 שעות אחרי החשיפה, לפעמים עם ירידה בלחץ דם. חשוב להבדיל מאי-סבילות למזון שגורמת לתסמינים דומים אך קלים יותר.
            </p>
          </SubSection>

          <SubSection title="אנפילקסיס – תגובה מערכתית חמורה">
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5">
              <p className="text-foreground font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                סימני אנפילקסיס – פנו מיד לעזרה רפואית:
              </p>
              <ul className="space-y-2">
                {anaphylaxisSigns.map((sign) => (
                  <li key={sign} className="flex items-start gap-2 text-sm">
                    <span className="text-destructive mt-0.5 flex-shrink-0">•</span>
                    <span className="text-muted-foreground">{sign}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SubSection>
        </Section>

        {/* ── CTA mid-article ── */}
        <ArticleCTA variant="inline" />

        {/* ── 4. אבחון ── */}
        <Section id="diagnosis" icon={FlaskConical} title="שיטות אבחון אלרגיה">
          <p>
            אבחון מדויק הוא הבסיס לטיפול נכון. אלרגולוג מומחה משלב מספר כלי אבחון כדי להגיע לתמונה ברורה. חשוב להבין: <strong className="text-foreground">אין בדיקה אחת שמספיקה</strong> – האבחנה תמיד משלבת היסטוריה רפואית מפורטת עם בדיקות מעבדתיות.
          </p>

          <div className="space-y-4 mt-4">
            {diagnosticMethods.map((method, i) => (
              <motion.div
                key={method.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <InfoCard>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{method.name}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{method.desc}</p>
                  {method.link && (
                    <Link
                      to={method.link}
                      className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3 hover:underline"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      {method.linkLabel}
                    </Link>
                  )}
                </InfoCard>
              </motion.div>
            ))}
          </div>

          <SubSection title="חשוב לדעת: תוצאה חיובית ≠ אלרגיה">
            <InfoCard variant="warm">
              <p className="text-muted-foreground text-sm leading-relaxed">
                אחת הטעויות הנפוצות ביותר היא פרשנות עצמאית של תוצאות בדיקות. בדיקת דם חיובית או תבחין עור חיובי לא בהכרח אומרים שיש אלרגיה קלינית. כ-50% מהתוצאות החיוביות הן ״רגישות״ ללא משמעות קלינית. רק אלרגולוג מומחה יכול לפרש נכון את התוצאות בהקשר הסיפור הרפואי.{" "}
                <Link to="/knowledge/בדיקה-חיובית-בלי-תסמינים" className="text-primary font-medium hover:underline">
                  קראו עוד: בדיקה חיובית בלי תסמינים
                </Link>
              </p>
            </InfoCard>
          </SubSection>
        </Section>

        {/* ── 5. טיפול ── */}
        <Section id="treatment" icon={Stethoscope} title="אפשרויות טיפול באלרגיה">
          <p>
            הטיפול באלרגיה התקדם דרמטית בשני העשורים האחרונים. היום יש לנו כלים שלא רק מקלים על תסמינים, אלא יכולים <strong className="text-foreground">לשנות את מהלך המחלה</strong>:
          </p>

          <div className="space-y-4 mt-4">
            {treatmentApproaches.map((approach, i) => (
              <motion.div
                key={approach.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <InfoCard>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{approach.name}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{approach.desc}</p>
                </InfoCard>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── 6. חירום ── */}
        <Section id="emergency" icon={ShieldCheck} title="ניהול מצבי חירום – אנפילקסיס">
          <p>
            אנפילקסיס היא תגובה אלרגית חמורה ומהירה שיכולה להתפתח תוך דקות. <strong className="text-foreground">הכרת פרוטוקול החירום יכולה להציל חיים.</strong>
          </p>

          <div className="space-y-3 mt-4">
            {emergencySteps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border/60"
              >
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {step.step}
                </span>
                <div>
                  <p className="font-semibold text-foreground text-sm">{step.title}</p>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <InfoCard variant="warm">
            <p className="text-foreground font-medium mb-2">כלל זהב:</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              עדיף להזריק אפיפן ולגלות בדיעבד שלא היה צורך, מאשר לא להזריק כשהיה צורך. אפיפן הוא תרופה בטוחה עם תופעות לוואי מינימליות. אל תהססו.{" "}
              <Link to="/knowledge/אפיפן-בגן-מי-אחראי" className="text-primary font-medium hover:underline">
                מי אחראי על אפיפן בגן?
              </Link>
            </p>
          </InfoCard>
        </Section>

        {/* ── 7. מניעה ── */}
        <Section id="prevention" icon={Baby} title="מניעת אלרגיה – הגישה המודרנית">
          <p>
            המהפכה הגדולה ביותר בתחום האלרגולוגיה בעשור האחרון היא <strong className="text-foreground">המעבר מהימנעות לחשיפה מוקדמת</strong>. המחקר המדעי הוכיח באופן חד-משמעי שחשיפה מוקדמת לאלרגנים מפחיתה דרמטית את הסיכון לפתח אלרגיה.
          </p>

          <SubSection title="עקרונות המניעה">
            <p>
              <strong className="text-foreground">חשיפה מוקדמת:</strong> התחלת חשיפה לאלרגנים נפוצים (בוטנים, שומשום, ביצים) מגיל 4-6 חודשים. מחקר LEAP הוכיח הפחתה של 80% באלרגיה לבוטנים.{" "}
              <Link to="/guides/טעימות-ראשונות-אלרגנים" className="text-primary font-medium hover:underline">
                קראו את המדריך המלא לטעימות ראשונות
              </Link>.
            </p>
            <p>
              <strong className="text-foreground">עקביות:</strong> לא מספיק להחשיף פעם אחת. חשיפה קבועה (2-3 פעמים בשבוע) נדרשת לבניית סבילות. הפסקת החשיפה עלולה לגרום לאובדן הסבילות.
            </p>
            <p>
              <strong className="text-foreground">הנקה:</strong> הנקה אינה מונעת אלרגיה, אך גם אינה מגבירה סיכון. אין צורך בדיאטה מיוחדת לאם המניקה, אלא אם כן יש עדות לתגובה אצל התינוק.
            </p>
            <p>
              <strong className="text-foreground">טיפוח עור:</strong> שמירה על שלמות מחסום העור בתינוקות (שימוש קבוע בשמן/קרם לחות) עשויה להפחית את הסיכון לאגזמה ובעקבותיה – לאלרגיה למזון.
            </p>
          </SubSection>
        </Section>

        {/* ── 8. אלרגיה בילדים ── */}
        <Section id="children" icon={Users} title="אלרגיה בילדים – אתגרים ייחודיים">
          <p>
            ילדים הם האוכלוסייה הנפוצה ביותר להתפתחות אלרגיות חדשות. ניהול אלרגיה בילדים דורש גישה מותאמת לגיל, שיתוף פעולה עם המסגרת החינוכית, והעצמה הדרגתית של הילד.
          </p>

          <div className="space-y-4 mt-4">
            {childrenSpecial.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <InfoCard>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  <Link
                    to={item.link}
                    className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3 hover:underline"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    {item.linkLabel}
                  </Link>
                </InfoCard>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── 9. חיים עם אלרגיה ── */}
        <Section id="living-with-allergy" icon={Heart} title="חיים מלאים עם אלרגיה">
          <p>
            אלרגיה אינה גזר דין. עם אבחון מדויק, טיפול נכון, ומערכת תמיכה טובה – אפשר לחיות חיים מלאים, פעילים ושמחים. הנה כמה עקרונות מנחים:
          </p>

          <SubSection title="ניהול יומיומי">
            <p>
              <strong className="text-foreground">קריאת תוויות:</strong> בישראל חל חוק סימון אלרגנים (14 האלרגנים העיקריים). למדו לזהות שמות חלופיים – למשל, ״קזאין״ ו״מי גבינה״ הם מרכיבי חלב. בדקו תוויות בכל פעם, גם במוצרים מוכרים – הרכב יכול להשתנות.
            </p>
            <p>
              <strong className="text-foreground">אכילה מחוץ לבית:</strong> הכינו כרטיס אלרגיה (בעברית ובאנגלית) שמפרט את האלרגנים. בקשו לדבר עם השף/מנהל. אל תתביישו לשאול – זה עניין של בטיחות. מסעדות מחויבות לספק מידע על אלרגנים.
            </p>
            <p>
              <strong className="text-foreground">נסיעות:</strong> הכינו ערכת חירום כפולה, אישור רפואי באנגלית, ורשימת בתי חולים במקום היעד. בטיסה – הודיעו לחברת התעופה מראש ובקשו להימנע מהגשת האלרגן.
            </p>
          </SubSection>

          <SubSection title="ההיבט הרגשי">
            <p>
              חרדה היא חלק טבעי מהחוויה של חיים עם אלרגיה, במיוחד אצל הורים לילדים אלרגיים. חשוב לשמור על איזון: ערנות בלי פחד משתק. אם החרדה משפיעה על איכות החיים – פנו לייעוץ מקצועי. אתם לא לבד.
            </p>
          </SubSection>
        </Section>

        {/* ── 10. מתי לפנות לרופא ── */}
        <Section id="when-see-doctor" icon={Stethoscope} title="מתי חייבים לפנות לאלרגולוג?">
          <p>
            רופא ילדים או רופא משפחה מטפל היטב במצבים אלרגיים רבים. עם זאת, יש מצבים שבהם נדרשת מומחיות של אלרגולוג:
          </p>

          <div className="bg-card rounded-2xl border border-border/60 p-5 mt-4">
            <ul className="space-y-3">
              {[
                "תגובה אלרגית חמורה (אנפילקסיס) – גם אם הייתה פעם אחת",
                "חשד לאלרגיה למזון שטרם אובחנה",
                "אגזמה חמורה שלא מגיבה לטיפול",
                "אסתמה שלא מאוזנת למרות טיפול",
                "תגובות חוזרות לתרופות",
                "צורך באישור רפואי למסגרת חינוכית או לפני ניתוח",
                "שאלות לגבי חשיפה מוקדמת לאלרגנים בתינוקות בסיכון",
                "רצון לבצע אימונותרפיה (חיסוני אלרגיה)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <ArticleCTA variant="inline" />
          </div>
        </Section>

        {/* ── FAQ ── */}
        <section className="mb-14 pt-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">שאלות נפוצות על אלרגיה</h2>
          <FAQAccordion items={faqs} />
        </section>

        {/* ── CTA ── */}
        <ArticleCTA variant="section" />

        {/* ── Related guides ── */}
        <section className="mt-14">
          <h2 className="text-xl font-bold text-foreground mb-5">מדריכים נוספים</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedGuides.map((guide) => (
              <Link
                key={guide.to}
                to={guide.to}
                className="bg-card rounded-2xl p-5 border border-border/60 card-hover group"
              >
                <span className="text-xs text-primary font-medium">{guide.tag}</span>
                <h3 className="text-base font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">
                  {guide.label}
                </h3>
                <span className="flex items-center gap-1 text-sm text-primary mt-3">
                  <ArrowRight className="w-3.5 h-3.5" />
                  קרא עוד
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Author + disclaimer ── */}
        <div className="mt-14 space-y-6">
          <AuthorBadge />
          <div className="bg-surface rounded-2xl p-5 border border-border/40 text-xs text-muted-foreground leading-relaxed">
            <p className="mb-2">
              <strong className="text-foreground">הבהרה רפואית:</strong> המידע בעמוד זה נועד לצרכי הסברה בלבד ואינו מהווה תחליף לייעוץ רפואי מקצועי. כל מקרה של חשד לאלרגיה מחייב הערכה אישית על ידי רופא מומחה.
            </p>
            <p>
              תוכן זה נכתב ונסקר רפואית על ידי ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה לילדים ומבוגרים. עודכן: פברואר 2026.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AllergyPillar;
