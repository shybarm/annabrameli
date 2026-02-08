import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Clock,
  ShieldCheck,
  FileText,
  School,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  ClipboardList,
  Users,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthorBadge } from "@/components/blog/AuthorBadge";
import { ArticleCTA } from "@/components/blog/ArticleCTA";
import { FAQAccordion } from "@/components/ui/faq-accordion";

const WHATSAPP_URL =
  "https://wa.me/972545808008?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%99%D7%99%D7%A2%D7%95%D7%A5%20%D7%9C%D7%92%D7%91%D7%99%20%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA%20%D7%99%D7%9C%D7%93%20%D7%90%D7%9C%D7%A8%D7%92%D7%99";

const educationRights = [
  {
    title: "התאמות תזונתיות בגן ובצהרון",
    desc: "המוסד החינוכי חייב להבטיח שהילד מקבל ארוחות בטוחות ומותאמות. ההורים רשאים לדרוש תפריט נפרד או להביא אוכל מהבית.",
  },
  {
    title: "אחזקת אפיפן / תרופות חירום",
    desc: "על פי חוזר מנכ\"ל משרד החינוך, המוסד נדרש לאחסן תרופות חירום (כולל אפיפן) ולוודא שלפחות איש צוות אחד יודע להשתמש בהן.",
  },
  {
    title: "תוכנית פעולה אישית (Action Plan)",
    desc: "ההורים זכאים לספק תוכנית פעולה רפואית שנכתבה על ידי אלרגולוג. המוסד מחויב ליישם אותה.",
  },
  {
    title: "הדרכת צוות",
    desc: "הצוות החינוכי חייב לעבור הדרכה בסיסית לזיהוי תגובה אלרגית ושימוש באפיפן. ניתן לדרוש זאת דרך הנהלת המוסד.",
  },
  {
    title: "סייעת רפואית",
    desc: "במקרים חמורים, ניתן לפנות לוועדת שילוב ולבקש סייעת רפואית שתלווה את הילד בשעות הפעילות.",
  },
];

const checklist = [
  "קבלו אישור רפואי מאלרגולוג עם פירוט האלרגנים",
  "הכינו תוכנית פעולה (Action Plan) עם הוראות חירום",
  "ודאו שיש אפיפן תקף במוסד החינוכי",
  "העבירו את המסמכים להנהלת הגן/בית הספר",
  "בקשו פגישה עם צוות הגן לסקירת הנהלים",
  "ודאו שהצוות עבר הדרכה לשימוש באפיפן",
  "בדקו שתפריט הארוחות מותאם",
  "עדכנו בתחילת כל שנה ובכל שינוי רפואי",
];

const whenToFight = [
  "המוסד מסרב לאחסן אפיפן או תרופות חירום",
  "הילד נחשף לאלרגן שהובא לידיעת המוסד",
  "אין הדרכה לצוות למרות בקשה חוזרת",
  "הילד מודר מפעילויות (ימי הולדת, טיולים) בגלל האלרגיה",
  "המוסד דורש מההורים להישאר במקום כ\"תנאי\" לקבלת הילד",
];

const faqs = [
  {
    question: "האם הגן חייב לקבל ילד עם אלרגיה למזון?",
    answer:
      "כן. על פי חוק, מוסד חינוכי אינו רשאי לסרב לקבל ילד בגלל מצב רפואי, כולל אלרגיה למזון. המוסד מחויב לבצע התאמות סבירות כדי להבטיח את בטיחות הילד, כולל התאמות תזונתיות ואחזקת תרופות חירום.",
  },
  {
    question: "מי אחראי לתת אפיפן בגן?",
    answer:
      "לפי חוזר מנכ\"ל משרד החינוך, לפחות שני אנשי צוות בכל מוסד חינוכי צריכים לדעת להשתמש באפיפן. ההורים מספקים את המכשיר והוראות השימוש, והמוסד אחראי לוודא שהצוות מודרך ושהמכשיר נגיש.",
  },
  {
    question: "מה זו תוכנית פעולה אישית (Action Plan)?",
    answer:
      "תוכנית פעולה היא מסמך רפואי שנכתב על ידי אלרגולוג ומפרט: מהם האלרגנים של הילד, מהם סימני תגובה אלרגית, מתי לתת אנטיהיסטמין ומתי אפיפן, ומתי להזמין אמבולנס. המסמך מועבר למוסד החינוכי ונשמר במקום נגיש.",
  },
  {
    question: "מתי אפשר לבקש סייעת רפואית?",
    answer:
      "ניתן לפנות לוועדת שילוב עם מסמכים רפואיים מאלרגולוג ומכתב המתאר את רמת הסיכון. סייעת רפואית מוקצית במקרים שבהם הילד צריך השגחה צמודה – למשל, אנפילקסיס חוזר, אלרגיות מרובות, או גיל צעיר מאוד.",
  },
  {
    question: "מה עושים כשהגן מסרב לשתף פעולה?",
    answer:
      "ראשית, תעדו הכל בכתב. שנית, פנו בכתב למנהל/ת המוסד ולפיקוח. אם אין מענה – ניתן לפנות למשרד החינוך, לנציב תלונות הציבור, או לארגוני הורים לילדים אלרגיים. במקרים חמורים, ניתן להתייעץ עם עורך דין.",
  },
  {
    question: "האם ילד אלרגי יכול להשתתף בטיולים?",
    answer:
      "בהחלט כן. המוסד חייב לוודא שיש אפיפן תקף בטיול, שאיש צוות מודרך נוכח, ושהתזונה בטיולים בטוחה לילד. אי אפשר למנוע מילד להשתתף בטיול בגלל אלרגיה – זו הפליה.",
  },
];

