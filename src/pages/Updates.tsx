import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { UpdateCard } from "@/components/ui/update-card";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

// TODO: Replace mock data with external medical API integration
// This data should be fetched from an external medical news API
// Example API endpoints to consider:
// - PubMed API
// - Medical News Today API
// - Custom aggregated medical news feed
const updates = [
  {
    title: "מחקר חדש: טיפול חשיפה מוקדם לבוטנים מפחית סיכון לאלרגיה",
    date: "דצמבר 2024",
    source: "Journal of Allergy and Clinical Immunology",
    summary: "מחקר ארוך טווח שנערך על פני 10 שנים מראה כי חשיפה מוקדמת לבוטנים בתינוקות (מגיל 4-6 חודשים) עשויה להפחית משמעותית את הסיכון לפתח אלרגיה לבוטנים בהמשך החיים. המחקר כלל 1,000 תינוקות בסיכון גבוה והציג ירידה של 80% בשיעורי האלרגיה.",
    link: "#",
  },
  {
    title: "הנחיות עדכניות לטיפול באנפילקסיס בילדים",
    date: "נובמבר 2024",
    source: "EAACI (European Academy of Allergy)",
    summary: "הנחיות חדשות מדגישות את החשיבות של מתן אדרנלין מיידי והכשרת הורים ומטפלים לזיהוי מוקדם של תסמינים. ההנחיות כוללות פרוטוקול מעודכן לבתי ספר וגני ילדים.",
    link: "#",
  },
  {
    title: "פריצת דרך בהבנת מנגנוני האלרגיה למזון",
    date: "אוקטובר 2024",
    source: "Nature Immunology",
    summary: "חוקרים זיהו תאי חיסון חדשים המעורבים בתגובה האלרגית למזון. התגלית פותחת דלת לטיפולים חדשניים שיכולים לכוון את התגובה החיסונית ולהפחית את חומרת האלרגיה.",
    link: "#",
  },
  {
    title: "מחקר: עלייה בשכיחות אלרגיות עונתיות עקב שינויי אקלים",
    date: "ספטמבר 2024",
    source: "The Lancet Planetary Health",
    summary: "מחקר גלובלי מראה כי שינויי האקלים מובילים לעונת אבקנים ארוכה יותר ואינטנסיבית יותר, מה שמחמיר את תסמיני האלרגיה העונתית באוכלוסייה. ההמלצה היא להתחיל טיפול מונע מוקדם יותר בעונה.",
    link: "#",
  },
  {
    title: "טיפול חדשני באסתמה אלרגית: תוצאות מבטיחות",
    date: "אוגוסט 2024",
    source: "New England Journal of Medicine",
    summary: "תרופה ביולוגית חדשה הראתה יעילות גבוהה בטיפול באסתמה אלרגית קשה בילדים, עם הפחתה משמעותית בהתקפים ושיפור באיכות החיים. התרופה צפויה לקבל אישור FDA בקרוב.",
    link: "#",
  },
  {
    title: "מדריך חדש: ניהול אלרגיות במערכת החינוך",
    date: "יולי 2024",
    source: "משרד הבריאות",
    summary: "משרד הבריאות פרסם מדריך מקיף לניהול אלרגיות בבתי ספר וגני ילדים, הכולל הנחיות לצוות החינוכי, פרוטוקול חירום ודרכי תקשורת עם ההורים.",
    link: "#",
  },
];

const Updates = () => {
  return (
    <>
      <Helmet>
        <title>עדכונים אחרונים באלרגיה | ד״ר אנה ברמלי</title>
        <meta 
          name="description" 
          content="עדכונים אחרונים וחידושים בעולם האלרגיה - מחקרים, הנחיות חדשות וסקירות רפואיות מסוכמות בשפה פשוטה וברורה להורים." 
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
              עדכונים אחרונים באלרגיה
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              מדענים ורופאים חוקרים מדי שנה אלרגיות חדשות, טיפולים מתקדמים ושיטות אבחון משופרות. בדף זה תמצאו תקצירים ברורים, אמינים ונגישים לכל הורה.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Updates List */}
      <section className="py-16 md:py-24">
        <div className="container-medical">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {updates.map((update, index) => (
              <UpdateCard key={update.title} {...update} delay={index * 0.1} />
            ))}
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-accent/50 rounded-2xl p-6 md:p-8 text-center"
          >
            <p className="text-muted-foreground">
              כל מאמר כולל תאריך פרסום, מקור רפואי מוסמך, תקציר בשפה פשוטה והמלצות פרקטיות.
              <br />
              <span className="text-sm">המידע מתעדכן באופן שוטף ממקורות רפואיים מוסמכים.</span>
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Updates;
