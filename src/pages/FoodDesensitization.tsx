import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ShieldCheck,
  Stethoscope,
  Award,
  ClipboardCheck,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  Calendar,
  ListChecks,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
} from "@/utils/medicalSchema";
import drAnnaImage from "@/assets/dr-anna-brameli.png.asset.json";
import desensitizationImage from "@/assets/desensitization-dr-brameli.webp.asset.json";
import desensitizationConsultImage from "@/assets/dr-anna-brameli-desensitization.webp.asset.json";
import foodAllergyImage from "@/assets/dr-anna-brameli-food-allergy.webp.asset.json";
import { UrgencyPopup } from "@/components/marketing/UrgencyPopup";

const CANONICAL = "https://ihaveallergy.com/food-desensitization";
const CLINIC_ADDRESS = "יגאל אלון 82, בניין סוזוקי, קומה 4, תל אביב";
// TODO: לוודא עקביות כתובת בפוטר, בדף צור קשר, בסכמה וב-Google Business Profile.

const trustStrip = [
  "מומחית לאלרגיה ואימונולוגיה קלינית",
  "רופאה בכירה במרכז שניידר לרפואת ילדים",
  "בוגרת תת-התמחות ב-Vanderbilt University Medical Center",
  "ייעוץ פרטי בתל אביב",
];

const heroBullets = [
  "ייעוץ פרטי לילדים ומבוגרים עם אלרגיה למזון",
  "הערכת התאמה לפני תהליך דה-סנסיטיזציה",
  "הסבר ברור על סיכונים, מגבלות ואפשרויות המשך",
  `מרפאה בתל אביב, ${CLINIC_ADDRESS}`,
];

const inMeeting = [
  "סקירת תגובות קודמות ובדיקות קיימות",
  "הערכת רמת הסיכון",
  "הסבר על ההבדל בין תגר, חשיפה ודה-סנסיטיזציה",
  "המלצה ברורה להמשך בירור או טיפול",
];

const painCards = [
  {
    icon: ClipboardCheck,
    title: "האם הילד בכלל מתאים?",
    desc: "התאמה תלויה בסוג המזון, חומרת התגובות, בדיקות קודמות, גיל, אסתמה ומחלות רקע נוספות.",
  },
  {
    icon: Stethoscope,
    title: "מה אפשר לעשות בקליניקה פרטית?",
    desc: "ניתן לבצע ייעוץ, אבחון התאמה, מעבר על בדיקות והכוונה להמשך. חלק מהשלבים הטיפוליים עשויים לדרוש מסגרת רפואית ייעודית.",
  },
  {
    icon: AlertTriangle,
    title: "מה לא עושים לבד?",
    desc: "לא מתחילים לתת לילד כמויות קטנות של מזון אלרגני בבית ללא הנחיה רפואית אישית.",
  },
];

const meetingTopics = [
  "מה הייתה התגובה האלרגית ומתי הופיעה",
  "לאיזה מזון קיימת אלרגיה או חשד לאלרגיה",
  "האם היו תגובות נשימתיות, נפיחות, הקאות או תגובות מערכתיות",
  "האם יש אסתמה, אטופיק דרמטיטיס או מחלות רקע",
  "אילו בדיקות כבר בוצעו",
  "האם יש צורך בבדיקות נוספות",
  "האם יש מקום לשקול תגר מזון או דה-סנסיטיזציה",
  "מה המשפחה צריכה לעשות עכשיו באופן בטוח",
];

const fitCards = [
  {
    title: "להורים לילד עם אלרגיה ידועה למזון",
    desc: "חלב, ביצים, בוטנים, שומשום, אגוזים או מזונות אחרים. הפגישה עוזרת להבין האם יש מקום לשקול בירור נוסף או תהליך טיפולי מתאים.",
  },
  {
    title: "להורים ששמעו על דה-סנסיטיזציה ורוצים להבין אם זה מתאים",
    desc: "לא כל ילד מתאים לתהליך, ולא כל חשיפה צריכה להתחיל מיד. הייעוץ נועד לעשות סדר בין מידע כללי לבין החלטה רפואית אישית.",
  },
  {
    title: "למי שצריך חוות דעת לפני המשך טיפול",
    desc: "אם אתם לפני פנייה לבית חולים, מרכז ייעודי או תהליך חשיפה מבוקרת, ניתן להגיע עם בדיקות ומסמכים כדי לקבל הכוונה מקצועית להמשך.",
  },
];

