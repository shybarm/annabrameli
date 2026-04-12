import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Award, 
  Stethoscope,
  BookOpen,
  Users,
  Phone,
  MapPin,
  Clock,
  FileText,
  Baby,
  Pill,
  TestTube,
  Heart,
  Shield,
  MessageCircle,
  ChevronDown,
  ExternalLink,
  Mail,
  Navigation
} from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import drAnnaImage from "@/assets/dr-anna-brameli.jpeg";

const physicianSchema = {
  "@context": "https://schema.org",
  "@type": "Physician",
  name: "ד״ר אנה ברמלי",
  alternateName: "Dr. Anna Brameli",
  description: "ד״ר אנה ברמלי היא רופאת אלרגיה ואלרגולוגית בקליניקה פרטית בישראל. מומחית באבחון וטיפול באלרגיות מזון ועונתיות, בדיקות IgE ואימונותרפיה.",
  medicalSpecialty: ["Allergy and Immunology", "Pediatrics"],
  url: "https://ihaveallergy.com/dr-anna-brameli",
  telephone: "+972-54-580-8008",
  address: {
    "@type": "PostalAddress",
    addressLocality: "הוד השרון",
    postalCode: "4501303",
    addressCountry: "IL"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 32.1524,
    longitude: 34.8947
  },
  image: "https://ihaveallergy.com/og-logo.png",
  sameAs: [],
  knowsLanguage: ["he", "en"],
  availableService: [
    { "@type": "MedicalProcedure", name: "בדיקות עור (Skin Prick Tests)" },
    { "@type": "MedicalProcedure", name: "בדיקות דם IgE" },
    { "@type": "MedicalProcedure", name: "אימונותרפיה" },
    { "@type": "MedicalProcedure", name: "אבחון אלרגיות מזון" },
    { "@type": "MedicalProcedure", name: "טיפול באסתמה אלרגית" }
  ]
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: "קליניקת ד״ר אנה ברמלי - אלרגיה ואימונולוגיה",
  url: "https://ihaveallergy.com",
  telephone: "+972-54-580-8008",
  address: {
    "@type": "PostalAddress",
    addressLocality: "הוד השרון",
    addressCountry: "IL"
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "09:00",
      closes: "18:00"
    }
  ]
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "מתי כדאי לפנות לרופא אלרגיה?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "כאשר תסמינים חוזרים (עקיצות, פריחות, נשימה צפופה), תגובות לאחר מזון/תרופות או בילדים עם בעיות עור/נשימה."
      }
    },
    {
      "@type": "Question",
      name: "אילו בדיקות מבוצעות בקליניקה הפרטית?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "בדיקות עור (skin prick), בדיקות דם ל-IgE, בדיקות אתגר למזון לפי צורך."
      }
    },
    {
      "@type": "Question",
      name: "מה ההבדל בין טיפול פרטי לציבורי?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "זמינות תורים מהירה יותר, זמן שיחה ארוך יותר, טיפול מותאם אישית ומעקב צמוד."
      }
    },
    {
      "@type": "Question",
      name: "האם מטופלים ילדים מקבלים טיפול בקליניקה?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "כן - יש ניסיון רב בטיפול אלרגיות מזון ואטופיק דרמטיטיס אצל תינוקות וילדים."
      }
    },
    {
      "@type": "Question",
      name: "איך מתבצעת אימונותרפיה ומה מתאים לה?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "מתן חשיפה מבוקרת לאלרגנים (תלוי בסוג האלרגן ובאבחון), מתאים למטופלים עם ריניטיס אלרגי או אלרגיה לאבקנים/קרדית אבק הבית לפי הערכת מומחה."
      }
    },
    {
      "@type": "Question",
      name: "איך עובדת בדיקת עור לאלרגיה (Prick test)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "בבדיקת עור מניחים טיפות של תמציות אלרגנים על העור ומבצעים דקירה עדינה. תגובה מקומית (אודם, נפיחות) תוך 15-20 דקות מעידה על רגישות לאלרגן הנבדק."
      }
    },
    {
      "@type": "Question",
      name: "מה ההבדל בין בדיקת דם IgE לבדיקת עור?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "בדיקת עור נותנת תוצאה מיידית במרפאה, בעוד בדיקת דם מודדת נוגדנים ספציפיים ומתאימה כשלא ניתן לבצע בדיקת עור."
      }
    },
    {
      "@type": "Question",
      name: "כמה זמן לוקח לקבל תוצאות בדיקות אלרגיה?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "בדיקות עור - תוצאה תוך 15-20 דקות. בדיקות דם - בדרך כלל 3-7 ימי עבודה בהתאם למעבדה."
      }
    },
    {
      "@type": "Question",
      name: "האם בדיקות אלרגיה בטוחות לתינוקות וילדים?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "כן, בדיקות אלרגיה בטוחות לכל הגילאים. ד\"ר אנה ברמלי מתאימה את סוג הבדיקה ומספר האלרגנים הנבדקים לגיל הילד ולסיפור הקליני."
      }
    },
    {
      "@type": "Question",
      name: "האם צריך להפסיק תרופות לפני בדיקות אלרגיה?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "בחלק מהמקרים כן. אנטיהיסטמינים עלולים להשפיע על תוצאות בדיקות עור ויש להפסיקם מראש. בקליניקה ד\"ר ברמלי תנחה אתכם לגבי הכנה מתאימה."
      }
    },
    {
      "@type": "Question",
      name: "מה העלות של בדיקות אלרגיה פרטיות בישראל?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "העלות משתנה בהתאם לסוג הבדיקות והיקפן. מומלץ לפנות לקליניקה לקבלת הצעת מחיר מותאמת."
      }
    },
    {
      "@type": "Question",
      name: "מתי מומלץ לבצע בדיקות אלרגיה במסגרת פרטית?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "כשרוצים זמינות מהירה, הסבר מפורט וליווי אישי. במסגרת פרטית ניתן לקבל תור תוך ימים, להקדיש זמן ממושך לכל מטופל ולקבל תשובות במקום."
      }
    }
  ]
};

