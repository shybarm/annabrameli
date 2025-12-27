import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { motion } from "framer-motion";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

const faqCategories = [
  {
    title: "אלרגיה למזון",
    items: [
      {
        question: "האם אלרגיה למזון יכולה להופיע בפתאומיות?",
        answer: "כן. גם אם הילד אכל מזון מסוים בעבר ללא תגובה, אלרגיה יכולה להתפתח בהמשך החיים. מערכת החיסון משתנה, ולעיתים החשיפה דווקא מחזקת את הרגישות."
      },
      {
        question: "איך אדע אם מדובר בהרעלה ולא באלרגיה?",
        answer: "אלרגיה מופיעה לרוב תוך דקות ועד שעתיים מחשיפה, ומלווה בפריחה, נפיחות, גרד או קוצר נשימה. הרעלה כוללת לרוב חום, כאבי בטן והקאות ממושכות — ומתחילה רק אחרי שעות."
      },
      {
        question: "האם אלרגיה למזון יכולה לעבור עם הזמן?",
        answer: "כן — חלק מאלרגיות, בעיקר לחלב, ביצים וחיטה, עשויות לחלוף עם הגדילה. אלרגיות לבוטנים, אגוזים ודגים לרוב נשארות לאורך שנים."
      },
      {
        question: "מה לעשות במקרה של תגובה ראשונית?",
        answer: "להפסיק מיד את האכילה, לתעד תמונות של הפריחה או הנפיחות, ולהתייעץ עם מומחה לאלרגיות. במקרה של תסמינים חמורים — לפנות מיידית למיון."
      },
      {
        question: "האם צריך להחזיק מזרק אדרנלין בבית?",
        answer: "רק לאחר הנחיה מרופא. במצבים מסכני חיים — זו תרופת החירום הראשונה. הרופא יחליט בהתאם לחומרת האלרגיה והסיכון."
      },
    ]
  },
  {
    title: "אלרגיה לחלב",
    items: [
      {
        question: "איך מבדילים בין אלרגיה לחלב לבין אי-סבילות ללקטוז?",
        answer: "אלרגיה מערבת מערכת חיסון — עם פריחה, נפיחות או קשיי נשימה. אי-סבילות ללקטוז גורמת בעיקר לגזים ושלשולים ואינה כוללת תגובה חיסונית."
      },
      {
        question: "האם ניתן להחליף פורמולה לתינוק אלרגי?",
        answer: "כן — קיימות פורמולות מפורקות (הידרוליזאטים) או צמחיות. המערכת החיסונית אינה מגיבה לחלבון שעבר פירוק. יש להתייעץ עם רופא לבחירה המתאימה."
      },
      {
        question: "האם ילד אלרגי לחלב יכול לצרוך מוצרי חלב אפויים?",
        answer: "בחלק מהמקרים זה אפשרי, כי האפייה משנה את מבנה החלבון. אך זה צריך להיבדק רק לאחר בדיקה מסודרת במרפאת אלרגיה ולא בניסוי עצמאי."
      },
    ]
  },
  {
    title: "אלרגיה לבוטנים",
    items: [
      {
        question: "מה ההבדל בין אלרגיה לבוטנים לבין אלרגיה לאגוזים?",
        answer: "בוטנים אינם אגוזים מבחינה בוטנית — הם קטניות. ולכן התגובה שונה. אך מי שאלרגי לבוטנים עלול להיות רגיש גם לאגוזים אחרים, ולהפך."
      },
      {
        question: "האם יש טיפול שמפחית את האלרגיה?",
        answer: "במקרים מסוימים ניתן לבצע טיפול חשיפה מבוקר (אימונותרפיה) במרפאה מיוחדת. הטיפול מפחית את הסיכון לתגובה חמורה אך דורש מעקב צמוד."
      },
      {
        question: "האם הילדים חייבים לשאת אדרנלין?",
        answer: "אם מדובר באלרגיה מוכחת עם סיכון לתגובה חמורה — כן. זה מציל חיים. הרופא יקבע את הצורך בהתאם לאבחון."
      },
    ]
  },
  {
    title: "אלרגיה לתרופות",
    items: [
      {
        question: "האם רגישות לפניצילין פירושה שאסור לקחת את כל משפחת האנטיביוטיקות?",
        answer: "לא. לרוב יש תרופות חלופיות בטוחות לחלוטין — והרופא יתאים אותן למטופל. בנוסף, רבים מהאנשים שחושבים שהם אלרגיים לפניצילין — אינם אלרגיים בפועל."
      },
      {
        question: "איך מאבחנים אלרגיה לתרופות?",
        answer: "באמצעות בדיקות עור, בדיקות דם, או תגר תרופתי במרפאה — תחת השגחה מלאה. התהליך בטוח ומבוצע בהדרגה."
      },
      {
        question: "האם ניתן לבטל 'אלרגיה' לתרופה שנרשמה לפני שנים?",
        answer: "בהחלט. פעמים רבות אלרגיה שאובחנה בילדות אינה קיימת בבגרות. בדיקה מסודרת יכולה להסיר את ה'תווית' ולאפשר שימוש בתרופה."
      },
    ]
  },
  {
    title: "אלרגיה לדבורים ועקיצות חרקים",
    items: [
      {
        question: "האם כל נפיחות אחרי עקיצה היא אלרגיה?",
        answer: "לא. נפיחות מקומית גדולה היא תגובה נפוצה ולא מעידה בהכרח על אלרגיה מסכנת חיים. אלרגיה אמיתית כוללת תסמינים מערכתיים."
      },
      {
        question: "מתי העקיצה מסוכנת?",
        answer: "כאשר מופיעים: קוצר נשימה, סחרחורת, נפיחות בפנים או ירידת לחץ דם. אלה סימנים לאנפילקסיס הדורש טיפול מיידי."
      },
      {
        question: "האם יש טיפול שמעלים את האלרגיה?",
        answer: "כן — טיפול חיסוני (אימונותרפיה) שמפחית את הסיכון לתגובה חמורה. הטיפול נמשך מספר שנים ויעיל מאוד."
      },
    ]
  },
  {
    title: "אלרגיות עונתיות (אבקנים)",
    items: [
      {
        question: "למה האלרגיה מופיעה רק בעונות מסוימות?",
        answer: "בגלל ריכוז גבוה של אבקנים של צמחים באוויר — לרוב באביב ובסתיו. כל צמח מפריח בזמן אחר, ולכן ישנם אנשים שמגיבים בעונות שונות."
      },
      {
        question: "האם מסכות עוזרות?",
        answer: "כן — מסכה איכותית מפחיתה משמעותית חשיפה לאבקנים ויכולה להקל על התסמינים, במיוחד בימים עם ריכוז אבקנים גבוה."
      },
      {
        question: "האם טיפול תרופתי ממושך מסוכן?",
        answer: "לא. מרבית תרופות האלרגיה (אנטי-היסטמינים, תרסיסים) בטוחות ונמצאות בשימוש שנים רבות ללא תופעות לוואי משמעותיות."
      },
    ]
  },
  {
    title: "אורטיקריה (חרלת)",
    items: [
      {
        question: "האם אורטיקריה היא אלרגיה?",
        answer: "לא תמיד. ברוב המקרים זו תגובה של העור שאינה קשורה לאלרגיה אמיתית לחומר ספציפי. לעיתים היא קשורה לזיהום, לחץ או גורמים לא ידועים."
      },
      {
        question: "מה מעורר חרלת?",
        answer: "לחץ נפשי, מזון מסוים, חום/קור, זיהומים ותרופות — תלוי בסוג. בחרלת כרונית, הגורם לעיתים לא נמצא."
      },
      {
        question: "האם זה עובר מעצמו?",
        answer: "ברוב המקרים כן. חרלת חריפה חולפת תוך ימים עד שבועות. מצבים כרוניים (מעל 6 שבועות) דורשים מעקב וטיפול מתאים."
      },
    ]
  },
  {
    title: "אסתמה אלרגית",
    items: [
      {
        question: "האם ילד עם אלרגיה נמצא בסיכון מוגבר לאסתמה?",
        answer: "כן — יש קשר ברור בין אלרגיות לבין הופעת אסתמה בילדים. מה שנקרא 'המצעד האלרגי' — התפתחות של מצבים אלרגיים במהלך החיים."
      },
      {
        question: "מה ההבדל בין אסתמה 'רגילה' לאסתמה אלרגית?",
        answer: "אסתמה אלרגית מופעלת על ידי חשיפה לאלרגנים: אבקנים, פרוות בעלי חיים, אבק בית ועוד. הטיפול כולל גם התמודדות עם הטריגרים האלרגיים."
      },
      {
        question: "האם הטיפול מרפא אסתמה?",
        answer: "לא, אך ניתן לשלוט היטב בתסמינים ולהפחית התקפים. רבים מהילדים עם אסתמה חווים שיפור משמעותי עם הגיל."
      },
    ]
  },
  {
    title: "אנפילקסיס",
    items: [
      {
        question: "איך יודעים שמדובר באנפילקסיס ולא רק אלרגיה רגילה?",
        answer: "אנפילקסיס כולל לפחות שניים מהבאים: קוצר נשימה, נפיחות לשון/שפתיים, פריחה מפושטת, ירידת לחץ דם. זהו מצב חירום."
      },
      {
        question: "האם לתת אדרנלין גם אם לא בטוחים?",
        answer: "כן. עיכוב במתן אדרנלין מסוכן הרבה יותר ממתן שלא לצורך. האדרנלין בטוח ויכול להציל חיים."
      },
    ]
  },
  {
    title: "בדיקות אלרגיה לילדים",
    items: [
      {
        question: "האם הבדיקה כואבת?",
        answer: "בדיקות עור מציקות מעט אך אינן כואבות. ילדים מתמודדים איתן היטב. בדיקות דם כמו בכל בדיקת דם רגילה."
      },
      {
        question: "מתי נכון לבצע בדיקות?",
        answer: "כאשר יש תגובות חוזרות: פריחה, שיעול, נפיחות או בעיות נשימה לאחר חשיפה למזון, תרופה, עקיצה או אבקנים."
      },
      {
        question: "האם אפשר לאבחן אלרגיה מגיל צעיר?",
        answer: "כן — חלק מהבדיקות מתאימות כבר מגיל מספר חודשים. הרופא יתאים את סוג הבדיקה לגיל הילד."
      },
    ]
  },
  {
    title: "מימוש זכויות מול חברות הביטוח",
    items: [
      {
        question: "האם אני זכאי להחזר על הביקור?",
        answer: "מטופלים המבוטחים בביטוחים פרטיים עשויים להיות זכאים להחזר חלקי או מלא על הביקור אצל ד״ר אנה ברמלי, בהתאם לתנאי הפוליסה שלהם."
      },
      {
        question: "מתי כדאי לבדוק את הזכאות?",
        answer: "ניתן לבדוק את הזכאות מול חברת הביטוח לפני או לאחר קבלת השירות. מומלץ לבדוק מראש כדי לדעת למה לצפות."
      },
      {
        question: "מי אחראי על גובה ההחזר?",
        answer: "חשוב לדעת: ההחזרים נקבעים על ידי חברות הביטוח בלבד, וד״ר אנה ברמלי או המרפאה אינם אחראים לגובה ההחזר או לאישורו."
      },
      {
        question: "אילו מסמכים אני צריך לקבלת החזר?",
        answer: "בדרך כלל תזדקקו לקבלה מקורית ולסיכום הביקור. ניתן לבקש מסמכים אלו במרפאה לאחר הביקור."
      },
    ]
  },
];

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState<string>(faqCategories[0].title);

  return (
    <>
      <Helmet>
        <title>שאלות ותשובות | ד״ר אנה ברמלי</title>
        <meta 
          name="description" 
          content="תשובות מקצועיות לשאלות נפוצות על אלרגיות: אלרגיה למזון, לחלב, לבוטנים, לתרופות, לדבורים, אסתמה, אנפילקסיס ובדיקות אלרגיה." 
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
              שאלות ותשובות
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              תשובות מקצועיות לשאלות הנפוצות ביותר של הורים בנושא אלרגיות. המידע מסייע להבין את המצבים השונים ולדעת מתי לפנות לייעוץ מקצועי.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 md:py-24">
        <div className="container-medical">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Category Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24 bg-card rounded-xl border border-border p-4">
                <h3 className="font-semibold text-foreground mb-4">קטגוריות</h3>
                <nav className="space-y-1">
                  {faqCategories.map((category) => (
                    <button
                      key={category.title}
                      onClick={() => {
                        setActiveCategory(category.title);
                        // Scroll to the category section with offset for header
                        const element = document.getElementById(category.title.replace(/\s+/g, "-"));
                        if (element) {
                          const headerOffset = 100; // Account for sticky header
                          const elementPosition = element.getBoundingClientRect().top;
                          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                        }
                      }}
                      className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === category.title
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {category.title}
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* FAQ Accordions */}
            <div className="lg:col-span-3 space-y-8">
              {faqCategories.map((category) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: activeCategory === category.title ? 1 : 0.5,
                    y: 0
                  }}
                  className={activeCategory === category.title ? "" : "hidden lg:block"}
                  id={category.title.replace(/\s+/g, "-")}
                >
                  <FAQAccordion items={category.items} title={category.title} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reassurance Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              אתם לא לבד
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              כשילד מראה סימני אלרגיה — זה טבעי להרגיש לחץ. התגובות יכולות להיות מבלבלות ומהירות, והחשש מפני אירוע נוסף מלווה כמעט כל הורה. המטרה שלנו היא לעזור לכם להבין מה באמת קורה, ולהחזיר אליכם את תחושת השליטה.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              החשש שלכם מובן וטבעי — ודווקא בגלל זה חשוב לבדוק את הדברים בצורה מסודרת. פגישה קצרה עם מומחית אלרגיה יכולה לשנות מהיסוד את הביטחון וההתנהלות היומיומית בבית.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-12 md:py-16">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center bg-primary/5 border border-primary/20 rounded-2xl p-8"
          >
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
              יש לכם שאלות נוספות?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              לא מצאתם תשובה לשאלה שלכם? אנחנו כאן לעזור. אתם מוזמנים לפנות אלינו ונשמח לענות על כל שאלה.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              צרו קשר
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default FAQ;
