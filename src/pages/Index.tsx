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
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ui/service-card";
import { UpdateCard } from "@/components/ui/update-card";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import drAnnaImage from "@/assets/dr-anna-brameli.jpeg";

const services = [
  {
    icon: Apple,
    title: "אלרגיה למזון",
    description: "אבחון וטיפול באלרגיות למזון בילדים ובמבוגרים, כולל בדיקות תגר מבוקרות.",
    href: "/services#food-allergy",
  },
  {
    icon: Wind,
    title: "אסתמה אלרגית",
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
    title: "אלרגיה לתרופות",
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

// TODO: Replace mock data with external medical API integration
const latestUpdates = [
  {
    title: "מחקר חדש: טיפול חשיפה מוקדם לבוטנים מפחית סיכון לאלרגיה",
    date: "דצמבר 2024",
    source: "Journal of Allergy",
    summary: "מחקר ארוך טווח מראה כי חשיפה מוקדמת לבוטנים בתינוקות עשויה להפחית משמעותית את הסיכון לפתח אלרגיה לבוטנים בהמשך החיים.",
    link: "#",
  },
  {
    title: "הנחיות עדכניות לטיפול באנפילקסיס בילדים",
    date: "נובמבר 2024",
    source: "EAACI",
    summary: "הנחיות חדשות מדגישות את החשיבות של מתן אדרנלין מיידי והכשרת הורים ומטפלים לזיהוי מוקדם של תסמינים.",
    link: "#",
  },
  {
    title: "פריצת דרך בהבנת מנגנוני האלרגיה למזון",
    date: "אוקטובר 2024",
    source: "Nature Immunology",
    summary: "חוקרים זיהו תאי חיסון חדשים המעורבים בתגובה האלרגית, מה שפותח דלת לטיפולים חדשניים.",
    link: "#",
  },
];

const whyChooseReasons = [
  "מומחיות באבחון וטיפול באלרגיות בילדים ובמבוגרים",
  "ניסיון קליני רחב מבתי חולים מובילים בארץ ובעולם",
  "גישה אנושית ורגישה למטופלים ולמשפחות",
  "התמחות נוספת באימונולוגיה ומחלות זיהומיות ילדים",
  "זמינות גבוהה וקשר ישיר עם הרופאה",
];

const Index = () => {
  return (
    <>
      <Helmet>
        <title>ד״ר אנה ברמלי | מומחית לאלרגיה ואימונולוגיה</title>
        <meta 
          name="description" 
          content="ד״ר אנה ברמלי – מומחית לאלרגיה ואימונולוגיה | אבחון וטיפול בילדים ובמבוגרים. קביעת תור מהירה, מידע מקצועי, ומדריכים שיעזרו לכם להבין ולנהל אלרגיות בצורה בטוחה." 
        />
      </Helmet>
      <SchemaMarkup type="physician" />

      {/* Hero Section */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="container-medical py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                ד״ר אנה ברמלי
                <span className="block text-primary mt-2">מומחית לאלרגיה ואימונולוגיה</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl">
                אבחון וטיפול לילדים ולמבוגרים, בגישה מקצועית, רגישה ומבוססת ידע רפואי עדכני.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="shadow-teal text-base" asChild>
                  <Link to="/guest-booking">
                    <Phone className="w-5 h-5 ml-2" />
                    קביעת תור
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" className="text-base" asChild>
                  <Link to="/faq">
                    <MessageCircle className="w-5 h-5 ml-2" />
                    שאלות ותשובות
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base" asChild>
                  <Link to="/services">
                    <BookOpen className="w-5 h-5 ml-2" />
                    מידע להורים
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2 flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 gradient-teal rounded-3xl transform rotate-3 opacity-20" />
                <img
                  src={drAnnaImage}
                  alt="ד״ר אנה ברמלי - מומחית לאלרגיה ואימונולוגיה"
                  className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 object-cover rounded-3xl shadow-xl"
                />
                <div className="absolute -bottom-4 -right-4 bg-card rounded-2xl p-4 shadow-medical border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                      <Baby className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">מומחית בילדים</p>
                      <p className="text-sm text-muted-foreground">ומבוגרים</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              מדוע לבחור בד״ר אנה ברמלי?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              ד״ר ברמלי היא רופאה בכירה לאלרגיה ואימונולוגיה, בעלת ניסיון רב בליווי מטופלים במצבים חריפים וכרוניים.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseReasons.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-5 rounded-xl bg-background border border-border"
              >
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground font-medium">{reason}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              שירותים ואבחונים
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              מגוון רחב של שירותי אבחון וטיפול באלרגיות, מותאמים אישית לכל מטופל.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <ServiceCard
                key={service.title}
                {...service}
                delay={index * 0.1}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Button variant="outline" size="lg" asChild>
              <Link to="/services">
                לכל השירותים
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Latest Updates Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              עדכונים אחרונים באלרגיה
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              סקירות עדכניות של מחקרים בתחום האלרגיה והאימונולוגיה, מסוכמות בשפה פשוטה וברורה.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestUpdates.map((update, index) => (
              <UpdateCard key={update.title} {...update} delay={index * 0.1} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Button variant="outline" size="lg" asChild>
              <Link to="/updates">
                לכל העדכונים
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl gradient-teal p-8 md:p-12 lg:p-16 text-center"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
            <div className="relative z-10">
              <AlertTriangle className="w-12 h-12 text-primary-foreground/80 mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
                מרגישים שהילד מגיב למזון, עקיצה או תרופה?
              </h2>
              <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto mb-8">
                אל תחכו – קבעו תור לאבחון מקצועי. אבחון מוקדם ומדויק יכול לשנות את ההתנהלות היומיומית ולהעניק שקט נפשי.
              </p>
              <Button size="lg" variant="secondary" className="shadow-lg text-base" asChild>
                <Link to="/guest-booking">
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