const allergyTestFaqs = [
  {
    question: "איך עובדת בדיקת עור לאלרגיה (Prick test)?",
    answer: "בבדיקת עור מניחים טיפות של תמציות אלרגנים על העור ומבצעים דקירה עדינה. תגובה מקומית (אודם, נפיחות) תוך 15-20 דקות מעידה על רגישות לאלרגן הנבדק."
  },
  {
    question: "מה ההבדל בין בדיקת דם IgE לבדיקת עור?",
    answer: "בדיקת עור נותנת תוצאה מיידית במרפאה, בעוד בדיקת דם מודדת נוגדנים ספציפיים ומתאימה כשלא ניתן לבצע בדיקת עור (למשל, בעת נטילת תרופות מסוימות או במצבי עור מסוימים)."
  },
  {
    question: "כמה זמן לוקח לקבל תוצאות בדיקות אלרגיה?",
    answer: "בדיקות עור - תוצאה תוך 15-20 דקות. בדיקות דם - בדרך כלל 3-7 ימי עבודה בהתאם למעבדה."
  },
  {
    question: "האם בדיקות אלרגיה בטוחות לתינוקות וילדים?",
    answer: "כן, בדיקות אלרגיה בטוחות לכל הגילאים. ד\"ר אנה ברמלי מתאימה את סוג הבדיקה ומספר האלרגנים הנבדקים לגיל הילד ולסיפור הקליני."
  },
  {
    question: "האם צריך להפסיק תרופות לפני בדיקות אלרגיה?",
    answer: "בחלק מהמקרים כן. אנטיהיסטמינים עלולים להשפיע על תוצאות בדיקות עור ויש להפסיקם מראש. בקליניקה ד\"ר ברמלי תנחה אתכם לגבי הכנה מתאימה."
  },
  {
    question: "מה העלות של בדיקות אלרגיה פרטיות בישראל?",
    answer: "העלות משתנה בהתאם לסוג הבדיקות והיקפן. מומלץ לפנות לקליניקה לקבלת הצעת מחיר מותאמת."
  },
  {
    question: "מתי מומלץ לבצע בדיקות אלרגיה במסגרת פרטית?",
    answer: "כשרוצים זמינות מהירה, הסבר מפורט וליווי אישי. במסגרת פרטית ניתן לקבל תור תוך ימים, להקדיש זמן ממושך לכל מטופל ולקבל תשובות במקום."
  }
];

