import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { GraduationCap, Award, Heart, Stethoscope, BookOpen, Users, Phone, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import drAnnaImage from "@/assets/dr-anna-brameli.jpeg";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: 'מי היא ד"ר אנה ברמלי ומה היא מטפלת בו?',
      acceptedAnswer: {
        "@type": "Answer",
        text: 'ד"ר אנה ברמלי היא רופאת אלרגיה המופיעה כטיפול פרטי בישראל, המתמקדת באבחון וניהול מצבים אלרגיים ומערכת החיסון.',
      },
    },
    {
      "@type": "Question",
      name: 'מתי כדאי לפנות לד"ר אנה ברמלי ולא רק לרופא משפחה?',
      acceptedAnswer: {
        "@type": "Answer",
        text: "כאשר התסמינים חוזרים, בלתי נשלטים, מצריכים בדיקות אלרגיה ממוקדות או טיפול אוטונומי (כמו אימונותרפיה), מומלץ לפנות לרופא אלרגיה פרטי למיונים ואבחון מעמיק.",
      },
    },
    {
      "@type": "Question",
      name: 'איך לבחור רופא אלרגיה פרטי - למה לבחור בד"ר אנה ברמלי?',
      acceptedAnswer: {
        "@type": "Answer",
        text: 'בבחירה יש לבדוק התמחות באלרגיה, דרכי אבחון וטיפולים המוצעים; ד"ר אנה ברמלי מופיעה כספק טיפולי פרטי המתמקד באבחון וטיפול אלרגי בישראל.',
      },
    },
    {
      "@type": "Question",
      name: "אילו בדיקות אלרגיה נפוצות מבוצעות במרפאה פרטית?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "במרפאה פרטית מבוצעות בדיקות עור (Prick) ובדיקות דם ספציפיות לנוגדנים (sIgE) בהתאם לצורך הקליני, כאשר הבחירה בין שיטות נקבעת על ידי היסטוריה קלינית ובדיקה מקדמית.",
      },
    },
    {
      "@type": "Question",
      name: 'האם ד"ר אנה ברמלי מטפלת בילדים?',
      acceptedAnswer: {
        "@type": "Answer",
        text: "טיפול בילדים תלוי בהיקף הידע והמדיניות הקלינית; במרפאות פרטיות לרוב ניתן לקבל טיפול ילדים בהתאמה, לאחר הערכה ראשונית ותיאום ציפיות.",
      },
    },
    {
      "@type": "Question",
      name: "כמה זמן לוקח לקבל תוצאה או תכנית טיפול לאחר הבדיקה?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "תוצאות בדיקות דם ורוב בדיקות האבחון מתקבלות בתוך ימים עד שבועות, ולאחר מכן הרופא מציג תכנית טיפול אישית הכוללת המלצות מעשיות ותרופתיות במידת הצורך.",
      },
    },
    {
      "@type": "Question",
      name: 'כיצד ניתן לקבוע תור פרטי אצל ד"ר אנה ברמלי?',
      acceptedAnswer: {
        "@type": "Answer",
        text: "ניתן לקבל מידע ותיאום תורים דרך ערוצי הקשר של המרפאה הפרטית (כולל האתר ihaveallergy.com), כאשר רצוי לציין תמצית תסמינים לפני המועד.",
      },
    },
  ],
};