const benefits = [
  {
    icon: Clock,
    title: "זמן להבין את כל התמונה",
    desc: "מעבר מסודר על תגובות, בדיקות, מסמכים, מחלות רקע ושאלות ההורים.",
  },
  {
    icon: ClipboardCheck,
    title: "החלטה רפואית ולא ניחוש",
    desc: "הפגישה מתמקדת בשאלה האם יש התאמה אמיתית להמשך בירור או טיפול.",
  },
  {
    icon: MessageSquare,
    title: "הסבר ברור להורים",
    desc: "מה מותר, מה אסור, מה דורש השגחה, ומה לא כדאי לנסות בבית.",
  },
  {
    icon: HeartHandshake,
    title: "הכוונה לשלב הבא",
    desc: "בסיום הייעוץ תקבלו כיוון ברור יותר: בדיקות נוספות, מעקב, תגר, או פנייה למסגרת רפואית מתאימה.",
  },
];

const topics = [
  "אלרגיה לחלב",
  "אלרגיה לביצים",
  "אלרגיה לבוטנים",
  "אלרגיה לשומשום",
  "אלרגיה לאגוזים",
  "אלרגיה למזון בילדים",
  "חשיפה אקראית למזון אלרגני",
  "תגר מזון",
  "אימונותרפיה פומית",
  "דה-סנסיטיזציה למזון",
  "חוות דעת שנייה באלרגיה",
  "ייעוץ אלרגולוג פרטי",
];

const whatToBring = [
  "תוצאות תבחיני עור, אם בוצעו",
  "בדיקות דם רלוונטיות, כולל IgE ספציפי אם קיים",
  "סיכומי ביקור קודמים",
  "סיכום מיון, אם הייתה תגובה משמעותית",
  "פירוט המזון שגרם לתגובה",
  "תיאור התגובה וזמן הופעתה",
  "מידע על אסתמה או אטופיק דרמטיטיס",
  "רשימת תרופות קבועות",
  "מזרק אפינפרין, אם נרשם בעבר",
];

const faqs = [
  {
    question: "האם ד״ר אנה ברמלי מבצעת דה-סנסיטיזציה למזון?",
    answer:
      "העמוד עוסק בייעוץ פרטי, אבחון התאמה והכוונה רפואית בנושא דה-סנסיטיזציה למזון. לאחר הערכה רפואית ניתן להבין האם יש מקום לשקול תהליך כזה, ומהי המסגרת המתאימה והבטוחה להמשך.",
  },
  {
    question: "האם דה-סנסיטיזציה מרפאת אלרגיה למזון?",
    answer:
      "ברוב המקרים לא נכון להציג דה-סנסיטיזציה כריפוי מלא. המטרה היא להפחית רגישות ולהעלות את סף התגובה, ולעיתים להפחית סיכון מחשיפה אקראית. לרוב נדרשת המשך צריכה עקבית לפי הנחיות רפואיות כדי לשמר את ההגנה.",
  },
  {
    question: "האם אפשר להתחיל לתת בבית כמויות קטנות של המזון האלרגני?",
    answer:
      "לא. אין להתחיל חשיפה יזומה למזון אלרגני בבית ללא הנחיה רפואית אישית. חשיפה לא מבוקרת עלולה לגרום לתגובה אלרגית משמעותית.",
  },
  {
    question: "מה ההבדל בין ייעוץ פרטי לבין הטיפול עצמו?",
    answer:
      "בייעוץ פרטי ניתן להעריך התאמה, לעבור על בדיקות, להבין את רמת הסיכון ולקבל המלצה להמשך. שלבי חשיפה, תגר או העלאת מינון עשויים לדרוש בית חולים או מרכז רפואי ייעודי, בהתאם למקרה.",
  },
  {
    question: "למי הייעוץ מתאים?",
    answer:
      "הייעוץ מתאים להורים לילדים עם אלרגיה ידועה או חשד לאלרגיה למזון, למי ששוקלים דה-סנסיטיזציה, ולמי שרוצים חוות דעת מקצועית לפני המשך בירור או טיפול.",
  },
  {
    question: "האם צריך בדיקות לפני שמגיעים?",
    answer:
      "לא תמיד. אם יש בדיקות קודמות, מומלץ להביא אותן. בפגישה יוחלט האם יש צורך בבירור נוסף.",
  },
  {
    question: "האם אפשר לקבל החזר מביטוח פרטי?",
    answer:
      "ייתכן שבחלק מהמקרים קיימת אפשרות להחזר עבור ייעוץ פרטי, בהתאם לתנאי הפוליסה. יש לבדוק זאת מול חברת הביטוח.",
  },
];