const education = [
  {
    period: "2006-2013",
    title: "לימודי רפואה M.D.",
    institution: "אוניברסיטת בן גוריון בנגב, הפקולטה למדעי הבריאות"
  },
  {
    period: "2015-2020",
    title: "התמחות ברפואת ילדים",
    institution: "מרכז שניידר לרפואת ילדים, פתח תקווה"
  },
  {
    period: "2022-2024",
    title: "תת-התמחות באלרגיה ואימונולוגיה",
    institution: "Vanderbilt University Medical Center, Nashville, TN"
  },
  {
    period: "2024-2025",
    title: "תת-התמחות במחלות זיהומיות ילדים",
    institution: "Vanderbilt University Medical Center, Nashville, TN"
  },
];

const services = {
  diagnosis: [
    { icon: TestTube, title: "בדיקות דם IgE", desc: "בדיקות דם לאימונוגלובולין E לאבחון אלרגיות" },
    { icon: Stethoscope, title: "בדיקות עור (Skin Prick)", desc: "בדיקות נקודתיות לזיהוי אלרגנים ספציפיים" },
    { icon: FileText, title: "בדיקות אתגר למזון", desc: "בדיקות רגישות למזון בסביבה מבוקרת" },
  ],
  treatments: [
    { icon: Pill, title: "טיפול תרופתי מותאם", desc: "התאמה אישית של תרופות לפי סוג האלרגיה" },
    { icon: Shield, title: "אימונותרפיה", desc: "טיפולי סבילות להפחתת רגישות לאלרגנים" },
    { icon: Heart, title: "תכניות לטיפול באסתמה", desc: "ניהול וטיפול באסתמה אלרגית" },
  ],
  populations: [
    { icon: Baby, title: "ילדים ותינוקות", desc: "טיפול באלרגיות מזון ואטופיק דרמטיטיס" },
    { icon: Users, title: "מבוגרים", desc: "אלרגיות מקצועיות ותרופתיות" },
    { icon: Stethoscope, title: "מחלות רקע", desc: "מטופלים עם אסתמה ומצבים כרוניים" },
  ]
};

const faqs = [
  {
    question: "מתי כדאי לפנות לרופא אלרגיה?",
    answer: "כאשר תסמינים חוזרים (עקיצות, פריחות, נשימה צפופה), תגובות לאחר מזון/תרופות או בילדים עם בעיות עור/נשימה - מומלץ לאבחן מוקדם."
  },
  {
    question: "אילו בדיקות מבוצעות בקליניקה הפרטית?",
    answer: "בדיקות עור (skin prick), בדיקות דם ל-IgE, בדיקות אתגר למזון לפי צורך."
  },
  {
    question: "מה ההבדל בין טיפול פרטי לציבורי?",
    answer: "זמינות תורים מהירה יותר, זמן שיחה ארוך יותר, טיפול מותאם אישית ומעקב צמוד."
  },
  {
    question: "האם מטופלים ילדים מקבלים טיפול בקליניקה?",
    answer: "כן - יש ניסיון רב בטיפול אלרגיות מזון ואטופיק דרמטיטיס אצל תינוקות וילדים."
  },
  {
    question: "איך מתבצעת אימונותרפיה ומה מתאים לה?",
    answer: "מתן חשיפה מבוקרת לאלרגנים (תלוי בסוג האלרגן ובאבחון), מתאים למטופלים עם ריניטיס אלרגי או אלרגיה לאבקנים/קרדית אבק הבית לפי הערכת מומחה."
  }
];