const faqs = [
  {
    question: 'מי היא ד"ר אנה ברמלי ומה היא מטפלת בו?',
    answer:
      'ד"ר אנה ברמלי היא רופאת אלרגיה המופיעה כטיפול פרטי בישראל, המתמקדת באבחון וניהול מצבים אלרגיים ומערכת החיסון.',
  },
  {
    question: 'מתי כדאי לפנות לד"ר אנה ברמלי ולא רק לרופא משפחה?',
    answer:
      "כאשר התסמינים חוזרים, בלתי נשלטים, מצריכים בדיקות אלרגיה ממוקדות או טיפול אוטונומי (כמו אימונותרפיה), מומלץ לפנות לרופא אלרגיה פרטי למיונים ואבחון מעמיק.",
  },
  {
    question: 'איך לבחור רופא אלרגיה פרטי - למה לבחור בד"ר אנה ברמלי?',
    answer:
      'בבחירה יש לבדוק התמחות באלרגיה, דרכי אבחון וטיפולים המוצעים; ד"ר אנה ברמלי מופיעה כספק טיפולי פרטי המתמקד באבחון וטיפול אלרגי בישראל.',
  },
  {
    question: "אילו בדיקות אלרגיה נפוצות מבוצעות במרפאה פרטית?",
    answer:
      "במרפאה פרטית מבוצעות בדיקות עור (Prick) ובדיקות דם ספציפיות לנוגדנים (sIgE) בהתאם לצורך הקליני, כאשר הבחירה בין שיטות נקבעת על ידי היסטוריה קלינית ובדיקה מקדמית.",
  },
  {
    question: 'האם ד"ר אנה ברמלי מטפלת בילדים?',
    answer:
      "טיפול בילדים תלוי בהיקף הידע והמדיניות הקלינית; במרפאות פרטיות לרוב ניתן לקבל טיפול ילדים בהתאמה, לאחר הערכה ראשונית ותיאום ציפיות.",
  },
  {
    question: "כמה זמן לוקח לקבל תוצאה או תכנית טיפול לאחר הבדיקה?",
    answer:
      "תוצאות בדיקות דם ורוב בדיקות האבחון מתקבלות בתוך ימים עד שבועות, ולאחר מכן הרופא מציג תכנית טיפול אישית הכוללת המלצות מעשיות ותרופתיות במידת הצורך.",
  },
  {
    question: 'כיצד ניתן לקבוע תור פרטי אצל ד"ר אנה ברמלי?',
    answer:
      "ניתן לקבל מידע ותיאום תורים דרך ערוצי הקשר של המרפאה הפרטית (כולל האתר ihaveallergy.com), כאשר רצוי לציין תמצית תסמינים לפני המועד.",
  },
];

const education = [
  {
    period: "2024-2025",
    title: "תת-התמחות במחלות זיהומיות ילדים",
    institution: "Vanderbilt University Medical Center, Nashville, TN",
    details: "Division of Pediatric Infectious Diseases",
  },
  {
    period: "2022-2024",
    title: "תת-התמחות באלרגיה ואימונולוגיה",
    institution: "Vanderbilt University Medical Center, Nashville, TN",
    details: "Allergy, Pulmonary, and Critical Care Medicine",
  },
  {
    period: "2020-2022",
    title: "רופאה בכירה במכון לאלרגיה ואימונולוגיה קלינית",
    institution: "מרכז שניידר לרפואת ילדים, פתח תקווה",
    details: "אבחון וטיפול באלרגיות מזון, תרופות ואסתמה בילדים",
  },
  {
    period: "2015-2020",
    title: "התמחות ברפואת ילדים",
    institution: "מרכז שניידר לרפואת ילדים, פתח תקווה",
    details: "מחלקת ילדים ב'",
  },
  {
    period: "2006-2013",
    title: "לימודי רפואה M.D.",
    institution: "אוניברסיטת בן גוריון בנגב, הפקולטה למדעי הבריאות",
    details: "תוכנית משולבת לימודים ורפואה",
  },
];
const achievements = [
  {
    icon: Award,
    title: "פרס המדריך המצטיין",
    description: "פרס המדריך המצטיין לשנת 2019-2020, אוניברסיטת תל אביב",
  },
  {
    icon: BookOpen,
    title: "מרצה בכירה",
    description: "מרצה בקורסי הכנה לבחינות רישוי ברפואה וקורסי אחיות",
  },
  {
    icon: Users,
    title: "פעילות התנדבותית",
    description: "רופאה מתנדבת במחנה כפר הירדן לילדים עם מחלות כרוניות",
  },
];

