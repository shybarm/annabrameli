import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Clock,
  TestTube2,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Baby,
  Heart,
  Droplets,
} from "lucide-react";
import { AuthorBadge } from "@/components/blog/AuthorBadge";
import { ArticleCTA } from "@/components/blog/ArticleCTA";
import { FAQAccordion } from "@/components/ui/faq-accordion";

const testTypes = [
  {
    name: "תבחיני עור (Skin Prick Test)",
    age: "מגיל 4 חודשים",
    duration: "20-30 דקות",
    what: "טיפות של אלרגנים מונחות על העור עם דקירה קלה. תגובה מקומית (נפיחות) תוך 15-20 דקות.",
    pros: ["תוצאות מיידיות", "מדויקות מאוד", "ניתן לבדוק עשרות אלרגנים בו-זמנית"],
    cons: ["דורש הפסקת אנטיהיסטמינים 5-7 ימים לפני", "לא מתאים לילדים עם אגזמה מפושטת"],
    when: "הבדיקה הראשונה בהערכת אלרגיה למזון, לנשימה, או תגובה לא ברורה.",
  },
  {
    name: "בדיקת דם (IgE ספציפי)",
    age: "כל גיל",
    duration: "דקיקורית אחת (תוצאות תוך ימים)",
    what: "בדיקת דם שמודדת נוגדנים (IgE) כלפי אלרגנים ספציפיים. מתבצעת במעבדה.",
    pros: ["אין צורך להפסיק תרופות", "מתאימה לילדים עם אגזמה קשה", "ניתן לבדוק מרכיבים ספציפיים (Component Testing)"],
    cons: ["תוצאות לא מיידיות", "פחות ספציפית מתבחיני עור לחלק מהאלרגנים"],
    when: "כשלא ניתן לבצע תבחיני עור, או כהשלמה לתמונה הקלינית.",
  },
  {
    name: "מבחן מאכל (Oral Food Challenge)",
    age: "כל גיל, בליווי רפואי",
    duration: "2-4 שעות",
    what: "הילד מקבל כמויות הולכות וגדלות של המזון החשוד, תחת השגחה רפואית צמודה בבית חולים או מרפאה.",
    pros: ["הבדיקה המדויקת ביותר – ״תקן הזהב״", "מאפשרת לשלול אלרגיה ולהחזיר מזונות"],
    cons: ["דורשת זמן ומקום מאובזר", "סיכון מבוקר לתגובה"],
    when: "לאישוש או שלילה של אלרגיה, לפני החלטה להחזיר מזון.",
  },
  {
    name: "תבחיני מדבקה (Patch Test)",
    age: "כל גיל",
    duration: "48-72 שעות (מדבקות על הגב)",
    what: "מדבקות עם אלרגנים מודבקות על הגב ונקראות אחרי 48 ו-72 שעות. בודקות תגובה מושהית (Type IV).",
    pros: ["מזהה דרמטיטיס ממגע", "לא כואב"],
    cons: ["לא בודק אלרגיה מיידית (Type I)", "דורש שתי ביקורות"],
    when: "חשד לדרמטיטיס ממגע – תגובות עור לחומרים, תכשירים או מתכות.",
  },
];

const privatVsPublic = [
  {
    aspect: "זמן המתנה",
    private: "ימים עד שבועות",
    public: "חודשים עד חצי שנה",
  },
  {
    aspect: "משך ביקור",
    private: "30-60 דקות",
    public: "15-20 דקות",
  },
  {
    aspect: "בדיקות באותו ביקור",
    private: "כן – תבחיני עור + ייעוץ",
    public: "לעיתים דורש ביקורים נפרדים",
  },
  {
    aspect: "עלות",
    private: "300-800 ₪ לביקור (תלוי בהיקף)",
    public: "השתתפות עצמית בלבד",
  },
  {
    aspect: "גמישות",
    private: "בחירת רופא, שעות גמישות",
    public: "מוגבל לרופא ושעות הקופה",
  },
];

