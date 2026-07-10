import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Phone, 
  MessageCircle, 
  BookOpen, 
  CheckCircle2, 
  ArrowLeft,
  Apple,
  Wind,
  Pill,
  Bug,
  Flower2,
  Sparkles,
  Baby,
  AlertTriangle,
  ShieldCheck,
  TestTube2,
  School,
  HelpCircle,
  Clock,
  Newspaper,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ui/service-card";
import { UpdateCard } from "@/components/ui/update-card";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { useMedicalUpdates } from "@/hooks/useMedicalUpdates";
import { blogArticles } from "@/data/blog-articles";
import { usePageContent } from "@/contexts/PageContentContext";
import { trackBookAppointmentClick } from "@/lib/analytics";
import drAnnaImage from "@/assets/dr-anna-brameli-portrait.png.asset.json";
import desensitizationImage from "@/assets/desensitization-dr-brameli.webp.asset.json";
import desensitizationConsultImage from "@/assets/dr-anna-brameli-desensitization.webp.asset.json";
import foodAllergyImage from "@/assets/dr-anna-brameli-food-allergy.webp.asset.json";
import drAnnaFamilyImage from "@/assets/dr-anna-family-consultation.png.asset.json";
import drAnnaSkinTestImage from "@/assets/dr-anna-skin-prick-test.png.asset.json";
import drAnnaInhalerImage from "@/assets/dr-anna-asthma-inhaler.png.asset.json";

const services = [
  {
    icon: Apple,
    title: "אבחון וטיפול באלרגיה למזון בילדים",
    description: "אבחון וטיפול באלרגיות למזון בילדים ובמבוגרים, כולל בדיקות תגר מבוקרות.",
    href: "/services#food-allergy",
  },
  {
    icon: Wind,
    title: "מומחית לאסתמה אלרגית וקוצר נשימה",
    description: "אבחון אסתמה שמקורה באלרגיות, בדיקות תפקודי ריאות וטיפול מתקדם.",
    href: "/services#asthma",
  },
  {
    icon: Sparkles,
    title: "אורטיקריה (חרלת)",
    description: "טיפול בפריחה אלרגית חריפה וכרונית, אבחון הגורמים והתאמת טיפול.",
    href: "/services#urticaria",
  },
  {
    icon: Pill,
    title: "בדיקת אלרגיה לתרופות ואנטיביוטיקה",
    description: "אבחון תגובות אלרגיות לתרופות, בדיקות ותגר תרופתי מבוקר.",
    href: "/services#drug-allergy",
  },
  {
    icon: Bug,
    title: "אלרגיה לדבורים",
    description: "אבחון וטיפול באלרגיות לעקיצות חרקים, כולל טיפול מונע.",
    href: "/services#insect-allergy",
  },
  {
    icon: Flower2,
    title: "אלרגיות עונתיות",
    description: "טיפול באלרגיות לאבקנים, קדחת השחת ותסמינים עונתיים.",
    href: "/services#seasonal-allergy",
  },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const months = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const whyChooseReasons = [
  "מומחיות באבחון וטיפול באלרגיות בילדים ובמבוגרים",
  "ניסיון קליני רחב מבתי חולים מובילים בארץ ובעולם",
  "נסיון קליני ומחקרי נוסף במחלות זיהומיות בילדים",
  "זמינות גבוהה וקשר ישיר עם הרופאה",
];
const goldenGuides = [
  {
    icon: Baby,
    title: "טעימות ראשונות",
    subtitle: "מדריך חשיפה לאלרגנים לתינוקות",
    description: "במבה, טחינה, ביצים וחלב – מתי להתחיל, איך לזהות תגובה, ומתי לנשום.",
    href: "/guides/טעימות-ראשונות-אלרגנים",
    badge: "מדריך מקיף",
  },
  {
    icon: TestTube2,
    title: "בדיקות אלרגיה",
    subtitle: "איזה בדיקה מתאימה, מתי ואיפה",
    description: "תבחיני עור, דם, מבחן מאכל – עלויות, השוואת פרטי/ציבורי, ומה לצפות.",
    href: "/guides/בדיקות-אלרגיה-ילדים-ישראל",
    badge: "מדריך בדיקות",
  },
  {
    icon: School,
    title: "זכויות ילד אלרגי",
    subtitle: "גן, בית ספר וצהרונים",
    description: "מה מגיע לילד שלכם, איך לדרוש התאמות, וצ׳קליסט מוכן להורדה.",
    href: "/guides/זכויות-ילד-אלרגי-ישראל",
    badge: "מדריך זכויות",
  },
];

const pressFeatures = [
  {
    outlet: "וואלה! בריאות",
    title: "כשהעקיצה נראית מפחידה: איך תדעו אם עקיצת היתוש מסוכנת?",
    description: "ד״ר אנה ברמלי מסבירה מתי תגובה לעקיצת יתוש מצריכה התייחסות רפואית, איך מבדילים בין גירוי רגיל לתגובה אלרגית, ומה ההורים יכולים לעשות בבית.",
    href: "https://healthy.walla.co.il/item/3845811",
    date: "2025",
  },
];

const faqItems = [
  {
    question: "מתי כדאי לקחת ילד לבדיקת אלרגיה?",
    answer: "כאשר מופיעה תגובה חוזרת למזון, תרופה או עקיצה, פריחה לא מוסברת, או תסמיני אסתמה ונזלת כרונית. אבחון מוקדם אצל רופא אלרגיה מומחה מאפשר תכנית טיפול ברורה, מונע חשיפות חוזרות ומפחית סיכון לתגובה חמורה (אנפילקסיס).",
  },
  {
    question: "מה ההבדל בין אלרגיה למזון לאי-סבילות?",
    answer: "אלרגיה למזון היא תגובה של מערכת החיסון שעלולה להופיע תוך דקות עד שעתיים מהחשיפה ולכלול פריחה, נפיחות, הקאות או קוצר נשימה. אי-סבילות (כמו ללקטוז) מוגבלת בדרך כלל למערכת העיכול - גזים, שלשול, אי-נוחות - מופיעה תוך שעות ואינה מסכנת חיים.",
  },
  {
    question: "איך מתבצעת בדיקת אלרגיה במרפאה?",
    answer: "השיטות העיקריות הן תבחיני עור (Skin Prick Test) - תוצאה תוך 15-20 דקות, ובדיקות דם לנוגדני IgE ספציפיים - תשובה תוך 3-7 ימי עבודה. במצבים מסוימים מבצעים גם תגר מזון מבוקר במרפאה לאישור או שלילת אלרגיה.",
  },
];


const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqItems.map((item) => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer,
    },
  })),
};