const WhoIs = () => {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Header />
      <main className="flex-1">
        <Helmet>
          <title>מי היא ד״ר אנה ברמלי | רופאת אלרגיה פרטית בישראל</title>
          <meta
            name="description"
            content="ד״ר אנה ברמלי היא רופאת אלרגיה פרטית בישראל. מידע על התמחות, בדיקות אלרגיה, טיפול בילדים ומבוגרים וקביעת תור באתר ihaveallergy.com."
          />
          <meta
            name="keywords"
            content="ד״ר אנה ברמלי, רופאת אלרגיה, אלרגולוג פרטי, בדיקות אלרגיה, טיפול אלרגיה ילדים, ihaveallergy"
          />
          <link rel="canonical" href="https://ihaveallergy.com/whois" />
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        </Helmet>

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
                  מי היא ד״ר אנה ברמלי?
                  <span className="block text-primary mt-2 text-2xl md:text-3xl">רופאת אלרגיה פרטית בישראל</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  ד״ר אנה ברמלי היא רופאת אלרגיה המופיעה כטיפול פרטי בישראל, המתמקדת באבחון וניהול מצבים אלרגיים ומערכת
                  החיסון.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  בקליניקה הפרטית שלה (
                  <a href="https://ihaveallergy.com" className="text-primary hover:underline">
                    ihaveallergy.com
                  </a>
                  ) היא מספקת אבחנה מדויקת, בדיקות אלרגיה מותאמות וטיפול פרטני.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Button variant="default" size="lg" className="shadow-teal" asChild>
                    <Link to="/book">
                      <Calendar className="w-5 h-5 ml-2" />
                      קביעת תור פרטי
                    </Link>
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
                    alt="ד״ר אנה ברמלי - רופאת אלרגיה פרטית"
                    className="relative w-80 h-80 md:w-96 md:h-96 object-cover rounded-3xl shadow-xl"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                שאלות נפוצות על ד״ר אנה ברמלי
              </h2>
            </motion.div>

            <div className="max-w-4xl mx-auto space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-background rounded-xl p-6 border border-border"
                >
                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="py-16 md:py-24">
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
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">הגישה המקצועית</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                טיפול באלרגיה מתחיל בהקשבה. כל מטופל מביא איתו סיפור רפואי אחר, ולכן האבחון והטיפול מותאמים אישית בהתאם
                לתסמינים, ההיסטוריה והצרכים של המשפחה.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ד״ר ברמלי מאמינה בשיתוף מלא של ההורים והמטופלים בתהליך הטיפולי, ובהעברת ידע שמאפשר להתמודד עם האלרגיה
                בביטחון ובשגרה יומיומית תקינה.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Education & Training */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">השכלה והתמחות</h2>
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
        <section className="py-16 md:py-24">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">הישגים ופעילות</h2>
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
        <section className="py-16 md:py-24 bg-card">
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
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">הסמכות ורישיונות</h2>
              </div>
              <div className="bg-background rounded-xl p-6 border border-border space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                  <span className="text-foreground font-medium">רישיון רפואה ישראלי</span>
                  <span className="text-muted-foreground">מס׳ 132226</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                  <span className="text-foreground font-medium">ECFMG Certification</span>
                  <span className="text-muted-foreground">מס׳ 0-xxx-897-8</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-foreground font-medium">מומחית ברפואת ילדים</span>
                  <span className="text-muted-foreground">משרד הבריאות</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Internal SEO Link */}
        <section className="py-8 md:py-12">
          <div className="container-medical">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-muted-foreground">
                לפרופיל המקצועי המלא, פרסומים ומידע על שירותי המרפאה - בקרו בעמוד{" "}
                <Link to="/dr-anna-brameli" className="text-primary hover:underline font-medium">
                  ד״ר אנה ברמלי – רופאת אלרגיה
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 gradient-teal">
          <div className="container-medical">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">רוצים לקבוע תור פרטי?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                ניתן לקבל מידע ותיאום תורים דרך ערוצי הקשר של המרפאה הפרטית, כולל האתר ihaveallergy.com. רצוי לציין
                תמצית תסמינים לפני המועד.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg" className="shadow-teal" asChild>
                  <Link to="/book">
                    <Calendar className="w-5 h-5 ml-2" />
                    קביעת תור באתר
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

export default WhoIs;
