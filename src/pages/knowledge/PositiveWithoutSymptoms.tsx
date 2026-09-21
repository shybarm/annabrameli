import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const GOLDEN_GUIDE = "/guides/בדיקות-אלרגיה-ילדים-ישראל";

const relatedArticles = [
  { to: "/knowledge/תבחיני-עור-כואב-לילדים", label: "תבחיני עור – האם זה כואב?" },
  { to: "/knowledge/בדיקת-דם-לאלרגיה-ילדים", label: "בדיקת דם לאלרגיה – מתי מספיקה?" },
  { to: "/knowledge/תגר-מזון-איך-זה-נראה", label: "תגר מזון – איך זה נראה בפועל?" },
  { to: "/knowledge/בדיקות-אלרגיה-פרטי-או-קופה", label: "בדיקות אלרגיה – פרטי או קופה?" },
];

const faqItems = [
  {
    question: "האם טסט חיובי מוכיח שיש אלרגיה למזון?",
    answer: "לא. טסט חיובי מעיד שמערכת החיסון פיתחה נוגדני IgE נגד המזון, אך יש לבחון את התוצאה יחד עם הסיפור הקליני.",
  },
  {
    question: "האם טסט יכול להיות חיובי למזון שאוכלים בלי תגובה?",
    answer: "כן. ייתכן שאדם יאכל מזון בלי תגובה אף שמערכת החיסון פיתחה נגדו נוגדני IgE.",
  },
  {
    question: "למה לא מומלץ לבצע טסטים לאלרגיה באופן אקראי?",
    answer: "ככל שמבצעים יותר טסטים בלי חשד אמיתי, גדל הסיכוי לתוצאה חיובית שאינה מעידה על אלרגיה ועלולה להוביל להימנעות מיותרת, דיאטות שאינן נחוצות וחרדה.",
  },
  {
    question: "מהי נקודת ההתחלה של בירור חשד לאלרגיה למזון?",
    answer: "נקודת ההתחלה היא הסיפור הקליני: מה נאכל, תוך כמה זמן הופיעו התסמינים, מהם התסמינים והאם התגובה חזרה בחשיפות נוספות.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const PositiveWithoutSymptoms = () => (
  <KnowledgeArticleLayout
    slug="בדיקה-חיובית-בלי-תסמינים"
    title="בדיקת אלרגיה חיובית בלי תסמינים – מה זה אומר?"
    metaDescription="טסט אלרגיה חיובי לא תמיד מוכיח שיש אלרגיה למזון. ד״ר אנה ברמלי מסבירה למה הסיפור הקליני קודם לבדיקה ומה הסיכון בבדיקות אקראיות."
    relatedArticles={relatedArticles}
    dateModified="2026-09-21"
  >
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
    </Helmet>
    <div className="text-muted-foreground leading-relaxed space-y-8">
      <blockquote className="rounded-2xl border-r-4 border-primary bg-accent/50 p-6 text-lg font-medium text-foreground">
        ״מה אם הייתי אומר לכם שטסטים לאלרגיה יכולים דווקא לבלבל אותנו?״
        <span className="mt-3 block text-base font-normal text-muted-foreground">
          אם עושים טסטים לאלרגיה בלי סיפור שמתאים לאלרגיה למזון, אפשר לקבל תוצאות שיובילו להימנעות ממזונות שאין צורך להימנע מהם.
        </span>
      </blockquote>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">הסיפור הוא נקודת ההתחלה</h2>
        <p>
          ברפואת אלרגיה, הטסטים הם כמעט אף פעם לא נקודת ההתחלה. כשמגיע מטופל עם חשד לאלרגיה למזון, הדבר הראשון שחשוב להבין הוא לא מה מראים הטסטים, אלא מה באמת קרה.
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>איזה מזון נאכל?</li>
          <li>תוך כמה זמן הופיעו התסמינים?</li>
          <li>מה בדיוק היו התסמינים?</li>
          <li>האם אותה תגובה חזרה גם בחשיפות נוספות?</li>
        </ul>
        <p>
          רק אחרי שמבינים את הסיפור, אפשר להחליט אם בכלל יש צורך לבצע תבחיני עור לאלרגיה או בדיקות נוספות, ואם כן – אילו בדיקות מתאימות לשאלה הרפואית.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">מה טסט לאלרגיה בודק?</h2>
        <p>
          טסטים לאלרגיה בודקים אם מערכת החיסון פיתחה נוגדנים מסוג IgE נגד המזון. לפעמים נוגדנים כאלה קיימים, אבל האדם אוכל את אותו מזון בלי שום תגובה.
        </p>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h3 className="mb-2 font-bold text-foreground">תוצאה חיובית אינה עומדת לבדה</h3>
          <p>כאשר הטסט חיובי אך המזון נאכל ללא תגובה, תוצאת הטסט אינה מוכיחה שיש אלרגיה למזון. המשמעות נקבעת באמצעות החיבור בין התוצאה לבין הסיפור הקליני.</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">למה לא לבצע טסטים באופן אקראי?</h2>
        <p>
          ככל שמבצעים יותר טסטים בלי שיש חשד אמיתי, כך גדל הסיכוי לקבל תוצאה חיובית שאינה מעידה על אלרגיה, אלא רק על כך שמערכת החיסון פיתחה נוגדני IgE נגד אותו מזון. תוצאה כזו עלולה להוביל ל:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>הימנעות מיותרת ממזונות</li>
          <li>דיאטות שאינן נחוצות</li>
          <li>חרדה</li>
          <li>פגיעה באיכות החיים</li>
        </ul>
      </section>

      <section className="rounded-2xl bg-surface p-6 space-y-3">
        <h2 className="text-xl font-bold text-foreground">הטסט הוא כלי. האבחנה היא של האדם.</h2>
        <p>
          ברפואת אלרגיה לא מאבחנים אנשים לפי הטסטים בלבד. הטסטים הם כלי חשוב, אבל תמיד צריך לבחון אותם בהקשר של הסיפור הקליני. רק כשהסיפור והטסטים מתחברים יחד, אפשר להגיע לאבחנה הנכונה.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">מה כדאי לרשום לפני הבירור?</h2>
        <p>
          לקראת בירור של תגובה אפשרית למזון, כדאי להגיע עם תיאור מסודר של המזון שנאכל, הזמן שעבר עד הופעת התסמינים, התסמינים עצמם והאם אותה תגובה הופיעה שוב בחשיפה נוספת. לקריאה על סוגי הבדיקות והאופן שבו בוחרים ביניהן, עברו אל{" "}
          <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
            המדריך המלא לבדיקות אלרגיה לילדים ולמבוגרים
          </Link>.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-foreground">שאלות נפוצות על טסט חיובי לאלרגיה</h2>
        <Accordion type="single" collapsible className="rounded-2xl border border-border/60 bg-card px-5">
          {faqItems.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger className="text-right hover:no-underline">{item.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  </KnowledgeArticleLayout>
);

export default PositiveWithoutSymptoms;
