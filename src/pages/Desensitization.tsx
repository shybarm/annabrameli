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
  ArrowLeft,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthorBadge } from "@/components/blog/AuthorBadge";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import {
  buildMedicalPageSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
} from "@/utils/medicalSchema";
import drAnnaConsultation from "@/assets/dr-anna-brameli-consultation.png.asset.json";

const CANONICAL = "https://ihaveallergy.com/desensitization";
const CLINIC_ADDRESS = "יגאל אלון 82, בניין סוזוקי, קומה 4, תל אביב";

const trustPoints = [
  "ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה קלינית",
  "רופאה בכירה במחלקת אלרגיה ואימונולוגיה במרכז שניידר לרפואת ילדים",
  "בוגרת תת-התמחות ב-Vanderbilt University Medical Center",
  "ייעוץ התאמה רפואי לפני תהליך דה-סנסיטיזציה למזון",
  `מרפאה בתל אביב, ${CLINIC_ADDRESS.split(",").slice(0, 2).join(",").trim()}`,
];

const valueCards = [
  {
    icon: Stethoscope,
    title: "ניסיון קליני באלרגיה בילדים",
    desc: "הייעוץ ניתן על ידי מומחית העוסקת באבחון וטיפול באלרגיות בילדים, כולל אלרגיות למזון.",
  },
  {
    icon: Award,
    title: "רקע מקצועי בינלאומי",
    desc: "ד״ר ברמלי היא בוגרת תת-התמחות ב-Vanderbilt University Medical Center, מרכז רפואי אקדמי מוביל בארצות הברית.",
  },
  {
    icon: ClipboardCheck,
    title: "הערכת התאמה זהירה",
    desc: "דה-סנסיטיזציה למזון אינה מתאימה לכל ילד. ההחלטה מתחילה בהבנת ההיסטוריה הרפואית, חומרת התגובות, בדיקות קודמות ומחלות רקע.",
  },
  {
    icon: MessageSquare,
    title: "שיחה ברורה להורים",
    desc: "המטרה היא לא רק לתת המלצה, אלא להסביר את האפשרויות, הסיכונים, המגבלות והצעדים הבטוחים להמשך.",
  },
];

const evaluationItems = [
  "סוג המזון האלרגני וההיסטוריה של התגובות אליו",
  "חומרת האירועים הקודמים, כולל שימוש באפיפן או פניות למיון",
  "תוצאות של תבחיני עור, IgE ספציפי ובדיקות מולקולריות",
  "מחלות רקע כמו אסתמה, אגזמה או נזלת אלרגית",
  "יכולת המשפחה להתחייב למעקב רפואי ממושך ומבוקר",
];

const faqs = [
  {
    question: "מהי דה-סנסיטיזציה למזון (OIT)?",
    answer:
      "דה-סנסיטיזציה למזון, או Oral Immunotherapy (OIT), היא פרוטוקול רפואי שבו המטופל צורך כמויות הולכות וגדלות של המזון האלרגני, תחת השגחה רפואית, במטרה להעלות את סף התגובה ולהקטין את הסיכון בחשיפה מקרית. התהליך נמשך לרוב חודשים עד שנים ומתבצע בליווי רפואי צמוד.",
  },
  {
    question: "האם דה-סנסיטיזציה מתאימה לכל ילד עם אלרגיה למזון?",
    answer:
      "לא. ההחלטה אם להתחיל בתהליך מתקבלת רק לאחר הערכה רפואית מסודרת. נשקלים סוג האלרגן, חומרת התגובות הקודמות, מחלות רקע כמו אסתמה לא מאוזנת, גיל הילד, ויכולת המשפחה להתחייב למעקב ארוך טווח. במקרים מסוימים יומלץ להמתין, להשלים בירור נוסף, או לבחור במסלול טיפולי אחר.",
  },
  {
    question: "מה כולל הייעוץ הראשוני?",
    answer:
      "פגישת הייעוץ כוללת סקירה של ההיסטוריה הרפואית, של תגובות אלרגיות קודמות ושל בדיקות שבוצעו, הסבר על המשמעות של האלרגיה הספציפית, דיון באפשרויות הטיפול הקיימות, ובחינה ראשונית האם יש מקום לשקול דה-סנסיטיזציה או בירור נוסף במסגרת רפואית מתאימה.",
  },
  {
    question: "האם אפשר להתחיל חשיפה למזון אלרגני בבית?",
    answer:
      "לא. אין להתחיל חשיפה יזומה למזון אלרגני בבית ללא הנחיה רפואית אישית. תהליך דה-סנסיטיזציה מבוצע אך ורק במסגרת רפואית מבוקרת, עם פרוטוקול מותאם אישית ועם זמינות לטיפול בתגובות אלרגיות במידת הצורך.",
  },
  {
    question: "מהם הסיכונים בתהליך?",
    answer:
      "כמו בכל תהליך רפואי, גם בדה-סנסיטיזציה קיימים סיכונים, ובהם תגובות אלרגיות במהלך הטיפול, החל מתסמינים קלים ועד תגובות חמורות הדורשות טיפול דחוף. הסיכונים נדונים בפירוט בפגישת הייעוץ, יחד עם דרכי המניעה והניטור הנהוגות בתהליך.",
  },
];