const GoldenGuideRights = () => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    headline: "זכויות של ילד אלרגי בישראל: גן, בית ספר וצהרונים",
    description:
      "מדריך מקיף להורים: מהן הזכויות של ילד עם אלרגיה למזון במערכת החינוך הישראלית, איך לדרוש התאמות, ומתי לפנות לגורמים נוספים.",
    datePublished: "2026-02-08",
    dateModified: "2026-02-08",
    author: {
      "@type": "Physician",
      name: "ד״ר אנה ברמלי",
      alternateName: "Dr. Anna Brameli",
      medicalSpecialty: ["Allergy and Immunology", "Pediatrics"],
      url: "https://ihaveallergy.com/about",
    },
    publisher: { "@type": "Organization", name: "ihaveallergy.com" },
    specialty: "Allergy and Immunology",
    audience: { "@type": "MedicalAudience", audienceType: "Patient" },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ראשי", item: "https://ihaveallergy.com/" },
      { "@type": "ListItem", position: 2, name: "מדריכים", item: "https://ihaveallergy.com/blog" },
      { "@type": "ListItem", position: 3, name: "זכויות ילד אלרגי" },
    ],
  };

  return (
    <>
      <Helmet>
        <title>זכויות של ילד אלרגי בישראל: גן, בית ספר וצהרונים | ד״ר אנה ברמלי</title>
        <meta
          name="description"
          content="מדריך מלא להורים: מהן הזכויות של ילד עם אלרגיה למזון בגן ובבית הספר, איך לדרוש אפיפן, תוכנית פעולה וסייעת רפואית. צ'קליסט מוכן להורדה."
        />
        <link rel="canonical" href="https://ihaveallergy.com/guides/זכויות-ילד-אלרגי-ישראל" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="gradient-hero py-14 md:py-20">
        <div className="container-medical max-w-3xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">ראשי</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <Link to="/blog" className="hover:text-foreground transition-colors">בלוג</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-foreground">זכויות ילד אלרגי</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full mb-5">
              מדריך זכויות
            </span>
            <h1 className="font-bold text-foreground mb-6 text-balance">
              זכויות של ילד אלרגי בישראל
              <span className="block text-primary mt-2 text-[22px] md:text-[28px] lg:text-[32px]">
                גן, בית ספר וצהרונים
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />7 דקות קריאה</span>
              <span>עודכן: פברואר 2026</span>
            </div>
            <AuthorBadge compact />
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <div className="container-medical max-w-3xl py-12 md:py-16">
        {/* Emotional opening */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
          <div className="bg-surface-warm rounded-2xl p-7 border border-border/40 mb-8">
            <p className="text-lg text-foreground leading-relaxed mb-4">
              הילדה שלכם אלרגית לבוטנים. בשבוע הבא היא מתחילה בגן. ואתם יודעים שבגן יש חגיגות יום הולדת, ארוחות עשר, ופעילויות עם אוכל – כל יום.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              השאלה שלא נותנת לכם לישון: <strong className="text-foreground">״מה יקרה כשאני לא שם?״</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              המדריך הזה נכתב כדי לתת לכם כלים ברורים. יש לילד שלכם זכויות – וחשוב שתכירו אותן.
            </p>
          </div>
        </motion.section>

        {/* Education Rights */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12" id="education-rights">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <School className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">הזכויות שלכם במערכת החינוך</h2>
          </div>

          <div className="space-y-4">
            {educationRights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="bg-card rounded-2xl border border-border/60 p-5 md:p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Checklist */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12" id="checklist">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">צ׳קליסט: הכנה לתחילת שנה</h2>
          </div>

          <div className="bg-card rounded-2xl border border-border/60 p-6">
            <div className="space-y-3">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Inline CTA */}
        <ArticleCTA variant="inline" />

        {/* When to escalate */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="my-12" id="when-to-escalate">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">מתי להעלות הילוך – מצבים שדורשים פנייה</h2>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-5">
            ברוב המקרים, שיחה פתוחה עם צוות הגן מספיקה. אבל אם נתקלתם באחד מהמצבים הבאים – <strong className="text-foreground">מגיע לכם להיאבק:</strong>
          </p>

          <div className="bg-destructive/5 rounded-2xl border border-destructive/20 p-6 space-y-3">
            {whenToFight.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive mt-1 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>

          <p className="text-muted-foreground leading-relaxed mt-5">
            תמיד תעדו בכתב (מייל, לא שיחת טלפון). אם צריך – פנו לפיקוח על הגנים, למשרד החינוך, או לעורך דין. הזכויות של הילד שלכם מעוגנות בחוק.
          </p>
        </motion.section>

        {/* Action Plan section */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12" id="action-plan">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">מה כוללת תוכנית פעולה טובה?</h2>
          </div>

          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              תוכנית פעולה (Allergy Action Plan) היא הכלי הכי חשוב שיש לכם. היא מתורגמת לשפה שצוות הגן מבין, וממפה בדיוק מה לעשות ברגע של תגובה.
            </p>
            <div className="bg-card rounded-2xl border border-border/60 p-6 space-y-3">
              {[
                "שם הילד, תמונה, ותאריך לידה",
                "רשימת אלרגנים מאובחנים",
                "תסמינים קלים + הוראות (אנטיהיסטמין, מנוחה, השגחה)",
                "תסמינים חמורים + הוראות (אפיפן + 101)",
                "פרטי קשר של ההורים והאלרגולוג",
                "תאריך ותוקף המסמך",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
            <p>
              <strong className="text-foreground">אלרגולוג ילדים יכול לכתוב תוכנית פעולה מותאמת אישית</strong> – זה חלק מהייעוץ, ולרוב מכוסה בביטוח הבריאות.
            </p>
          </div>
        </motion.section>

        {/* Internal links hub */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-5">מדריכים נוספים</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { to: "/guides/טעימות-ראשונות-אלרגנים", label: "טעימות ראשונות – מדריך חשיפה לאלרגנים" },
              { to: "/guides/בדיקות-אלרגיה-ילדים-ישראל", label: "בדיקות אלרגיה לילדים בישראל" },
              { to: "/services", label: "השירותים שלנו – בדיקות וייעוץ" },
              { to: "/about", label: "אודות ד״ר אנה ברמלי" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 bg-card rounded-xl p-4 border border-border/60 card-hover group text-sm"
              >
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-foreground group-hover:text-primary transition-colors font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Satellite articles hub */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-5">הרחבות חשובות להורים</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { to: "/knowledge/גן-יכול-לסרב-לילד-אלרגי", label: "האם גן יכול לסרב לילד אלרגי?" },
              { to: "/knowledge/אפיפן-בגן-מי-אחראי", label: "אפיפן בגן – מי אחראי?" },
              { to: "/knowledge/סייעת-רפואית-לילד-אלרגי", label: "סייעת רפואית – מי זכאי?" },
              { to: "/knowledge/טיול-שנתי-ילד-אלרגי", label: "טיול שנתי עם ילד אלרגי" },
              { to: "/knowledge/אישור-אלרגיה-למשרד-החינוך", label: "אישור אלרגיה למשרד החינוך" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 bg-surface-warm rounded-xl p-4 border border-border/40 card-hover group text-sm"
              >
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-foreground group-hover:text-primary transition-colors font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12" id="faq">
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
              <strong className="text-foreground">הבהרה:</strong> המידע בעמוד זה נועד לצרכי הסברה בלבד ואינו מהווה ייעוץ משפטי. לייעוץ משפטי פרטני, פנו לעורך דין. המידע הרפואי נסקר על ידי ד״ר אנה ברמלי.
            </p>
            <p>עודכן לאחרונה: פברואר 2026.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoldenGuideRights;
