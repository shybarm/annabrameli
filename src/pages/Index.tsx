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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ui/service-card";
import { UpdateCard } from "@/components/ui/update-card";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { useMedicalUpdates } from "@/hooks/useMedicalUpdates";
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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const months = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const whyChooseReasons = [
  "מומחיות באבחון וטיפול באלרגיות בילדים ובמבוגרים",
  "ניסיון קליני רחב מבתי חולים מובילים בארץ ובעולם",
  "גישה אנושית ורגישה למטופלים ולמשפחות",
  "התמחות נוספת באימונולוגיה ומחלות זיהומיות ילדים",
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

const Index = () => {
  const { data: latestUpdates } = useMedicalUpdates(3);

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
                ד״ר אנה ברמלי
                <span className="block text-primary mt-3 text-[26px] md:text-[34px] lg:text-[40px]">מומחית לאלרגיה ואימונולוגיה</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-lg">
                אבחון וטיפול לילדים ולמבוגרים, בגישה מקצועית, רגישה ומבוססת ידע רפואי עדכני.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link to="/book">
                    <Phone className="w-5 h-5 ml-2" />
                    קביעת תור
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/faq">
                    <MessageCircle className="w-5 h-5 ml-2" />
                    שאלות ותשובות
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/services">
                    <BookOpen className="w-5 h-5 ml-2" />
                    מידע להורים
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
                  src={drAnnaImage}
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
                      <p className="font-semibold text-foreground text-sm">מומחית בילדים</p>
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
              מדוע לבחור בד״ר אנה ברמלי?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              ד״ר ברמלי היא רופאה בכירה לאלרגיה ואימונולוגיה, בעלת ניסיון רב בליווי מטופלים במצבים חריפים וכרוניים.
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
              שירותים ואבחונים
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              מגוון רחב של שירותי אבחון וטיפול באלרגיות, מותאמים אישית לכל מטופל.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service, index) => (
              <ServiceCard
                key={service.title}
                {...service}
                delay={index * 0.08}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
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
              מדריכים להורים
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              כל מה שצריך לדעת על אלרגיות אצל ילדים – בשפה פשוטה, מבוססת מחקר, ומותאמת להורים ישראליים.
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
              >
                <Link
                  to={guide.href}
                  className="block h-full bg-card rounded-2xl border border-border/60 p-6 md:p-7 card-hover group"
                >
                  <span className="inline-block text-[10px] font-medium text-primary bg-accent px-2.5 py-0.5 rounded-full mb-4">
                    {guide.badge}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-4">
                    <guide.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-sm font-medium text-primary/80 mb-3">{guide.subtitle}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{guide.description}</p>
                </Link>
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

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
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
              <AlertTriangle className="w-12 h-12 text-primary-foreground/70 mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-5 leading-tight">
                מרגישים שהילד מגיב למזון, עקיצה או תרופה?
              </h2>
              <p className="text-primary-foreground/85 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                אל תחכו – קבעו תור לאבחון מקצועי. אבחון מוקדם ומדויק יכול לשנות את ההתנהלות היומיומית ולהעניק שקט נפשי.
              </p>
              <Button size="lg" variant="secondary" className="shadow-lg" asChild>
                <Link to="/book">
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
