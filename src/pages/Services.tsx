import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Apple, 
  Milk, 
  Cookie, 
  Pill, 
  Bug, 
  Flower2, 
  Sparkles, 
  Wind,
  AlertTriangle,
  Baby,
  Phone,
  Syringe,
  TestTube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

const conditions = [
  {
    id: "food-allergy",
    icon: Apple,
    title: "אלרגיה למזון",
    description: "אלרגיה למזון היא תגובה של מערכת החיסון לרכיב במזון הנחשב לגוף כ״איום״. התגובה יכולה להופיע בדקות או שעות לאחר האכילה.",
    symptoms: ["פריחה, נפיחות, גרד", "הקאות או כאבי בטן", "קוצר נשימה", "ירידת לחץ דם (במצבים קשים)"],
    treatment: "הימנעות מהמזון, תכנון תזונתי, ולעיתים טיפול מונע."
  },
  {
    id: "milk-allergy",
    icon: Milk,
    title: "אלרגיה לחלב",
    description: "תגובה חיסונית לחלבון חלב, נפוצה בעיקר בתינוקות וילדים צעירים. חשוב להבדיל בין אלרגיה לחלב לבין אי-סבילות ללקטוז.",
    symptoms: ["שלשולים", "פריחה", "כאבי בטן", "קוצר נשימה (במקרים חמורים)"],
    treatment: "הימנעות מוחלטת מחלב ומוצריו, מעקב תזונתי, בדיקות תקופתיות."
  },
  {
    id: "peanut-allergy",
    icon: Cookie,
    title: "אלרגיה לבוטנים",
    description: "אלרגיה משמעותית שעלולה לגרום לתגובה חמורה. דורשת התנהלות קפדנית ומודעות גבוהה.",
    symptoms: ["נפיחות", "הקאות", "שיעול", "ירידת לחץ דם"],
    treatment: "הימנעות מוחלטת + נשיאת מזרק אדרנלין לפי הצורך."
  },
  {
    id: "drug-allergy",
    icon: Pill,
    title: "אלרגיה לתרופות",
    description: "תגובה אלרגית המופיעה לאחר מתן תרופה מסוימת, לעיתים גם לאחר שנים של שימוש בטוח.",
    symptoms: ["פריחה או שלפוחיות", "נפיחות בפנים", "קוצר נשימה", "חום", "תגובה אנפילקטית"],
    treatment: "אבחון מדויק כולל תשאול, בדיקות דם, ולעיתים תגר תרופתי מבוקר."
  },
  {
    id: "insect-allergy",
    icon: Bug,
    title: "אלרגיה לדבורים ועקיצות חרקים",
    description: "אלרגיה לעקיצת דבורה או צרעה יכולה להיות קלה — או מסכנת חיים. חשוב לאבחן ולהיערך מראש.",
    symptoms: ["נפיחות משמעותית", "גרד מפושט", "סחרחורת", "קשיי נשימה"],
    treatment: "אדרנלין במקרים חמורים, טיפול מונע (אימונותרפיה)."
  },
  {
    id: "seasonal-allergy",
    icon: Flower2,
    title: "אלרגיה לאבקנים (עונתיות)",
    description: "תגובה עונתית לחלקיקי צמחים באוויר, מופיעה בעיקר באביב ובסתיו.",
    symptoms: ["עיטושים", "נזלת", "גירוי עיניים", "שיעול"],
    treatment: "תרופות אנטי-היסטמיניות, תרסיסים, ולעיתים חיסונים."
  },
  {
    id: "urticaria",
    icon: Sparkles,
    title: "אורטיקריה (חרלת)",
    description: "פריחה אלרגית המתבטאת בגירוד חזק ונפיחות מקומית. יכולה להיות חריפה או כרונית.",
    symptoms: ["פריחה אדומה מוגבהת", "גרד עז", "נפיחות", "תסמינים משתנים"],
    treatment: "אבחון הגורם, טיפול תרופתי, ומעקב במקרים כרוניים."
  },
  {
    id: "asthma",
    icon: Wind,
    title: "אסתמה אלרגית",
    description: "מצב בו דרכי הנשימה מגיבות לגירוי אלרגני. קשר ברור בין אלרגיות לבין הופעת אסתמה בילדים.",
    symptoms: ["צפצופים", "שיעול", "קוצר נשימה", "התקפים חוזרים"],
    treatment: "טיפול תרופתי לשליטה בתסמינים ומניעת התקפים."
  },
  {
    id: "anaphylaxis",
    icon: AlertTriangle,
    title: "אנפילקסיס",
    description: "תגובה אלרגית מסכנת חיים הדורשת התערבות מיידית. חשוב להכיר את הסימנים ולהיערך מראש.",
    symptoms: ["ירידת לחץ דם", "קוצר נשימה", "נפיחות בלשון או בפנים", "אובדן הכרה"],
    treatment: "הזרקת אדרנלין מיידית + פינוי למיון."
  },
];