const Index = () => {
  const { data: latestUpdates } = useMedicalUpdates(3);
  const { getSection } = usePageContent('homepage');

  // Read dynamic content from the page content store
  const heroSection = getSection(0);
  const heroSubSection = getSection(1);
  const whySection = getSection(1);
  const servicesSection = getSection(2);
  const guidesSection = getSection(3);
  const faqSection = getSection(4);
  const ctaSection = getSection(5);

  return (
    <>
      <Helmet>
        <title>ד״ר אנה ברמלי | מומחית לאלרגיה ואימונולוגיה</title>
        <meta name="description" content="ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה בהוד השרון. אבחון וטיפול באלרגיה למזון, אסתמה, נזלת אלרגית, אלרגיה לתרופות ואנפילקסיס - לילדים ולמבוגרים. קביעת תור מהירה." />
        <meta property="og:description" content="מרפאת אלרגיה פרטית של ד״ר אנה ברמלי בהוד השרון. אבחון וטיפול באלרגיות, אסתמה ואימונותרפיה - לילדים ולמבוגרים." />
        <link rel="canonical" href="https://ihaveallergy.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ihaveallergy.com/" />
        <meta property="og:title" content="ד״ר אנה ברמלי | מומחית לאלרגיה ואימונולוגיה" />
        <meta property="og:image" content="https://ihaveallergy.com/og-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ד״ר אנה ברמלי | מומחית לאלרגיה ואימונולוגיה" />
        <meta name="twitter:image" content="https://ihaveallergy.com/og-logo.png" />
      </Helmet>
      <SchemaMarkup type="physician" />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="container-medical py-20 md:py-28 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="order-2 lg:order-1"
            >
              <h1 className="font-bold text-foreground leading-[1.1] mb-6">
                מרפאת אלרגיה - ד״ר אנה ברמלי
                <span className="block text-primary mt-3 text-[26px] md:text-[34px] lg:text-[40px]">מומחית לאלרגיה ואימונולוגיה</span>
              </h1>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link to="/book" onClick={() => trackBookAppointmentClick("hero")}>
                    <Phone className="w-5 h-5 ml-2" />
                    קביעת תור
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="order-1 lg:order-2 flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 gradient-teal rounded-3xl transform rotate-3 opacity-15 blur-sm" />
                <img
                  src={drAnnaImage.url}
                  alt="ד״ר אנה ברמלי - מומחית לאלרגיה ואימונולוגיה"
                  className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 object-cover rounded-3xl shadow-xl"
                  loading="eager"
                  width={384}
                  height={384}
                />
                <div className="absolute -bottom-5 -right-5 bg-card rounded-2xl p-4 shadow-lg border border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center">
                      <Baby className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">מומחית לאלרגיה בילדים</p>
                      <p className="text-xs text-muted-foreground">ומבוגרים</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="section-spacing-lg bg-surface">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-bold text-foreground mb-4">
              {whySection?.heading || 'כמה מילים על ד"ר אנה ברמלי'}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {whySection?.content || 'ד״ר ברמלי היא רופאה בכירה לאלרגיה ואימונולוגיה, בעלת ניסיון רב בליווי מטופלים במצבים חריפים וכרוניים.'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {whyChooseReasons.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/60 card-hover"
              >
                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground font-medium text-sm leading-relaxed">{reason}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinic Moments / SEO Gallery */}
      <section className="section-spacing-lg bg-surface-warm">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="font-bold text-foreground mb-4">
              רגעים מהמרפאה של ד״ר אנה ברמלי
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              ייעוץ אישי למשפחות, תבחיני עור לאבחון אלרגיה, והדרכה מעשית על שימוש במשאף ואירוצ׳מבר לאסתמה - בגישה רגועה, ברורה ומותאמת לילדים.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            <motion.figure
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-border/60 bg-card"
            >
              <img
                src={drAnnaFamilyImage.url}
                alt="ד״ר אנה ברמלי בייעוץ אלרגיה עם אם וילדה במרפאה הפרטית"
                title="ייעוץ אלרגיה למשפחה - ד״ר אנה ברמלי"
                className="w-full h-64 object-cover"
                loading="lazy"
                width={1280}
                height={1024}
              />
              <figcaption className="p-4 text-sm text-muted-foreground">
                שיחה אישית עם הורים וילדים - אבחון אלרגיה למזון, אסתמה ואטופיק דרמטיטיס בגישה רגועה.
              </figcaption>
            </motion.figure>

            <motion.figure
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl overflow-hidden border border-border/60 bg-card"
            >
              <img
                src={drAnnaSkinTestImage.url}
                alt="ד״ר אנה ברמלי מבצעת תבחין עור (Skin Prick Test) לאבחון אלרגיה בילדים"
                title="תבחיני עור לאלרגיה - ד״ר ברמלי"
                className="w-full h-64 object-cover"
                loading="lazy"
                width={1280}
                height={1024}
              />
              <figcaption className="p-4 text-sm text-muted-foreground">
                תבחיני עור (Skin Prick Test) לאבחון אלרגיה למזון, אבקנים וקרדית אבק - תוצאה תוך 15-20 דקות.
              </figcaption>
            </motion.figure>

            <motion.figure
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="rounded-2xl overflow-hidden border border-border/60 bg-card"
            >
              <img
                src={drAnnaInhalerImage.url}
                alt="ד״ר אנה ברמלי מדריכה ילד והורה על שימוש במשאף ואירוצ׳מבר לטיפול באסתמה"
                title="הדרכה על משאף ואירוצ׳מבר לאסתמה - ד״ר ברמלי"
                className="w-full h-64 object-cover"
                loading="lazy"
                width={1280}
                height={1024}
              />
              <figcaption className="p-4 text-sm text-muted-foreground">
                הדרכה מעשית על שימוש נכון במשאף עם אירוצ׳מבר (Spacer) לטיפול באסתמה אלרגית בילדים.
              </figcaption>
            </motion.figure>
          </div>

          {/* Existing SEO gallery: desensitization & food allergy */}
          <div className="grid md:grid-cols-3 gap-5 mt-6">
            <motion.figure
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-border/60 bg-card"
            >
              <img
                src={desensitizationImage.url}
                alt="ד״ר אנה ברמלי - ייעוץ דה-סנסיטיזציה למזון בקליניקה פרטית בתל אביב"
                title="דה-סנסיטיזציה - ד״ר ברמלי"
                className="w-full h-64 object-cover"
                loading="lazy"
                width={800}
                height={600}
              />
              <figcaption className="p-4 text-sm text-muted-foreground">
                ייעוץ פרטי לדה-סנסיטיזציה למזון עם ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה קלינית.
              </figcaption>
            </motion.figure>

            <motion.figure
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl overflow-hidden border border-border/60 bg-card"
            >
              <img
                src={desensitizationConsultImage.url}
                alt="ד״ר אנה ברמלי - אלרגולוגית ילדים - בייעוץ פרטי על אלרגיה למזון וטיפולי OIT (אימונותרפיה פומית)"
                title="ד״ר אנה ברמלי - אלרגיה למזון ו-OIT"
                className="w-full h-64 object-cover"
                loading="lazy"
                width={800}
                height={600}
              />
              <figcaption className="p-4 text-sm text-muted-foreground">
                אבחון והערכת התאמה לטיפול OIT ודה-סנסיטיזציה לילדים עם אלרגיה למזון.
              </figcaption>
            </motion.figure>

            <motion.figure
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="rounded-2xl overflow-hidden border border-border/60 bg-card"
            >
              <img
                src={foodAllergyImage.url}
                alt="ד״ר ברמלי בייעוץ אלרגיה למזון לילד והורה במרפאה הפרטית בתל אביב - אבחון, מעקב וטיפול"
                title="אלרגיה למזון בילדים - ד״ר אנה ברמלי"
                className="w-full h-64 object-cover"
                loading="lazy"
                width={800}
                height={600}
              />
              <figcaption className="p-4 text-sm text-muted-foreground">
                ליווי הורים לילדים עם אלרגיה למזון - אבחון, מעקב והכוונה לטיפול מותאם.
              </figcaption>
            </motion.figure>
          </div>
        </div>
      </section>


      {/* Services Section */}
      <section className="section-spacing-lg">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-bold text-foreground mb-4">
              {servicesSection?.heading || 'שירותים ואבחונים'}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {servicesSection?.content || 'מגוון רחב של שירותי אבחון וטיפול באלרגיות, מותאמים אישית לכל מטופל.'}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="block h-full p-7 rounded-2xl bg-card border border-border/60"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-5">
                  <service.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2.5">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>

          {/* "לכל השירותים" link temporarily hidden pending content review */}
        </div>
      </section>

      {/* Golden Guides Section */}
      <section className="section-spacing-lg bg-surface-warm">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-bold text-foreground mb-4">
              {guidesSection?.heading || 'מדריכים להורים'}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {guidesSection?.content || 'כל מה שצריך לדעת על אלרגיות אצל ילדים – בשפה פשוטה, מבוססת מחקר, ומותאמת להורים ישראליים.'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {goldenGuides.map((guide, index) => (
              <motion.div
                key={guide.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="block h-full bg-card rounded-2xl border border-border/60 p-6 md:p-7"
              >
                <span className="inline-block text-[10px] font-medium text-primary bg-accent px-2.5 py-0.5 rounded-full mb-4">
                  {guide.badge}
                </span>
                <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <guide.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{guide.title}</h3>
                <p className="text-sm font-medium text-primary/80 mb-3">{guide.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{guide.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Updates Section */}
      <section className="section-spacing-lg">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-bold text-foreground mb-4">
              עדכונים אחרונים באלרגיה
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              סקירות עדכניות של מחקרים בתחום האלרגיה והאימונולוגיה, מסוכמות בשפה פשוטה וברורה.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(latestUpdates || []).map((update, index) => (
              <UpdateCard
                key={update.id}
                title={update.title_he}
                date={formatDate(update.published_date)}
                source={update.source}
                summary={update.summary_he}
                link={update.source_url || undefined}
                delay={index * 0.08}
              />
            ))}
          </div>

          {/* "לכל העדכונים" link temporarily hidden pending content review */}
        </div>
      </section>

      {/* Press / Media Section */}
      <section className="section-spacing-lg bg-surface-warm">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-bold text-foreground mb-4">בעיתונות</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              ד״ר אנה ברמלי מתראיינת ומצוטטת במגוון פרסומים בתחום בריאות הילד והאלרגיה.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {pressFeatures.map((item, index) => (
              <motion.a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group block h-full bg-card rounded-2xl border border-border/60 p-6 md:p-7 card-hover"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <Newspaper className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{item.outlet}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
                <h3 className="text-base font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.description}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  לכתבה המלאה
                  <ExternalLink className="w-4 h-4" />
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-spacing-lg bg-surface">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-bold text-foreground mb-4">
              שאלות נפוצות
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              תשובות לשאלות שהורים שואלים הכי הרבה – בשפה פשוטה ומבוססת מחקר.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-5">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl border border-border/60 p-6 md:p-7"
              >
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2">{item.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* "לכל השאלות" link, Knowledge Center, and Blog Articles sections temporarily hidden pending content review */}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing-lg">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl gradient-teal p-10 md:p-14 lg:p-20 text-center"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
            <div className="relative z-10">
              <AlertTriangle aria-hidden="true" className="w-12 h-12 text-primary-foreground mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-5 leading-tight">
                {ctaSection?.heading || 'מרגישים שהילד מגיב למזון, עקיצה או תרופה?'}
              </h2>
              <p className="text-primary-foreground text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                {ctaSection?.content || 'אל תחכו – קבעו תור לאבחון מקצועי. אבחון מוקדם ומדויק יכול לשנות את ההתנהלות היומיומית ולהעניק שקט נפשי.'}
              </p>
              <Button size="lg" variant="secondary" className="shadow-lg" asChild>
                <Link to="/book" onClick={() => trackBookAppointmentClick("footer_cta")}>
                  <Phone className="w-5 h-5 ml-2" />
                  קביעת תור לאבחון
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Index;
