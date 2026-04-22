import { Helmet } from "react-helmet-async";
import { buildMedicalPageSchema, buildBreadcrumbSchema, buildFaqSchema } from "@/utils/medicalSchema";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { usePageContent } from "@/contexts/PageContentContext";
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  Baby,
  ShieldCheck,
  Heart,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthorBadge } from "@/components/blog/AuthorBadge";
import { ArticleCTA } from "@/components/blog/ArticleCTA";
import { FAQAccordion } from "@/components/ui/faq-accordion";

const WHATSAPP_URL =
  "https://wa.me/972545808008?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%99%D7%99%D7%A2%D7%95%D7%A5%20%D7%9C%D7%92%D7%91%D7%99%20%D7%98%D7%A2%D7%99%D7%9E%D7%95%D7%AA%20%D7%A8%D7%90%D7%A9%D7%95%D7%A0%D7%95%D7%AA";

const allergenTable = [
  {
    name: "במבה (בוטנים)",
    startAge: "4-6 חודשים",
    howToStart: "מחית במבה ברוטב / במבה ממוסמסת בחלב אם / תמ\"ל",
    firstAmount: "½ כפית",
    frequency: "3 פעמים בשבוע, באופן קבוע",
    notes: "מחקר LEAP הוכיח הפחתה של 80% באלרגיה",
  },
  {
    name: "טחינה (שומשום)",
    startAge: "4-6 חודשים",
    howToStart: "טחינה גולמית מדוללת עם מים / מעורבת במחית",
    firstAmount: "¼ כפית",
    frequency: "3 פעמים בשבוע",
    notes: "מחקר EAT תומך בחשיפה מוקדמת",
  },
  {
    name: "ביצה",
    startAge: "4-6 חודשים",
    howToStart: "ביצה קשה מרוסקת, מעורבת במחית ירקות",
    firstAmount: "¼ כפית חלמון מבושל",
    frequency: "2-3 פעמים בשבוע",
    notes: "להתחיל בחלמון, לעבור לביצה שלמה בהדרגה",
  },
  {
    name: "חלב פרה",
    startAge: "לאחר גיל שנה (כמשקה)",
    howToStart: "מוצרי חלב מבושלים (גבינה, יוגורט) – מגיל 6-9 חודשים",
    firstAmount: "כפית יוגורט",
    frequency: "יומיומי לאחר חשיפה מוצלחת",
    notes: "חלב פרה כמשקה – רק מגיל שנה",
  },
];

const normalReactions = [
  "סומק קל סביב הפה שחולף תוך 30-60 דקות",
  "יריקה או סלידה מהטעם החדש",
  "שלשול קל ביום הראשון",
  "פריחה עדינה באזור המגע שנעלמת מהר",
];

const alarmSigns = [
  "אורטיקריה (חרלות) – פריחה בולטת שמתפשטת מעבר לאזור המגע",
  "נפיחות בשפתיים, בלשון, בעיניים או בפנים",
  "הקאות חוזרות (לא יריקה בודדת)",
  "שיעול פתאומי, צפצופים, קשיי נשימה",
  "חיוורון חמור, רפיון, חוסר תגובה",
  "בכי מתמשך ולא ניתן להרגעה",
];

const emergencySteps = [
  { step: "1", title: "הפסיקו מיד את החשיפה למזון", desc: "הרחיקו את המזון מהתינוק" },
  { step: "2", title: "בדקו נשימה ומצב כללי", desc: "שימו לב לצפצופים, חיוורון, נפיחות" },
  { step: "3", title: "אם יש סימני מצוקה – התקשרו ל-101", desc: "אנפילקסיס דורש טיפול מיידי" },
  { step: "4", title: "אם התגובה קלה – צרו קשר עם רופא הילדים", desc: "תעדו מה אכל, כמה, ומה קרה" },
  { step: "5", title: "אל תנסו שוב ללא ייעוץ רפואי", desc: "אלרגולוג ילדים יקבע את הצעד הבא" },
];

const dontStartAloneCriteria = [
  "לתינוק יש אגזמה (אטופיק דרמטיטיס) בינונית עד חמורה",
  "אח/ות מאובחנים עם אלרגיה למזון",
  "תגובה קודמת לאחד מהמזונות",
  "ההורים חרדים ולא בטוחים – וזה בסדר גמור",
  "הרופא המטפל המליץ על ליווי אלרגולוג",
];