const diagnosticServices = [
  {
    icon: TestTube,
    title: "בדיקות עור (Skin Prick Tests)",
    description: "בדיקות דקירה לאבחון מהיר של רגישויות אלרגיות"
  },
  {
    icon: Syringe,
    title: "בדיקות דם לאלרגיות",
    description: "בדיקות IgE ספציפיות לזיהוי אלרגנים"
  },
  {
    icon: Apple,
    title: "בדיקות תגר מזון",
    description: "בדיקות תגר מבוקרות במרפאה לאישוש או שלילת אלרגיה"
  },
  {
    icon: Pill,
    title: "בדיקות תגר תרופות",
    description: "בדיקות מבוקרות לאישוש או שלילת אלרגיה לתרופות"
  },
  {
    icon: Baby,
    title: "אבחון אלרגיות לילדים",
    description: "בדיקות מותאמות לגילאי תינוקות וילדים צעירים"
  },
  {
    icon: Wind,
    title: "בדיקות תפקודי ריאות",
    description: "אבחון והערכת אסתמה ומחלות נשימה אלרגיות"
  },
];

const Services = () => {
  return (
    <>
      <Helmet>
        <title>שירותים ומצבים רפואיים | ד״ר אנה ברמלי</title>
        <meta 
          name="description" 
          content="מגוון שירותי אבחון וטיפול באלרגיות: אלרגיה למזון, לתרופות, לדבורים, אסתמה אלרגית, אורטיקריה ועוד. בדיקות עור, בדיקות דם ובדיקות תגר." 
        />
      </Helmet>
      <SchemaMarkup type="medicalWebPage" />

      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              שירותים ומצבים רפואיים
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              מגוון רחב של שירותי אבחון וטיפול באלרגיות, מותאמים אישית לכל מטופל. המידע להלן מסייע להורים להבין את המצבים השונים ולדעת מתי לפנות לאבחון מקצועי.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Diagnostic Services */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              שירותי אבחון
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              בדיקות מקצועיות ומותאמות לכל גיל לאבחון מדויק של אלרגיות
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {diagnosticServices.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-background rounded-xl p-6 border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section className="py-16 md:py-24">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              מצבים רפואיים
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              מידע מפורט על סוגי אלרגיות שונים, תסמינים ודרכי טיפול
            </p>
          </motion.div>

          <div className="space-y-8">
            {conditions.map((condition, index) => (
              <motion.article
                key={condition.id}
                id={condition.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-2xl border border-border p-6 md:p-8 scroll-mt-24"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <condition.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                      {condition.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {condition.description}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-muted/50 rounded-xl p-5">
                    <h4 className="font-semibold text-foreground mb-3">תסמינים נפוצים:</h4>
                    <ul className="space-y-2">
                      {condition.symptoms.map((symptom, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-accent/50 rounded-xl p-5">
                    <h4 className="font-semibold text-foreground mb-3">טיפול:</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {condition.treatment}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              מתי כדאי להיבדק?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              כאשר יש תגובות חוזרות: פריחה, שיעול, נפיחות או בעיות נשימה לאחר חשיפה למזון, תרופה, עקיצה או אבקנים.
            </p>
            <Button size="lg" className="shadow-teal" asChild>
              <Link to="/contact">
                <Phone className="w-5 h-5 ml-2" />
                קביעת תור לאבחון
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Services;