const faqs = [
  {
    question: "מאיזה גיל אפשר לעשות בדיקות אלרגיה?",
    answer:
      "תבחיני עור ניתן לבצע כבר מגיל 4 חודשים, ובדיקות דם – בכל גיל. הבדיקה נבחרת בהתאם לגיל הילד, סוג החשד, ומצב העור. אלרגולוג ילדים ידע להתאים את הבדיקה הנכונה.",
  },
  {
    question: "כמה עולות בדיקות אלרגיה פרטיות?",
    answer:
      "ביקור אלרגולוג פרטי עם תבחיני עור עולה בדרך כלל בין 300 ל-800 ₪, תלוי בהיקף הבדיקה ובמספר האלרגנים. בדיקות דם נוספות נעות בין 100 ל-400 ₪. מומלץ לבדוק מול קופת החולים אם ניתן לקבל החזר חלקי.",
  },
  {
    question: "האם צריך להפסיק תרופות לפני בדיקת אלרגיה?",
    answer:
      "לתבחיני עור – כן. יש להפסיק אנטיהיסטמינים (כמו צטריזין, לורטדין) 5-7 ימים לפני הבדיקה. לבדיקות דם – אין צורך להפסיק שום תרופה. האלרגולוג ינחה אתכם מראש.",
  },
  {
    question: "מה ההבדל בין אלרגיה לאי-סבילות?",
    answer:
      "אלרגיה היא תגובה של מערכת החיסון (IgE), שיכולה להיות מסכנת חיים. אי-סבילות (כמו אי-סבילות ללקטוז) היא בעיה עיכולית – לא נעימה, אבל לא מסוכנת. בדיקות אלרגיה בודקות את התגובה החיסונית.",
  },
  {
    question: "האם בדיקה שלילית אומרת שאין אלרגיה?",
    answer:
      "בדיקה שלילית מפחיתה מאוד את הסיכוי לאלרגיה, אבל לא שוללת לגמרי. לפעמים נדרש מבחן מאכל (Oral Food Challenge) לאישור סופי. ההחלטה תמיד נעשית על סמך התמונה הקלינית המלאה – לא רק על סמך בדיקה אחת.",
  },
  {
    question: "איפה עושים בדיקות אלרגיה בישראל?",
    answer:
      "בדיקות אלרגיה מבוצעות במרפאות אלרגולוגיה בקופות החולים (הפניה מרופא ילדים), בבתי חולים, ובמרפאות פרטיות. מבחן מאכל מבוצע רק בסביבה מפוקחת רפואית (בית חולים או מרפאה מאובזרת).",
  },
];