const internalResources = [
  { title: "מתי לבצע בדיקות אלרגיה בילדים", href: "/services" },
  { title: "הבנת תוצאות בדיקות IgE", href: "/faq" },
  { title: "אימונותרפיה: יתרונות, סיכונים ותהליך", href: "/services" },
  { title: "אלרגיות עונתיות - מניעה וטיפול", href: "/updates" },
];

const DrAnnaBrameli = () => {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Header />
      <main className="flex-1">
        <Helmet>
          <title>ד״ר אנה ברמלי - רופאת אלרגיה ואלרגולוגית | קליניקה פרטית בישראל</title>
          <meta 
            name="description" 
            content="ד״ר אנה ברמלי - רופאת אלרגיה פרטית בישראל. אבחון, בדיקות וטיפול מותאם. קבעו תור ב-ihaveallergy.com." 
          />
          <meta name="keywords" content="ד״ר אנה ברמלי, אלרגיה, אלרגולוג, קליניקה פרטית, בדיקות אלרגיה, אימונותרפיה, אלרגיות מזון, אסתמה" />
          <link rel="canonical" href="https://ihaveallergy.com/dr-anna-brameli" />
          <script type="application/ld+json">{JSON.stringify(physicianSchema)}</script>
          <script type="application/ld+json">{JSON.stringify(localBusinessSchema)}</script>
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        </Helmet>

        {/* Hero Section with H1 */}
        <section className="gradient-hero py-16 md:py-24">
          <div className="container-medical">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                  ד״ר אנה ברמלי
                  <span className="block text-primary mt-2 text-xl md:text-2xl font-medium">
                    רופאת אלרגיה ואלרגולוגית (קליניקה פרטית, ישראל)
                  </span>
                </h1>
                
                {/* Opening Paragraph */}
                <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    ד״ר אנה ברמלי היא רופאת אלרגיה ואלרגולוגית עם ניסיון קליני עשיר בטיפול במבוגרים וילדים. 
                    בקליניקה הפרטית שלה (<a href="https://ihaveallergy.com" className="text-primary hover:underline">ihaveallergy.com</a>) היא מספקת אבחנה מדויקת, בדיקות אלרגיה מותאמות וטיפול פרטני במצבים כגון נזלת אלרגית, אלרגיות מזון, אלרגיות עונתיות ואסתמה.
                  </p>
                  <p>
                    ד״ר ברמלי מדגישה טיפול מבוסס ראיות, הסבר פשוט למטופל ומעקב צמוד.
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Button variant="default" size="lg" className="shadow-teal" asChild>
                    <Link to="/book">
                      <Phone className="w-5 h-5 ml-2" />
                      קביעת תור פרטי
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <a href="tel:+972545808008">
                      <Phone className="w-5 h-5 ml-2" />
                      054-580-8008
                    </a>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 gradient-teal rounded-3xl transform -rotate-3 opacity-20" />
                  <img
                    src={drAnnaImage}
                    alt="ד״ר אנה ברמלי - רופאת אלרגיה ואימונולוגיה"
                    className="relative w-80 h-80 md:w-96 md:h-96 object-cover rounded-3xl shadow-xl"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* H2 - מי היא ד״ר אנה ברמלי */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                מי היא ד״ר אנה ברמלי
              </h2>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* H3 - השכלה והכשרות */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  השכלה והכשרות עיקריות
                </h3>
                <div className="space-y-4">
                  {education.map((item, index) => (
                    <div key={index} className="bg-background rounded-xl p-4 border border-border">
                      <span className="text-sm text-primary font-medium">{item.period}</span>
                      <h4 className="text-foreground font-semibold mt-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.institution}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* H3 - ניסיון קליני */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-primary" />
                  </div>
                  ניסיון קליני
                </h3>
                <div className="bg-background rounded-xl p-6 border border-border space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p className="text-muted-foreground">שנים של עבודה במערכת הציבורית ובמרכזים רפואיים מובילים בישראל ובארה״ב</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p className="text-muted-foreground">ניסיון בטיפול במבוגרים וילדים, כולל תינוקות</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p className="text-muted-foreground">ניהול תסמינים כרוניים ומחלות אלרגיות מורכבות</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p className="text-muted-foreground">ייעוץ לפני טיסות, חיסונים ותרופות</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p className="text-muted-foreground">הכשרות ועדכוני השתלמויות מקצועיות בכנסים רפואיים מוכרים</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* H2 - תחומי התמחות ושירותים */}
        <section className="py-16 md:py-24">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                תחומי התמחות ושירותים בקליניקה הפרטית
              </h2>
            </motion.div>

            {/* H3 - בדיקות ואבחון */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 text-center">
                בדיקות ואבחון
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {services.diagnosis.map((item, index) => (
                  <div key={index} className="bg-card rounded-xl p-6 border border-border text-center">
                    <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* H3 - טיפולים ושלבי טיפול */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 text-center">
                טיפולים ושלבי טיפול
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {services.treatments.map((item, index) => (
                  <div key={index} className="bg-card rounded-xl p-6 border border-border text-center">
                    <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* H3 - אוכלוסיות ומצבים מיוחדים */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 text-center">
                אוכלוסיות ומצבים מיוחדים
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {services.populations.map((item, index) => (
                  <div key={index} className="bg-card rounded-xl p-6 border border-border text-center">
                    <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* H2 - גישת הטיפול */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-8">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                גישת הטיפול והאמנות הקלינית
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ד״ר ברמלי מקפידה על אבחון מדויק, הסבר ברור למטופל ולמשפחה, תכנון טיפולי מותאם אישית ומעקב שוטף. 
                הדגש הוא על טיפול פרטני, פרקטי וארוך-טווח אשר משלב ראיות עדכניות וניסיון קליני. 
                כל מטופל מקבל תשומת לב מלאה, זמן להסברים ותוכנית טיפול מותאמת לצרכיו הייחודיים.
              </p>
            </motion.div>
          </div>
        </section>

        {/* H2 - ניסיון, הישגים והמלצות (E-E-A-T) */}
        <section className="py-16 md:py-24">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                ניסיון, הישגים והמלצות
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* H3 - ניסיון מקצועי */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-4">ניסיון מקצועי מרכזי</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• פרס המדריך המצטיין 2019-2020, אוניברסיטת תל אביב</li>
                  <li>• מרצה בקורסי הכנה לבחינות רישוי ברפואה</li>
                  <li>• רופאה מתנדבת במחנה כפר הירדן לילדים עם מחלות כרוניות</li>
                </ul>
              </motion.div>

              {/* H3 - אישורים ורישיונות */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-4">אישורים ורישיונות</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• רישיון רפואה ישראלי מס׳ 132226</li>
                  <li>• ECFMG Certification מס׳ 0-829-897-8</li>
                  <li>• מומחית ברפואת ילדים - משרד הבריאות</li>
                  <li>• חברות באגודות מקצועיות בישראל ובארה״ב</li>
                </ul>
              </motion.div>

              {/* H3 - עדויות מטופלים */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-4">עדויות מטופלים</h3>
                <blockquote className="text-muted-foreground italic border-r-2 border-primary pr-4">
                  ״ד״ר ברמלי הקשיבה, הסבירה בסבלנות וסייעה לנו להבין את האלרגיות של הילד שלנו. הטיפול שינה את חיינו.״
                </blockquote>
                <p className="text-sm text-muted-foreground/70 mt-2">- משפחת כהן, הוד השרון</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* H2 - שאלות נפוצות (FAQ) */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                שאלות נפוצות
              </h2>
              <p className="text-muted-foreground">תשובות לשאלות הנפוצות ביותר</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="bg-card rounded-xl border border-border px-6"
                  >
                    <AccordionTrigger className="text-right hover:no-underline">
                      <h3 className="text-foreground font-medium text-right">{faq.question}</h3>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* Internal SEO Link */}
        <section className="py-8 md:py-12">
          <div className="container-medical">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-muted-foreground">
                למידע נוסף על הרקע המקצועי, ההשכלה וההתמחויות של ד״ר אנה ברמלי - בקרו בעמוד{" "}
                <Link to="/whois" className="text-primary hover:underline font-medium">
                  מי היא ד״ר אנה ברמלי
                </Link>.
              </p>
            </div>
          </div>
        </section>

        {/* H2 - CTA Section */}
        <section className="py-16 md:py-24 bg-primary/5">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  חיבור ברור לטיפול פרטי
                </h2>
                <p className="text-lg text-muted-foreground">
                  הקליניקה הפרטית של ד״ר אנה ברמלי באתר <a href="https://ihaveallergy.com" className="text-primary hover:underline">ihaveallergy.com</a> מספקת תורים פרטיים מהירים, 
                  פגישת אבחון מלאה ובניית תוכנית טיפול אישית. הטיפול הפרטי מאפשר זמן ייעוץ ארוך יותר, גישה לבדיקה מתקדמת ותיאום טיפולים מותאמים.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* H3 - כיצד לקבוע תור */}
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-bold text-foreground mb-4">כיצד לקבוע תור פרטי</h3>
                  <div className="space-y-3 text-muted-foreground mb-6">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-5 h-5 text-primary" />
                      <span>טופס אונליין באתר</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <span>טלפון: 054-580-8008</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      <span>הודעת וואטסאפ</span>
                    </div>
                  </div>
                  <Button variant="default" className="w-full shadow-teal" asChild>
                    <Link to="/book">
                      <Phone className="w-5 h-5 ml-2" />
                      קביעת תור עכשיו
                    </Link>
                  </Button>
                </div>

                {/* H3 - מה להביא לפגישה */}
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="text-lg font-bold text-foreground mb-4">מה להביא לפגישה הראשונה</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-primary mt-0.5" />
                      <span>הפניות רלוונטיות (אם יש)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-primary mt-0.5" />
                      <span>תוצאות בדיקות קודמות</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Pill className="w-5 h-5 text-primary mt-0.5" />
                      <span>רשימת תרופות נוכחיות</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-primary mt-0.5" />
                      <span>תיעוד תגובות אלרגיות קודמות</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* H2 - פרטי קשר ומיקום */}
        <section className="py-16 md:py-24">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                פרטי קשר ומיקום
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">כתובת הקליניקה</h3>
                      <p className="text-muted-foreground">הוד השרון</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">טלפון</h3>
                      <a href="tel:+972545808008" className="text-primary hover:underline">054-580-8008</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">שעות קבלה</h3>
                      <p className="text-muted-foreground">ראשון-חמישי: 09:00-18:00</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">נגישות וחניה</h3>
                      <p className="text-muted-foreground">חניה זמינה, נגישות מלאה לנכים</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3376.1234567890123!2d34.8876!3d32.1512!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDA5JzA0LjMiTiAzNMKwNTMnMTUuNCJF!5e0!3m2!1sen!2sil!4v1234567890123"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="מיקום קליניקת ד״ר אנה ברמלי"
                  className="grayscale hover:grayscale-0 transition-all duration-300"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* H2 - משאבים וקישורים פנימיים */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                משאבים וקישורים שימושיים
              </h2>
              <p className="text-muted-foreground">מאמרי עומק חתומים על ידי ד״ר ברמלי</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {internalResources.map((resource, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link 
                    to={resource.href}
                    className="block bg-background rounded-xl p-4 border border-border hover:border-primary/50 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span className="text-foreground group-hover:text-primary transition-colors">{resource.title}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-8"
            >
              <Button variant="outline" asChild>
                <Link to="/faq">
                  לכל השאלות הנפוצות
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* H2 - שאלות נפוצות על בדיקות אלרגיה */}
        <section className="py-16 md:py-24">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                שאלות נפוצות על בדיקות אלרגיה
              </h2>
            </motion.div>

            <div className="max-w-4xl mx-auto space-y-8">
              {allergyTestFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl p-6 border border-border"
                >
                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DrAnnaBrameli;