const faqs = [
  {
    question: "האם מותר לתת במבה בגיל 4 חודשים?",
    answer:
      "כן. לפי ההנחיות העדכניות של משרד הבריאות הישראלי ומחקר LEAP, מומלץ להתחיל חשיפה לבוטנים (כמו במבה) החל מגיל 4 חודשים, במיוחד לתינוקות בסיכון מוגבר. יש להתחיל בכמות קטנה ולוודא שהתינוק מוכן מבחינה התפתחותית (יושב בתמיכה, מגלה עניין באוכל).",
  },
  {
    question: "מה ההבדל בין תגובה רגילה לאלרגיה?",
    answer:
      "תגובה רגילה: סומק קל סביב הפה שחולף תוך שעה, סלידה מהטעם, או שלשול קל. אלרגיה: פריחה מפושטת (חרלות), נפיחות בשפתיים/עיניים, הקאות חוזרות, שיעול, צפצופים, או חיוורון. ההבדל העיקרי – תגובה רגילה מוגבלת לאזור המגע וחולפת מהר; אלרגיה מערבת אזורים נוספים בגוף.",
  },
  {
    question: "מתי לפנות לאלרגולוג לפני הטעימות הראשונות?",
    answer:
      "מומלץ להתייעץ עם אלרגולוג ילדים לפני התחלת הטעימות כאשר: לתינוק יש אגזמה בינונית-חמורה, יש אח/ות עם אלרגיה למזון, הייתה תגובה קודמת למזון כלשהו, או כשההורים חשים חוסר ביטחון לגבי התהליך.",
  },
  {
    question: "האם חשיפה מוקדמת באמת מונעת אלרגיה?",
    answer:
      "כן, המחקר המדעי תומך בכך. מחקר LEAP הראה הפחתה של 80% באלרגיה לבוטנים בקרב תינוקות בסיכון שצרכו בוטנים מגיל 4-6 חודשים. מחקרי EAT ו-PETIT תומכים בעקרון דומה לשומשום וביצה. ההמלצה: חשיפה מוקדמת, עקבית, ובכמויות קטנות.",
  },
  {
    question: "מה לעשות אם התינוק סירב לטעום?",
    answer:
      "סירוב לטעימה ראשונה הוא נורמלי לחלוטין. אל תכריחו. נסו שוב אחרי יום-יומיים, בצורה אחרת (ערבוב במחית מוכרת, שינוי מרקם). תינוקות צריכים לפעמים 10-15 חשיפות לפני שהם מקבלים מזון חדש. זה לא סימן לאלרגיה.",
  },
  {
    question: "האם אפשר לתת כמה אלרגנים באותו יום?",
    answer:
      "מומלץ להכניס אלרגן חדש אחד בכל פעם, ולהמתין 3-5 ימים בין אלרגן לאלרגן. כך ניתן לזהות בקלות אם יש תגובה ולדעת למה היא קשורה. אחרי שאלרגן \"עבר\" בהצלחה, אפשר להמשיך לתת אותו באופן קבוע תוך הכנסת הבא.",
  },
];