const GoldenGuideTesting = () => {
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
    headline: "בדיקות אלרגיה לילדים בישראל: איזה בדיקה מתאימה, מתי ואיפה",
    description:
      "מדריך מקיף להורים: סוגי בדיקות אלרגיה לילדים, מתי לעשות כל בדיקה, כמה עולה פרטי מול ציבורי, ומה לצפות בביקור אצל אלרגולוג.",
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
    about: {
      "@type": "MedicalProcedure",
      name: "Allergy Testing",
      alternateName: "בדיקות אלרגיה",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ראשי", item: "https://ihaveallergy.com/" },
      { "@type": "ListItem", position: 2, name: "מדריכים", item: "https://ihaveallergy.com/blog" },
      { "@type": "ListItem", position: 3, name: "בדיקות אלרגיה לילדים" },
    ],
  };

  return (
    <>
      <Helmet>
        <title>בדיקות אלרגיה לילדים בישראל: מדריך מלא להורים | ד״ר אנה ברמלי</title>
        <meta
          name="description"
          content="מדריך מקיף: סוגי בדיקות אלרגיה לילדים (תבחיני עור, דם, מבחן מאכל), עלויות פרטי מול ציבורי, מאיזה גיל, ומה לצפות. נסקר רפואית ע״י אלרגולוגית ילדים."
        />
        <link rel="canonical" href="https://ihaveallergy.com/guides/בדיקות-אלרגיה-ילדים-ישראל" />
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
            <span className="text-foreground">בדיקות אלרגיה לילדים</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full mb-5">
              מדריך בדיקות
            </span>
            <h1 className="font-bold text-foreground mb-6 text-balance">
              בדיקות אלרגיה לילדים בישראל
              <span className="block text-primary mt-2 text-[22px] md:text-[28px] lg:text-[32px]">
                איזה בדיקה מתאימה, מתי ואיפה
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />9 דקות קריאה</span>
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
              הבן שלכם בן שנתיים. אחרי שנה שלמה של פריחות, גירודים, ולילות בלי שינה – רופא הילדים אמר לכם: ״כדאי לבדוק אלרגיה.״
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              עכשיו אתם מול ים של אפשרויות: <strong className="text-foreground">בדיקת דם? תבחין עור? פרטי או ציבורי? ומה בכלל בודקים?</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              נשימה. המדריך הזה מסביר בדיוק מה כל בדיקה עושה, למי היא מתאימה, ואיך לבחור נכון – בלי ללכת לאיבוד.
            </p>
          </div>
        </motion.section>

        {/* Test types */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12" id="test-types">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <TestTube2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">סוגי בדיקות אלרגיה – מדריך השוואתי</h2>
          </div>

          <div className="space-y-5">
            {testTypes.map((test, index) => (
              <motion.div
                key={test.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="bg-card rounded-2xl border border-border/60 p-5 md:p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-3">{test.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground">גיל מינימלי: </span>
                    <span className="font-medium text-foreground">{test.age}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">משך: </span>
                    <span className="font-medium text-foreground">{test.duration}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{test.what}</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-foreground mb-2">יתרונות</p>
                    <ul className="space-y-1.5">
                      {test.pros.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent-foreground mt-0.5 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground mb-2">מגבלות</p>
                    <ul className="space-y-1.5">
                      {test.cons.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 bg-accent/30 rounded-xl px-4 py-3">
                  <p className="text-xs text-foreground">
                    <strong>מתי בוחרים בבדיקה הזו:</strong> {test.when}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Inline CTA */}
        <ArticleCTA variant="inline" />

        {/* Private vs Public */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="my-12" id="private-vs-public">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">פרטי מול ציבורי – מה מתאים לכם?</h2>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-5">
            שני המסלולים תקפים ומקצועיים. ההבדלים הם בעיקר <strong className="text-foreground">בזמינות, בזמן ביקור, ובעלות.</strong>
          </p>

          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-3 bg-accent/40 px-5 py-3 text-sm font-medium text-foreground">
              <span></span>
              <span>פרטי</span>
              <span>ציבורי (קופ״ח)</span>
            </div>
            {privatVsPublic.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 px-5 py-3 text-sm ${i % 2 === 0 ? "bg-card" : "bg-accent/10"}`}>
                <span className="font-medium text-foreground">{row.aspect}</span>
                <span className="text-muted-foreground">{row.private}</span>
                <span className="text-muted-foreground">{row.public}</span>
              </div>
            ))}
          </div>

          <p className="text-muted-foreground leading-relaxed mt-5">
            <strong className="text-foreground">אין ״נכון״ ו״לא נכון״.</strong> אם הילד מגרד לילות שלמים – שבועות של המתנה זה עינוי. אם הבדיקה לא דחופה – המסלול הציבורי עובד מצוין.
          </p>
        </motion.section>

        {/* What to expect */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12" id="what-to-expect">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">מה קורה בביקור אצל אלרגולוג?</h2>
          </div>

          <div className="space-y-4">
            {[
              { step: "1", title: "סיפור רפואי מפורט (אנמנזה)", desc: "האלרגולוג שואל על תסמינים, תזמון, תזונה, היסטוריה משפחתית. הכינו מראש: מתי זה התחיל, מה הילד אכל, ותמונות של הפריחה." },
              { step: "2", title: "בדיקה גופנית", desc: "בדיקת עור, נשימה, וסימנים כלליים. באגזמה – הערכת חומרה." },
              { step: "3", title: "בדיקות אלרגיה (לפי צורך)", desc: "תבחיני עור ו/או הפניה לבדיקות דם. לא תמיד הכל נעשה באותו ביקור." },
              { step: "4", title: "הסבר ותוכנית טיפול", desc: "האלרגולוג מסביר את הממצאים, מה האבחנה, ומה התוכנית הבאה – כולל תזונה, תרופות, ומעקב." },
              { step: "5", title: "מסמכים", desc: "אישור אלרגיה לגן/בית ספר, מרשמים, ובמידת הצורך – תוכנית פעולה (Action Plan) לשימוש באפיפן." },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="flex gap-4 items-start"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold text-sm">{item.step}</span>
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* OIT / desensitization teaser */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12" id="oit">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">מעבר לאבחון: טיפול בדסנסיטיזציה (OIT)</h2>
          </div>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              אם הילד מאובחן עם אלרגיה למזון, אחת האפשרויות המתקדמות היא <strong className="text-foreground">טיפול בדסנסיטיזציה (Oral Immunotherapy – OIT)</strong>. בטיפול זה, הילד מקבל כמויות קטנות והולכות וגדלות של האלרגן, תחת פיקוח רפואי, במטרה ללמד את מערכת החיסון לסבול את המזון.
            </p>
            <p>
              ישראל נחשבת למובילה עולמית ב-OIT, עם מרכזים מומחים בבתי חולים ובמרפאות פרטיות. הטיפול מתאים לילדים מגיל שנתיים ומעלה, ודורש התחייבות של ההורים לנטילה יומית.
            </p>
            <p>
              <strong className="text-foreground">לא כל ילד מתאים ל-OIT</strong> – האלרגולוג יעריך את הסיכון מול התועלת ויכווין אתכם.
            </p>
          </div>
        </motion.section>

        {/* Internal links hub */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-5">מדריכים נוספים</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { to: "/guides/טעימות-ראשונות-אלרגנים", label: "טעימות ראשונות – מדריך חשיפה לאלרגנים" },
              { to: "/guides/זכויות-ילד-אלרגי-ישראל", label: "זכויות של ילד אלרגי בישראל" },
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
              { to: "/knowledge/תבחיני-עור-כואב-לילדים", label: "תבחיני עור – האם זה כואב?" },
              { to: "/knowledge/בדיקת-דם-לאלרגיה-ילדים", label: "בדיקת דם לאלרגיה – מתי מספיקה?" },
              { to: "/knowledge/תגר-מזון-איך-זה-נראה", label: "תגר מזון – איך זה נראה בפועל?" },
              { to: "/knowledge/בדיקה-חיובית-בלי-תסמינים", label: "בדיקה חיובית בלי תסמינים" },
              { to: "/knowledge/בדיקות-אלרגיה-פרטי-או-קופה", label: "פרטי או קופה – מתי זה משנה?" },
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
              <strong className="text-foreground">הבהרה רפואית:</strong> המידע בעמוד זה נועד לצרכי הסברה בלבד ואינו מהווה תחליף לייעוץ רפואי מקצועי. כל החלטה בנוגע לבריאות ילדכם צריכה להתקבל בהתייעצות עם רופא מוסמך.
            </p>
            <p>תוכן זה נכתב ונסקר רפואית על ידי ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה ורופאת ילדים. עודכן לאחרונה: פברואר 2026.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoldenGuideTesting;