const Desensitization = () => {
  const faqSchema = buildFaqSchema(faqs);

  const articleSchema = buildMedicalPageSchema({
    headline:
      "דה-סנסיטיזציה למזון - ייעוץ התאמה רפואי | ד״ר אנה ברמלי",
    description:
      "ייעוץ התאמה לתהליך דה-סנסיטיזציה למזון (OIT) אצל ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה קלינית, רופאה בכירה בשניידר ובוגרת Vanderbilt University Medical Center. מרפאה בתל אביב.",
    datePublished: "2026-06-15",
    dateModified: "2026-06-15",
    canonicalUrl: CANONICAL,
    about: {
      "@type": "MedicalProcedure",
      name: "Oral Immunotherapy",
      alternateName: "דה-סנסיטיזציה למזון",
    },
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "ראשי", item: "https://ihaveallergy.com/" },
    { name: "דה-סנסיטיזציה למזון" },
  ]);

  return (
    <>
      <Helmet>
        <title>דה-סנסיטיזציה למזון - ייעוץ התאמה | ד״ר אנה ברמלי</title>
        <meta
          name="description"
          content="ייעוץ התאמה לתהליך דה-סנסיטיזציה למזון (OIT) אצל ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה קלינית. הערכה רפואית מסודרת לפני תחילת התהליך. מרפאה בתל אביב."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={CANONICAL} />
        <meta
          property="og:title"
          content="דה-סנסיטיזציה למזון - ייעוץ התאמה | ד״ר אנה ברמלי"
        />
        <meta
          property="og:description"
          content="ייעוץ התאמה לדה-סנסיטיזציה למזון (OIT) עם מומחית לאלרגיה ואימונולוגיה קלינית. מרפאה בתל אביב."
        />
        <meta property="og:image" content="https://ihaveallergy.com/og-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="דה-סנסיטיזציה למזון - ייעוץ התאמה | ד״ר אנה ברמלי"
        />
        <meta
          name="twitter:description"
          content="ייעוץ התאמה לדה-סנסיטיזציה למזון (OIT). הערכה רפואית מסודרת לפני תחילת התהליך."
        />
        <meta name="twitter:image" content="https://ihaveallergy.com/og-logo.png" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="gradient-hero py-14 md:py-20">
        <div className="container-medical max-w-3xl">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
          >
            <Link to="/" className="hover:text-foreground transition-colors">
              ראשי
            </Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-foreground">דה-סנסיטיזציה למזון</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full mb-5">
              ייעוץ התאמה רפואי
            </span>

            <h1 className="font-bold text-foreground mb-6 text-balance">
              דה-סנסיטיזציה למזון
              <span className="block text-primary mt-2 text-[22px] md:text-[28px] lg:text-[32px]">
                ייעוץ התאמה לפני תחילת התהליך
              </span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              הערכה רפואית מסודרת האם תהליך דה-סנסיטיזציה למזון (OIT) רלוונטי
              לילד שלכם, מהן האפשרויות והמגבלות, וכיצד מתבצע התהליך בצורה בטוחה.
            </p>

            <ul className="space-y-2.5 mb-8">
              {trustPoints.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm md:text-base">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{point}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/book">קביעת תור לייעוץ התאמה</Link>
              </Button>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                זמינות בתוך ימים
              </span>
            </div>

            <AuthorBadge compact />
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <div className="container-medical max-w-3xl py-12 md:py-16">
        {/* Why Dr. Anna */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-5">
            למה דווקא ד״ר אנה ברמלי?
          </h2>

          <img
            src={drAnnaConsultation.url}
            alt="ד״ר אנה ברמלי בייעוץ עם הורה וילד במרפאה"
            loading="lazy"
            className="w-full max-w-xl rounded-2xl object-cover mb-6"
          />

          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              כאשר מדובר בילד עם אלרגיה למזון, ההורים צריכים יותר מתשובה כללית.
              הם צריכים להבין מה באמת מסוכן, מה דורש בירור נוסף, מה לא כדאי
              לנסות לבד, ומהן האפשרויות הרפואיות הקיימות להמשך.
            </p>
            <p>
              ד״ר אנה ברמלי היא מומחית לאלרגיה ואימונולוגיה קלינית, רופאה
              בכירה במחלקת אלרגיה ואימונולוגיה במרכז שניידר לרפואת ילדים,
              ובוגרת תת-התמחות ב-Vanderbilt University Medical Center בארצות
              הברית.
            </p>
            <p>
              בפגישת הייעוץ תקבלו הערכה רפואית מסודרת, הסבר ברור על המשמעות
              של אלרגיה למזון, ובדיקה האם יש מקום לשקול דה-סנסיטיזציה או בירור
              נוסף במסגרת רפואית מתאימה.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            {valueCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border/60 rounded-2xl p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3">
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* What we check */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-5">
            מה בודקים לפני שמחליטים?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-5">
            ההחלטה האם להתחיל בתהליך דה-סנסיטיזציה אינה אוטומטית. בפגישת הייעוץ
            נבחנים יחד מספר היבטים מרכזיים:
          </p>
          <ul className="space-y-3 mb-6">
            {evaluationItems.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 bg-surface-warm border border-border/40 rounded-xl p-4"
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground text-sm md:text-base">{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            הניסיון הקליני של ד״ר ברמלי באלרגיה ואימונולוגיה בילדים מאפשר לבחון
            את המקרה בזהירות: לא רק לפי שם המזון שאליו הילד רגיש, אלא לפי דפוס
            התגובה, חומרת האירועים, תוצאות בדיקות קודמות, מחלות רקע כמו אסתמה,
            והיכולת של המשפחה לעמוד בתהליך ממושך ומבוקר.
          </p>
        </motion.section>

        {/* Safety note */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 md:p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  הערת בטיחות חשובה
                </h2>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  אין להתחיל חשיפה יזומה למזון אלרגני בבית ללא הנחיה רפואית
                  אישית. תהליך דה-סנסיטיזציה מבוצע אך ורק במסגרת רפואית
                  מבוקרת.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
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
          className="rounded-3xl bg-gradient-to-br from-accent to-surface-warm border border-border/40 p-6 md:p-10 text-center"
        >
          <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-balance">
            רוצים לבדוק האם דה-סנסיטיזציה למזון רלוונטית לילד שלכם?
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
            קבעו פגישת ייעוץ עם ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה
            קלינית, רופאה בכירה במחלקת אלרגיה ואימונולוגיה במרכז שניידר לרפואת
            ילדים, ובוגרת תת-התמחות ב-Vanderbilt University Medical Center.
          </p>

          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border/60 rounded-full px-4 py-2 mb-6">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{CLINIC_ADDRESS}</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/book" className="inline-flex items-center gap-2">
                קביעת תור לייעוץ התאמה
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground max-w-md">
              אין להתחיל חשיפה יזומה למזון אלרגני בבית ללא הנחיה רפואית אישית.
            </p>
          </div>
        </motion.section>
      </div>
    </>
  );
};

export default Desensitization;