const GoldenGuide = () => {
  const { getSection } = usePageContent('first-foods');
  const heroSection = getSection(0);
  const dynamicH1 = heroSection?.heading || 'טעימות ראשונות בישראל: איך לחשוף תינוק לאלרגנים';

  const faqSchema = buildFaqSchema(faqs);

  const articleSchema = buildMedicalPageSchema({
    headline: "טעימות ראשונות בישראל: איך לחשוף תינוק לאלרגנים (במבה, טחינה, ביצים וחלב)",
    description: "מדריך רפואי מקיף להורים ישראליים: איך להתחיל טעימות ראשונות של אלרגנים נפוצים לתינוקות, מתי להיבהל ומתי לנשום, מבוסס מחקר LEAP וההנחיות הישראליות.",
    datePublished: "2026-02-08",
    dateModified: "2026-02-08",
    canonicalUrl: "https://ihaveallergy.com/guides/טעימות-ראשונות-אלרגנים",
    about: {
      "@type": "MedicalCondition",
      name: "Food Allergy in Infants",
      alternateName: "אלרגיה למזון בתינוקות",
    },
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "ראשי", item: "https://ihaveallergy.com/" },
    { name: "בלוג", item: "https://ihaveallergy.com/blog" },
    { name: "טעימות ראשונות – מדריך אלרגנים לתינוקות" },
  ]);

  return (
    <>
      <Helmet>
        <title>טעימות ראשונות לתינוקות: מדריך חשיפה לאלרגנים בישראל | ד״ר אנה ברמלי</title>
        <meta
          name="description"
          content="מדריך רפואי מקיף להורים: איך לחשוף תינוק לבמבה, טחינה, ביצים וחלב בבטחה. מתי להתחיל, איך לזהות אלרגיה, ומתי לפנות לרופא. מבוסס מחקר LEAP."
        />
        <link rel="canonical" href="https://ihaveallergy.com/guides/טעימות-ראשונות-אלרגנים" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://ihaveallergy.com/guides/טעימות-ראשונות-אלרגנים" />
        <meta property="og:title" content="טעימות ראשונות לתינוקות: מדריך חשיפה לאלרגנים בישראל | ד״ר אנה ברמלי" />
        <meta property="og:description" content="מדריך רפואי מקיף להורים: איך לחשוף תינוק לבמבה, טחינה, ביצים וחלב בבטחה." />
        <meta property="og:image" content="https://ihaveallergy.com/og-logo.png" />
        <meta property="article:published_time" content="2026-02-08" />
        <meta property="article:modified_time" content="2026-02-08" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="טעימות ראשונות לתינוקות: מדריך חשיפה לאלרגנים בישראל | ד״ר אנה ברמלי" />
        <meta name="twitter:description" content="מדריך רפואי מקיף להורים: איך לחשוף תינוק לבמבה, טחינה, ביצים וחלב בבטחה." />
        <meta name="twitter:image" content="https://ihaveallergy.com/og-logo.png" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Hero / Emotional opening */}
      <section className="gradient-hero py-14 md:py-20">
        <div className="container-medical max-w-3xl">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
          >
            <Link to="/" className="hover:text-foreground transition-colors">ראשי</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <Link to="/blog" className="hover:text-foreground transition-colors">בלוג</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-foreground">מדריך טעימות ראשונות</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full mb-5">
              מדריך מקיף
            </span>

            <h1 className="font-bold text-foreground mb-6 text-balance">
              {dynamicH1}
              <span className="block text-primary mt-2 text-[22px] md:text-[28px] lg:text-[32px]">
                במבה, טחינה, ביצים וחלב
              </span>
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                8 דקות קריאה
              </span>
              <span className="flex items-center gap-1.5">
                עודכן: פברואר 2026
              </span>
            </div>

            <AuthorBadge compact />
          </motion.div>
        </div>
      </section>

      {/* Article body */}
      <div className="container-medical max-w-3xl py-12 md:py-16">
        {/* Emotional opening */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="bg-surface-warm rounded-2xl p-7 border border-border/40 mb-8">
            <p className="text-lg text-foreground leading-relaxed mb-4">
              הרגע הזה מוכר. הבן שלכם בן ארבעה וחצי חודשים, יושב בתמיכה בכיסא האוכל, ואתם מחזיקים את הבמבה הראשונה שלו ביד רועדת קצת.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              קראתם בפורומים. שמעתם סיפורים. אולי אפילו ראיתם סרטון מפחיד ברשת. עכשיו אתם עומדים שם ושואלים את עצמכם: <strong className="text-foreground">״מה אם יהיה לו משהו?״</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              נשימה. המדריך הזה נכתב בדיוק בשבילכם – הורים שרוצים לעשות את הדבר הנכון, בצורה בטוחה, עם ידע ברור. בואו נעשה את זה ביחד.
            </p>
          </div>
        </motion.section>

        {/* Section: Why early exposure */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
          id="early-exposure"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">למה דווקא מוקדם? המדע שמאחורי זה</h2>
          </div>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              במשך שנים, הורים קיבלו את ההמלצה לדחות חשיפה לאלרגנים. היום אנחנו יודעים שזו הייתה טעות. <strong className="text-foreground">המחקר המדעי הפך את הגישה ב-180 מעלות.</strong>
            </p>
            <p>
              <strong className="text-foreground">מחקר LEAP</strong> (Learning Early About Peanut Allergy), שפורסם בשנת 2015 ב-New England Journal of Medicine, הראה שחשיפה מוקדמת לבוטנים (מגיל 4-11 חודשים) <strong className="text-foreground">הפחיתה את שיעור האלרגיה לבוטנים ב-80%</strong> בקרב תינוקות בסיכון גבוה.
            </p>
            <p>
              בעקבות המחקר, משרד הבריאות הישראלי, האקדמיה האמריקאית לרפואת ילדים, והאגודה האירופית לאלרגולוגיה – כולם עדכנו את ההנחיות: <strong className="text-foreground">התחילו מוקדם, תמשיכו באופן קבוע.</strong>
            </p>
            <p>
              הגוף של התינוק לומד ״להכיר״ מזונות חדשים דרך מערכת החיסון במעי. כשהחשיפה מתחילה מוקדם ונמשכת באופן עקבי – הסיכוי לפתח סבילות (tolerance) גבוה משמעותית.
            </p>
          </div>
        </motion.section>

        {/* Section: Allergen table */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
          id="allergen-table"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <Baby className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              טבלת אלרגנים: מה, מתי, ואיך – המדריך הישראלי
            </h2>
          </div>

          <div className="space-y-4">
            {allergenTable.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="bg-card rounded-2xl border border-border/60 p-5 md:p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-3">{item.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">גיל התחלה: </span>
                    <span className="font-medium text-foreground">{item.startAge}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">כמות ראשונה: </span>
                    <span className="font-medium text-foreground">{item.firstAmount}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">איך להתחיל: </span>
                    <span className="text-foreground">{item.howToStart}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">תדירות: </span>
                    <span className="text-foreground">{item.frequency}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">💡 </span>
                    <span className="text-foreground italic">{item.notes}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Section: Normal vs allergic */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
          id="reactions"
        >
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
            תגובה רגילה מול אלרגיה – איך מבדילים?
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Normal */}
            <div className="bg-card rounded-2xl border border-border/60 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-accent-foreground" />
                <h3 className="font-semibold text-foreground">תגובה רגילה – אפשר להמשיך</h3>
              </div>
              <ul className="space-y-2.5">
                {normalReactions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent-foreground mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Alarm */}
            <div className="bg-destructive/5 rounded-2xl border border-destructive/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-foreground">סימני אלרגיה – דורש תשומת לב</h3>
              </div>
              <ul className="space-y-2.5">
                {alarmSigns.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Inline CTA */}
        <ArticleCTA variant="inline" />

        {/* Section: Emergency steps */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="my-12"
          id="what-to-do"
        >
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
            מה לעשות אם יש תגובה – צעד אחר צעד
          </h2>

          <div className="space-y-4">
            {emergencySteps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="flex gap-4 items-start"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold text-sm">{item.step}</span>
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Section: When NOT to start alone — removed by request */}

        {/* Internal links hub */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-5">קריאה נוספת</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { to: "/guides/זכויות-ילד-אלרגי-ישראל", label: "זכויות של ילד אלרגי בישראל" },
              { to: "/guides/בדיקות-אלרגיה-ילדים-ישראל", label: "בדיקות אלרגיה לילדים – מדריך מלא" },
              { to: "/services", label: "בדיקות אלרגיה ושירותים נוספים" },
              { to: "/about", label: "אודות ד״ר אנה ברמלי" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 bg-card rounded-xl p-4 border border-border/60 card-hover group text-sm"
              >
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-foreground group-hover:text-primary transition-colors font-medium">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Satellite articles hub */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-5">הרחבות חשובות להורים</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { to: "/knowledge/פריחה-אחרי-במבה", label: "פריחה אחרי במבה – אלרגיה או גירוי?" },
              { to: "/knowledge/אודם-סביב-הפה-אחרי-אלרגן", label: "אודם סביב הפה – מתי זה תקין?" },
              { to: "/knowledge/במבה-גיל-4-חודשים", label: "במבה בגיל 4 חודשים – מותר?" },
              { to: "/knowledge/הקאה-אחרי-טחינה", label: "הקאה אחרי טחינה – האם זו אלרגיה?" },
              { to: "/knowledge/כמה-ימים-בין-אלרגנים", label: "כמה ימים בין אלרגנים?" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 bg-surface-warm rounded-xl p-4 border border-border/40 card-hover group text-sm"
              >
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-foreground group-hover:text-primary transition-colors font-medium">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
          id="faq"
        >
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">שאלות נפוצות</h2>
          <FAQAccordion items={faqs} />
        </motion.section>

        {/* Bottom CTA */}
        <ArticleCTA variant="section" />

        {/* Author + disclaimer */}
        <div className="mt-10 space-y-6">
          <AuthorBadge />

          <div className="bg-surface rounded-2xl p-5 border border-border/40 text-xs text-muted-foreground leading-relaxed">
            <p className="mb-2">
              <strong className="text-foreground">הבהרה רפואית:</strong> המידע בעמוד זה נועד לצרכי הסברה בלבד ואינו מהווה תחליף לייעוץ רפואי מקצועי. כל החלטה בנוגע לבריאות תינוקכם צריכה להתקבל בהתייעצות עם רופא מוסמך.
            </p>
            <p>
              תוכן זה נכתב ונסקר רפואית על ידי ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה ורופאת ילדים. עודכן לאחרונה: פברואר 2026.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoldenGuide;
