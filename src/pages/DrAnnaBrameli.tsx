import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Award, 
  Heart, 
  Stethoscope,
  BookOpen,
  Users,
  Phone
} from "lucide-react";
import { Link } from "react-router-dom";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import drAnnaImage from "@/assets/dr-anna-brameli.jpeg";

const education = [
  {
    period: "2006-2013",
    title: "לימודי רפואה M.D.",
    institution: "אוניברסיטת בן גוריון בנגב, הפקולטה למדעי הבריאות",
    details: "תוכנית משולבת לימודים ורפואה"
  },
  {
    period: "2015-2020",
    title: "התמחות ברפואת ילדים",
    institution: "מרכז שניידר לרפואת ילדים, פתח תקווה",
    details: "מחלקת ילדים ב'"
  },
  {
    period: "2022-2024",
    title: "תת-התמחות באלרגיה ואימונולוגיה",
    institution: "Vanderbilt University Medical Center, Nashville, TN",
    details: "Allergy, Pulmonary, and Critical Care Medicine"
  },
  {
    period: "2024-2025",
    title: "תת-התמחות במחלות זיהומיות ילדים",
    institution: "Vanderbilt University Medical Center, Nashville, TN",
    details: "Division of Pediatric Infectious Diseases"
  },
];

const achievements = [
  {
    icon: Award,
    title: "פרס המדריך המצטיין",
    description: "פרס המדריך המצטיין לשנת 2019-2020, אוניברסיטת תל אביב"
  },
  {
    icon: BookOpen,
    title: "מרצה בכירה",
    description: "מרצה בקורסי הכנה לבחינות רישוי ברפואה וקורסי אחיות"
  },
  {
    icon: Users,
    title: "פעילות התנדבותית",
    description: "רופאה מתנדבת במחנה כפר הירדן לילדים עם מחלות כרוניות"
  },
];

const DrAnnaBrameli = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Helmet>
          <title>ד״ר אנה ברמלי | מומחית לאלרגיה ואימונולוגיה</title>
          <meta 
            name="description" 
            content="ד״ר אנה ברמלי, רופאה מומחית לאלרגיה ואימונולוגיה בעלת ניסיון קליני רחב באבחון וטיפול באלרגיות בילדים ומבוגרים." 
          />
        </Helmet>
        <SchemaMarkup type="physician" />

        {/* Hero Section */}
        <section className="gradient-hero py-16 md:py-24">
          <div className="container-medical">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                  ד״ר אנה ברמלי
                  <span className="block text-primary mt-2 text-2xl md:text-3xl">מומחית לאלרגיה ואימונולוגיה</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  ד״ר ברמלי היא רופאה בכירה לאלרגיה ואימונולוגיה, בעלת ניסיון של שנים באבחון, טיפול ומניעה של מגוון רחב של אלרגיות בילדים ובמבוגרים.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  עבודתה משלבת מחקר קליני, גישה אנושית והבנה עמוקה של מערכת החיסון. הגישה הטיפולית מבוססת על הקשבה, התאמה אישית והעברת ידע למטופלים ולמשפחותיהם.
                </p>
                <Button variant="default" size="lg" className="shadow-teal" asChild>
                  <Link to="/book">
                    <Phone className="w-5 h-5 ml-2" />
                    קביעת תור
                  </Link>
                </Button>
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
                    alt="ד״ר אנה ברמלי"
                    className="relative w-80 h-80 md:w-96 md:h-96 object-cover rounded-3xl shadow-xl"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
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
                הגישה המקצועית
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                טיפול באלרגיה מתחיל בהקשבה. כל מטופל מביא איתו סיפור רפואי אחר, ולכן האבחון והטיפול מותאמים אישית בהתאם לתסמינים, ההיסטוריה והצרכים של המשפחה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                אני מאמינה בשיתוף מלא של ההורים והמטופלים בתהליך הטיפולי, ובהעברת ידע שמאפשר להתמודד עם האלרגיה בביטחון ובשגרה יומיומית תקינה.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Education & Training */}
        <section className="py-16 md:py-24">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                השכלה והתמחות
              </h2>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              {education.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pr-8 pb-12 last:pb-0"
                >
                  {/* Timeline line */}
                  {index !== education.length - 1 && (
                    <div className="absolute right-[11px] top-8 bottom-0 w-0.5 bg-border" />
                  )}
                  
                  {/* Timeline dot */}
                  <div className="absolute right-0 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <GraduationCap className="w-3 h-3 text-primary-foreground" />
                  </div>

                  <div className="bg-card rounded-xl p-6 border border-border mr-4">
                    <span className="text-sm text-primary font-medium">{item.period}</span>
                    <h3 className="text-lg font-semibold text-foreground mt-2">{item.title}</h3>
                    <p className="text-muted-foreground mt-1">{item.institution}</p>
                    <p className="text-sm text-muted-foreground/80 mt-1">{item.details}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                הישגים ופעילות
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {achievements.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl p-6 border border-border text-center"
                >
                  <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-16 md:py-24">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  הסמכות ורישיונות
                </h2>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                  <span className="text-foreground font-medium">רישיון רפואה ישראלי</span>
                  <span className="text-muted-foreground">מס׳ 132226</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                  <span className="text-foreground font-medium">ECFMG Certification</span>
                  <span className="text-muted-foreground">מס׳ 0-829-897-8</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-foreground font-medium">מומחית ברפואת ילדים</span>
                  <span className="text-muted-foreground">משרד הבריאות</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary/5">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                לקביעת תור
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                צרו קשר עוד היום לקביעת תור ייעוץ עם ד״ר אנה ברמלי
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg" className="shadow-teal" asChild>
                  <Link to="/book">
                    <Phone className="w-5 h-5 ml-2" />
                    קביעת תור
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/contact">
                    יצירת קשר
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DrAnnaBrameli;
