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
  TestTube,
  Cat,
  Home,
  Droplets,
  Shield
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
    description: "אלרגיה לעקיצת דבורה או צרעה יכולה להיות קלה - או מסכנת חיים. חשוב לאבחן ולהיערך מראש.",
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
  {
    id: "allergic-rhinitis",
    icon: Droplets,
    title: "נזלת אלרגית (Allergic Rhinitis)",
    description: "נזלת אלרגית היא דלקת כרונית של רירית האף הנגרמת מחשיפה לאלרגנים כמו אבקנים, אבק בית, פרוות חיות מחמד ועובש. מדובר באחד המצבים האלרגיים הנפוצים ביותר בילדים ובמבוגרים.",
    symptoms: ["גודש ונזילה מהאף", "עיטושים חוזרים", "גרד באף, בעיניים ובחיך", "דמעות ואדמומיות בעיניים"],
    treatment: "תרסיסי סטרואידים לאף, אנטי-היסטמינים, הימנעות מאלרגנים, ובמקרים כרוניים - אימונותרפיה (טיפול חיסוני)."
  },
  {
    id: "immunotherapy",
    icon: Shield,
    title: "אימונותרפיה (טיפול חיסוני)",
    description: "אימונותרפיה היא טיפול מתקדם המכוון לשנות את תגובת מערכת החיסון לאלרגן. הטיפול ניתן כזריקות או טיפות מתחת ללשון, לאורך תקופה של 3-5 שנים, ומטרתו להפחית את הרגישות לאלרגן באופן משמעותי ולאורך זמן.",
    symptoms: ["תגובות אלרגיות חוזרות שלא מגיבות לטיפול תרופתי", "נזלת אלרגית כרונית", "אלרגיה לעקיצות חרקים מסכנת חיים", "אסתמה אלרגית שקשה לשלוט בה"],
    treatment: "חשיפה הדרגתית לאלרגן במינונים עולים, תחת השגחה רפואית. הטיפול מפחית סימפטומים של אלרגיה ב-70-90% מהמקרים ויכול למנוע התפתחות אסתמה בילדים."
  },
  {
    id: "pet-allergy",
    icon: Cat,
    title: "אלרגיה לחיות מחמד",
    description: "אלרגיה לחיות מחמד (כלבים, חתולים ובעלי חיים אחרים) נגרמת מחלבונים הנמצאים ברוק, בשתן ובקשקשי העור של החיה. האלרגנים נישאים באוויר ונדבקים לרהיטים, בגדים ושטיחים.",
    symptoms: ["עיטושים ונזלת", "גרד בעיניים ודמעות", "פריחה או אורטיקריה", "החמרת אסתמה וקוצר נשימה"],
    treatment: "הימנעות מחשיפה, ניקוי יסודי של הסביבה, תרופות אנטי-היסטמיניות, ובמקרים חמורים - אימונותרפיה."
  },
  {
    id: "dust-allergy",
    icon: Home,
    title: "אלרגיה לאבק בית",
    description: "אלרגיה לאבק בית נגרמת בעיקר מקרדית אבק הבית - יצורים מיקרוסקופיים החיים במזרנים, כריות, שטיחים ורהיטים מרופדים. זהו אחד האלרגנים הנפוצים ביותר בבתים ישראליים בשל האקלים החם.",
    symptoms: ["גודש באף בעיקר בבוקר", "עיטושים חוזרים", "שיעול יבש", "החמרת אקזמה ואסתמה"],
    treatment: "כיסויים אנטי-אלרגניים למזרנים, הורדת לחות, ניקוי תדיר, תרופות לשליטה בסימפטומים של אלרגיה, ובמקרים כרוניים - אימונותרפיה."
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
        <title>שירותים ומצבים רפואיים | ד״ר אנה ברמלי – מרפאת אלרגיה</title>
        <meta 
          name="description" 
          content="ייעוץ אלרגיה ושירותי אבחון וטיפול: אלרגיה למזון, נזלת אלרגית, אימונותרפיה, אלרגיה לחיות מחמד, לאבק, לתרופות, אסתמה ואורטיקריה. מרפאת אלרגיה בהוד השרון." 
        />
        <link rel="canonical" href="https://ihaveallergy.com/services" />
      </Helmet>
      <SchemaMarkup type="medicalWebPage" />

      {/* Hero */}
      <section className="gradient-hero py-20 md:py-28">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="font-bold text-foreground mb-6">
              שירותים ומצבים רפואיים
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              מגוון רחב של שירותי אבחון וטיפול באלרגיות, מותאמים אישית לכל מטופל. המידע להלן מסייע להורים להבין את המצבים השונים ולדעת מתי לפנות לאבחון מקצועי.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Diagnostic Services */}
      <section className="section-spacing-lg bg-surface">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-bold text-foreground mb-4">
              שירותי אבחון
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              בדיקות מקצועיות ומותאמות לכל גיל לאבחון מדויק של אלרגיות
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {diagnosticServices.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-card rounded-2xl p-7 border border-border/60 card-hover"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-5">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section className="section-spacing-lg">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-bold text-foreground mb-4">
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
                className="bg-card rounded-2xl border border-border/60 p-7 md:p-9 scroll-mt-24 card-hover"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
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
                  <div className="bg-surface rounded-2xl p-5">
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
                  <div className="bg-accent/40 rounded-2xl p-5">
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
              שאלות נפוצות על שירותי אלרגיה
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-8">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">מהו תהליך האבחנה של אלרגיה פרטית בארץ?</h3>
              <p className="text-muted-foreground leading-relaxed">
                לרוב מתחיל בקליניקה ובאיסוף היסטוריה, לאחר מכן נעשות בדיקות מתאימות. ד"ר אנה ברמלי מסבירה את הצעדים וממליצה על הבדיקות המשלימות במידת הצורך. למידע נוסף/קביעת תור באתר ihaveallergy.com.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">האם יש אפשרות לתור פרטי לאלרגיה בישראל?</h3>
              <p className="text-muted-foreground leading-relaxed">
                כן, ניתן לתאם תור פרטי עם אלרגולוגים בארץ, כולל בכמה מרפאות דרך פלטפורמות כמו ihaveallergy.com. ד"ר אנה ברמלי מזכירה שהבחירה במומחה המתאים חשובה לתוצאות מהימנות. מומלץ לבדוק זמינות באתר ihaveallergy.com.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">אילו בדיקות אלרגיה פרטיות זמינות ללקוחות פרטיים?</h3>
              <p className="text-muted-foreground leading-relaxed">
                הבדיקות כוללות לעיתים בדיקות עור או דם לפי הצורך. ד"ר אנה ברמלי מסבירה אילו בדיקות מתאימות בכל מצב, ואומרת כי הבחירה תיעשה בהתאם בתיאום לפי התסמינים. לקבלת תוצאות ולהכוונה – אפשר לפנות ל ihaveallergy.com.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">איך נכון להתכונן לבדיקת אלרגיה בילדים בהגעה לעמותה פרטית?</h3>
              <p className="text-muted-foreground leading-relaxed">
                חשוב להביא היסטוריה רפואית עדכנית ותרופות המותאמות לבן/בת המשפחה. ד"ר אנה ברמלי ממליצה לתאם מראש ולוודא שהמרפאה תואמת את הצרכים של הילד. מידע נוסף על תורים באתר ihaveallergy.com.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">מה ההבדל בין בדיקות אלרגיה למזון לבין בדיקות לסוגי תרופות?</h3>
              <p className="text-muted-foreground leading-relaxed">
                בדיקות שונות לפי סוג האלרגן והחשיפה הצפויה. ד"ר אנה ברמלי מדגישה שיש להתאים את הבדיקה לשאלת המקרה ולסימפטומים. למידע אודות האפשרויות – ihaveallergy.com.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">מה כולל תור אלרגולוג פרטי לעומת ציבורי?</h3>
              <p className="text-muted-foreground leading-relaxed">
                בתור פרטי תשלומים ותורים גמישים יותר, עם תיעוד ותוצאות מידיות יותר לעיתים. ד"ר אנה ברמלי מסבירה שהגישה המקצועית נשארת זהה באיכות ובתמיכה. מידע על תור פרטית באתר ihaveallergy.com.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">איך לבחור את האלרגולוג המתאים לפרטיות בישראל?</h3>
              <p className="text-muted-foreground leading-relaxed">
                כדאי לבחון ניסיון, התמחויות ומדיניות תורים/תמיכה. ד"ר אנה ברמלי מציינת שחשוב לאיש קשר רפואי ברור ולגישה מותאמת. למידע על אפשרויות התור והגישה – באתר ihaveallergy.com.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">האם יש תסמינים נפוצים של אלרגיה שאפשר לזהות בבית?</h3>
              <p className="text-muted-foreground leading-relaxed">
                נזלת אלרגית, קוצר נשימה ופריחה יכולים להתרחש בתקופות שונות. ד"ר אנה ברמלי מסבירה שמוטב לפנות לבדיקת אלרגיה כדי לזהות את הגורם ולגבש תכנית ניטרול תסמינים. לתיאום פגישה – ihaveallergy.com.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">מה עושים אם מופיע תסמינים חריפים או נפיחות?</h3>
              <p className="text-muted-foreground leading-relaxed">
                במקרה של קוצר נשימה/עור מפריש/תגובה חריפה - פנו לקבלת טיפול דחוף. כאשר התסמינים שונים, כדאי לפנות לרופא אלרגיה לייעוץ מהיר. בהמשך אפשר לתאם תור לעוד הערכה דרך ihaveallergy.com.
              </p>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-background rounded-xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">מה כולל התהליך כשמתארים פנייה לד"ר אנה ברמלי?</h3>
              <p className="text-muted-foreground leading-relaxed">
                בדרך כלל מתחיל בקליניקה עם סקירה והגדרת מטרות הבדיקה, ולאחר מכן תכנון מעקב ובדיקות מתאימות. ד"ר אנה ברמלי תסביר את השלבים ותציע המשך תמיכה במסגרת ihaveallergy.com. אם יש צורך, מומלץ להיבדק אצל רופאת אלרגיה. לתיאום תור – ihaveallergy.com.
              </p>
            </motion.article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-spacing-lg bg-surface-warm">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-bold text-foreground mb-4">
              מתי כדאי להיבדק?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
              כאשר יש תגובות חוזרות: פריחה, שיעול, נפיחות או בעיות נשימה לאחר חשיפה למזון, תרופה, עקיצה או אבקנים.
            </p>
            <Button size="lg" asChild>
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