const physicianSchema = {
  "@context": "https://schema.org",
  "@type": "Physician",
  name: "ד״ר אנה ברמלי",
  medicalSpecialty: "Allergy and Immunology",
  description:
    "מומחית לאלרגיה ואימונולוגיה קלינית, רופאה בכירה במחלקת אלרגיה ואימונולוגיה במרכז שניידר לרפואת ילדים, מעניקה ייעוץ פרטי בנושא אלרגיה למזון ודה-סנסיטיזציה.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "יגאל אלון 82, בניין סוזוקי, קומה 4",
    addressLocality: "תל אביב",
    addressCountry: "IL",
  },
  areaServed: ["תל אביב", "גוש דן", "המרכז", "השרון", "ישראל"],
  availableService: [
    { "@type": "MedicalProcedure", name: "ייעוץ אלרגיה למזון" },
    { "@type": "MedicalProcedure", name: "הערכת התאמה לדה-סנסיטיזציה" },
    { "@type": "MedicalProcedure", name: "ייעוץ אלרגולוג פרטי" },
    { "@type": "MedicalProcedure", name: "חוות דעת באלרגיה למזון" },
  ],
  url: CANONICAL,
};

const FoodDesensitization = () => {
  const faqSchema = buildFaqSchema(faqs);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "ראשי", item: "https://ihaveallergy.com/" },
    { name: "ייעוץ פרטי לדה-סנסיטיזציה למזון" },
  ]);

  return (
    <>
      <Helmet>
        <title>ייעוץ פרטי לדה-סנסיטיזציה למזון | ד״ר אנה ברמלי</title>
        <meta
          name="description"
          content="הילד אלרגי למזון? קבעו ייעוץ פרטי עם ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה קלינית, לבדיקת התאמה והכוונה בנושא דה-סנסיטיזציה למזון בתל אביב."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        <meta
          property="og:title"
          content="ייעוץ פרטי לדה-סנסיטיזציה למזון | ד״ר אנה ברמלי"
        />
        <meta
          property="og:description"
          content="קביעת ייעוץ התאמה עם מומחית לאלרגיה ואימונולוגיה קלינית, רופאה בכירה בשניידר. מרפאה בתל אביב."
        />
        <meta property="og:image" content="https://ihaveallergy.com/og-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(physicianSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="gradient-hero py-12 md:py-20">
        <div className="container-medical">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
          >
            <Link to="/" className="hover:text-foreground transition-colors">
              ראשי
            </Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-foreground">ייעוץ דה-סנסיטיזציה למזון</span>
          </nav>

          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 items-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full mb-5">
                ייעוץ פרטי לאלרגיה למזון ודה-סנסיטיזציה
              </span>
              <h1 className="font-bold text-foreground mb-5 text-balance text-3xl md:text-4xl lg:text-5xl leading-tight">
                הילד אלרגי למזון? לפני דה-סנסיטיזציה, בודקים התאמה עם מומחית
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
                ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה קלינית, רופאה בכירה
                במחלקת אלרגיה ואימונולוגיה במרכז שניידר לרפואת ילדים, ובוגרת
                תת-התמחות ב-Vanderbilt University Medical Center, מעניקה ייעוץ
                פרטי להורים ולמטופלים עם אלרגיה למזון, כולל הערכת התאמה והכוונה
                רפואית לפני תהליך דה-סנסיטיזציה.
              </p>

              <ul className="space-y-2.5 mb-7">
                {heroBullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm md:text-base">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{b}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Button asChild size="lg" className="rounded-full">
                  <Link to="/book">קביעת תור לייעוץ התאמה</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link to="/contact">השאירו פרטים ונחזור אליכם</Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                הייעוץ נועד להבין האם דה-סנסיטיזציה רלוונטית, ומהו הצעד הרפואי
                הבטוח הבא.
              </p>

              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-sm text-foreground flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <span>
                  אין להתחיל חשיפה יזומה למזון אלרגני בבית ללא הנחיה רפואית
                  אישית.
                </span>
              </div>
            </motion.div>

            {/* Side card */}
            <motion.aside
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm lg:sticky lg:top-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={drAnnaImage.url}
                  alt="ד״ר אנה ברמלי"
                  className="w-14 h-14 rounded-full object-cover"
                  loading="eager"
                />
                <div>
                  <div className="font-semibold text-foreground">ד״ר אנה ברמלי</div>
                  <div className="text-xs text-muted-foreground">
                    מומחית לאלרגיה ואימונולוגיה קלינית
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-foreground mb-3">
                מה תקבלו בפגישה?
              </h2>
              <ul className="space-y-2.5 mb-5">
                {inMeeting.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Button asChild className="w-full rounded-full">
                <Link to="/book">לתיאום פגישת ייעוץ</Link>
              </Button>

              <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{CLINIC_ADDRESS}</span>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border/40 bg-card/50">
        <div className="container-medical py-6">
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustStrip.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="container-medical max-w-5xl py-12 md:py-16 space-y-16">
        {/* Conversion Answer Block */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface-warm border border-border/40 rounded-3xl p-6 md:p-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            רופא פרטי לדה-סנסיטיזציה למזון: מה באמת צריך לבדוק?
          </h2>
          <div className="text-muted-foreground leading-relaxed space-y-4 mb-6">
            <p>
              כאשר מחפשים רופא פרטי בנושא דה-סנסיטיזציה למזון, חשוב להבין שהשלב
              הראשון הוא לא התחלת חשיפה, אלא בדיקת התאמה רפואית. דה-סנסיטיזציה
              היא תהליך הדרגתי ומבוקר, שאינו מתאים לכל ילד, ודורש הערכה מקצועית
              של סוג האלרגיה, חומרת התגובות, בדיקות קודמות ומחלות רקע כמו
              אסתמה.
            </p>
            <p>
              ד״ר אנה ברמלי מעניקה ייעוץ פרטי שמטרתו לעשות סדר: האם יש מקום
              לשקול דה-סנסיטיזציה, אילו בדיקות חסרות, מה דורש מסגרת רפואית
              ייעודית, ומהו הצעד הבא הנכון לילד.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full">
            <Link to="/book">קביעת ייעוץ התאמה</Link>
          </Button>
        </motion.section>

        {/* Pain section */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            כשאלרגיה למזון מנהלת את הבית, צריך תשובה רפואית ברורה
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8 max-w-3xl">
            הורים לילדים עם אלרגיה למזון חיים לעיתים סביב חשש קבוע: מה יקרה
            בגן, בבית הספר, במסעדה, ביום הולדת או בחשיפה אקראית. דה-סנסיטיזציה
            למזון יכולה להישמע כמו פתרון, אבל לפני שמתקדמים צריך להבין האם היא
            בכלל מתאימה לילד שלכם. בפגישה עם ד״ר ברמלי תקבלו הערכה מסודרת, בלי
            הבטחות לא מבוססות ובלי התחלת חשיפה מסוכנת בבית.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {painCards.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border/60 rounded-2xl p-6"
              >
                <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {c.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Service focus */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-accent/40 border border-border/40 rounded-3xl p-6 md:p-10"
        >
          <span className="inline-block text-xs font-medium text-primary bg-card px-3 py-1 rounded-full mb-4">
            ייעוץ התאמה ממוקד
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            פגישה פרטית שמטרתה לקבל החלטה בטוחה יותר
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            במקום להישאר עם מידע כללי מהאינטרנט, הפגישה נועדה להפוך את הסיפור
            הרפואי של הילד להחלטה ברורה יותר: האם להמשיך בבירור, האם לשקול תגר
            מזון, האם דה-סנסיטיזציה רלוונטית, ומה דורש מסגרת רפואית מתאימה.
          </p>
          <ul className="grid md:grid-cols-2 gap-3 mb-7">
            {meetingTopics.map((t) => (
              <li
                key={t}
                className="flex items-start gap-3 bg-card border border-border/40 rounded-xl p-4 text-sm text-foreground"
              >
                <ListChecks className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="rounded-full">
            <Link to="/book">רוצה לבדוק התאמה? קבעו תור</Link>
          </Button>
        </motion.section>

        {/* Fit */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            למי הייעוץ מתאים?
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {fitCards.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border/60 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {c.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Insurance */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border/60 rounded-3xl p-6 md:p-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            יש ביטוח פרטי? כדאי לבדוק אפשרות להחזר
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-5 max-w-3xl">
            בחלק מהמקרים ניתן לבדוק אפשרות להחזר עבור ייעוץ פרטי, בהתאם לתנאי
            הפוליסה ולחברת הביטוח. אין התחייבות להחזר, אך מומלץ לבדוק מראש מול
            חברת הביטוח.
          </p>
          <Button asChild className="rounded-full" variant="outline">
            <Link to="/contact">השאירו פרטים לתיאום ייעוץ</Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            המרפאה אינה מתחייבת להחזר. הזכאות נקבעת לפי תנאי הפוליסה האישית.
          </p>
        </motion.section>

        {/* Benefits */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            היתרונות של ייעוץ פרטי ממוקד לפני החלטה
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border/60 rounded-2xl p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {b.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {b.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Topics */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-5">
            נושאים נפוצים לייעוץ
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {topics.map((t) => (
              <span
                key={t}
                className="px-4 py-2 rounded-full bg-card border border-border/60 text-sm text-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </motion.section>

        {/* About */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-[180px_1fr] gap-6 items-start"
        >
          <img
            src={drAnnaImage.url}
            alt="ד״ר אנה ברמלי"
            className="w-40 h-40 rounded-2xl object-cover"
            loading="lazy"
          />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              אודות ד״ר אנה ברמלי
            </h2>
            <div className="text-muted-foreground leading-relaxed space-y-4 mb-5">
              <p>
                ד״ר אנה ברמלי היא מומחית לאלרגיה ואימונולוגיה קלינית, רופאה
                בכירה במחלקת אלרגיה ואימונולוגיה במרכז שניידר לרפואת ילדים,
                ובוגרת תת-התמחות ב-Vanderbilt University Medical Center.
              </p>
              <p>
                במרפאה הפרטית בתל אביב ד״ר ברמלי מעניקה ייעוץ לילדים ומבוגרים
                עם אלרגיות, כולל אלרגיות מזון, אסתמה, אטופיק דרמטיטיס ונושאים
                נוספים בתחום האלרגיה והאימונולוגיה. הגישה הרפואית משלבת מומחיות
                קלינית, זהירות, הסבר ברור להורים והכוונה מעשית להמשך.
              </p>
            </div>
            <ul className="space-y-2">
              {trustStrip.map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* What to bring */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-5">
            מה כדאי להביא לפגישה?
          </h2>
          <ul className="grid md:grid-cols-2 gap-3">
            {whatToBring.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 bg-card border border-border/40 rounded-xl p-4 text-sm text-foreground"
              >
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-5">
            שאלות נפוצות
          </h2>
          <FAQAccordion items={faqs} />
        </motion.section>

        {/* Bottom CTA */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent to-surface-warm border border-border/40 p-8 md:p-12 text-center"
        >
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-balance">
            רוצים לדעת אם דה-סנסיטיזציה רלוונטית לילד שלכם?
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-7">
            קבעו פגישת ייעוץ עם ד״ר אנה ברמלי וקבלו הערכה רפואית מסודרת, הסבר
            ברור והכוונה בטוחה להמשך.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/book">קביעת תור לייעוץ התאמה</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link to="/contact">השאירו פרטים ונחזור אליכם</Link>
            </Button>
          </div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mb-4">
            <MapPin className="w-4 h-4" />
            {CLINIC_ADDRESS}
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            המידע בעמוד אינו מחליף ייעוץ רפואי אישי. במקרה של תגובה אלרגית
            חריפה או חשד לאנפילקסיס, יש לפנות מיד לטיפול רפואי דחוף.
          </p>
        </motion.section>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-card/95 backdrop-blur border-t border-border/60 p-3 flex gap-2">
        <Button asChild className="flex-1 rounded-full">
          <Link to="/book">
            <Calendar className="w-4 h-4 ms-1" />
            קביעת תור
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 rounded-full">
          <Link to="/contact">השארת פרטים</Link>
        </Button>
      </div>

      <UrgencyPopup ctaHref="/book" />
    </>
  );
};

export default FoodDesensitization;
