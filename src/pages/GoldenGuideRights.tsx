import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/utils/medicalSchema";
import { FAQAccordion } from "@/components/ui/faq-accordion";

const canonical = "https://ihaveallergy.com/guides/זכויות-ילד-אלרגי-ישראל";
const title = "ילד עם אלרגיה למזון בגן ובבית הספר: סייעת, הכנה וזכויות";
const description = "מה מציע נייר העמדה מספטמבר 2026, מה צריך לברר לגבי סייעת וקצבה, ואילו מסמכים ושאלות להכין למסגרת החינוכית.";
const sources = [
  { title: "נייר העמדה של האיגוד הישראלי לאלרגיה ואימונולוגיה קלינית — ספטמבר 2026", url: "https://www.ima.org.il/File.aspx?usf=e89c22ac-e718-474f-96e0-782fc2f4847c", note: "מקור מקצועי ראשוני; המלצות מדיניות אינן החלטת זכאות אישית." },
  { title: "ביטוח לאומי — אלרגיה וזכאות לקצבת ילד נכה", url: "https://www.btl.gov.il/benefits/Disabled_Child/likuilist/Pages/allergy.aspx", note: "תנאי הזכאות, המסמכים ואופן הגשת התביעה נקבעים בידי הביטוח הלאומי." },
];
const faqs = [
  { question: "האם בוטלה הזכאות לסייעת לילד אלרגי?", answer: "נייר העמדה מספטמבר 2026 מציע לבחון מחדש את מודל הסייעות ולפתח חלופות של צוות מיומן ושירותי בריאות במסגרת החינוכית. נייר עמדה מקצועי אינו כשלעצמו ביטול זכאות. יש לבדוק את ההנחיות וההחלטה החלות על הילד מול הרשות והגורם המוסמך." },
  { question: "האם אישור מאלרגולוג מבטיח סייעת או קצבה?", answer: "לא. מסמך רפואי מתאר את האבחנה והצרכים הרפואיים. ההחלטה על סייעת או על קצבה מתקבלת בנפרד בידי הגורם המוסמך, לפי התנאים והמסמכים הנדרשים במסלול המתאים." },
  { question: "האם בקשה לסייעת ובקשה לקצבת ילד נכה הן אותה בקשה?", answer: "לא. סיוע במסגרת חינוכית וקצבת ילד נכה הם מסלולים נפרדים. בקשה לקצבה מוגשת לביטוח הלאומי; לגבי סיוע חינוכי יש לברר את המסלול המתאים לגיל הילד ולסוג המסגרת." },
  { question: "מה כדאי להביא לביקור אצל אלרגולוג לפני תחילת השנה?", answer: "סיכום רפואי עדכני, תוצאות בדיקות קיימות, תיעוד של תגובות קודמות והטיפול שניתן, רשימת תרופות וטפסים שהמסגרת ביקשה. אין לבצע בדיקות חדשות רק לצורך מילוי טופס בלי לברר את הצורך הרפואי בביקור." },
];
const checklist = [
  "רכזו אבחנות, תוצאות בדיקות קיימות ותיעוד תגובות קודמות.",
  "בררו עם הרופא אילו מסמכים והנחיות אישיות מתאימים לילד.",
  "תאמו עם המסגרת כיצד מעבירים את ההנחיות לצוות ואיפה נשמרים המסמכים.",
  "אם נרשם מזרק אדרנלין: תאמו נגישות, בדיקת תוקף והיערכות הצוות לפי ההנחיות האישיות.",
  "בררו מראש על ארוחות, חגיגות, צהרון וטיולים ועל ההתאמות המתאימות לילד.",
  "בקשו תשובה כתובה על מסלול הבקשה לסיוע, המסמכים, המועדים ואפשרות הערעור.",
  "עדכנו את המסגרת כאשר ההנחיות הרפואיות משתנות.",
];

export default function GoldenGuideRights() {
  const schema = {
    "@context": "https://schema.org", "@type": "WebPage", "@id": canonical,
    url: canonical, name: title, description, inLanguage: "he-IL",
    datePublished: "2026-02-08", dateModified: "2026-10-06",
    publisher: { "@type": "Organization", "@id": "https://ihaveallergy.com/#organization", name: "ihaveallergy.com" },
    citation: sources.map(source => source.url),
  };
  const breadcrumb = buildBreadcrumbSchema([
    { name: "ראשי", item: "https://ihaveallergy.com/" },
    { name: "מדריכים", item: "https://ihaveallergy.com/blog" },
    { name: "ילד אלרגי במסגרת החינוכית", item: canonical },
  ]);
  return <>
    <Helmet>
      <title>{title} | ד״ר אנה ברמלי</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="https://ihaveallergy.com/og-logo.png?v=6" />
      <meta property="article:published_time" content="2026-02-08" />
      <meta property="article:modified_time" content="2026-10-06" />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      <script type="application/ld+json">{JSON.stringify(buildFaqSchema(faqs))}</script>
    </Helmet>
    <section className="gradient-hero py-14 md:py-20">
      <div className="container-medical max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-sm mb-6"><Link to="/">ראשי</Link> / <Link to="/blog">מדריכים</Link></nav>
        <h1 className="font-bold text-foreground mb-5">{title}</h1>
        <p className="text-muted-foreground">עדכון מקורות: 6 באוקטובר 2026 · מערכת האתר</p>
        <p className="text-muted-foreground mt-3">סיכום מידע ציבורי ממקורות רשמיים. העדכון אינו מציג עמדה אישית של ד״ר אנה ברמלי או סקירה רפואית חדשה שלה.</p>
      </div>
    </section>
    <article className="container-medical max-w-3xl py-12 space-y-10 text-muted-foreground leading-relaxed">
      <p>היערכות למסגרת חינוכית מתחילה בהבנת הצרכים של הילד ובתיאום עם הצוות. חשוב להפריד בין ההנחיות הרפואיות האישיות, בקשה לסיוע במסגרת החינוכית ותביעה לקצבה: לכל אחד מהם מטרה וגורם מחליט שונים.</p>
      <section id="policy-update" className="bg-surface-warm rounded-2xl border border-border/40 p-6 space-y-4">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">סייעת לילד אלרגי: מה מציע האיגוד בספטמבר 2026?</h2>
        <p>נייר העמדה של האיגוד הישראלי לאלרגיה ואימונולוגיה קלינית מציע לבחון מחדש את מודל הסייעות, לצד הכשרת צוותים וחלופות כגון נאמן בריאות מצוות המסגרת או חיזוק שירותי הבריאות, לרבות אחות. ההמלצות מתייחסות להיערכות גם בגילים שמעבר לגיל הסיוע המקובל.</p>
        <p>המסמך מדגיש תוכנית פעולה אישית, הכשרת צוות ונגישות למזרקי אדרנלין תקפים. אלה המלצות מקצועיות למדיניות; הן אינן החלטת זכאות אישית ואינן מוכיחות שהוראות הסיוע הקיימות בוטלו.</p>
        <p><strong className="text-foreground">מה לבדוק עכשיו?</strong> את ההנחיות התקפות למסגרת של הילד, את החלטת הגורם המוסמך ואת ההיערכות בפועל. אין לשנות הנחיות רפואיות אישיות בעקבות כתבה.</p>
        <a href={sources[0].url} className="text-primary underline">לנייר העמדה המקורי באתר ההסתדרות הרפואית</a>
      </section>
      <section className="space-y-4" id="education-rights">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">שלושה מסלולים שכדאי להפריד</h2>
        <h3 className="font-semibold text-foreground">מעון, גן, בית ספר וצהרון</h3>
        <p>סוג המסגרת וגיל הילד משפיעים על מסלול הבירור. בררו עם הרשות המקומית ועם הגוף המפקח על המסגרת מי מטפל בבקשה לסיוע, אילו מסמכים נדרשים ומהם המועדים. אל תניחו שאישור למסגרת אחת חל אוטומטית על צהרון, מעון או מסגרת פרטית.</p>
        <h3 className="font-semibold text-foreground">מסמכים והיערכות רפואית</h3>
        <p>מסמך רפואי ותוכנית פעולה אישית נועדו לתאר את מצבו של הילד ואת ההנחיות המתאימות לו. תיאום עם הצוות צריך לכלול גם ארוחות, פעילויות וטיולים. בקשו מהרופא להבהיר את ההנחיות ולא להסתפק בתוצאת בדיקה בלבד.</p>
        <h3 className="font-semibold text-foreground">קצבת ילד נכה בביטוח הלאומי</h3>
        <p>הביטוח הלאומי מפרסם מסלול זכאות לילדים עם אלרגיה מגיל תשעה חודשים ועד גיל עשר, בכפוף לתנאים. האתר מפרט מסמכי בדיקות, המלצה של מומחה לאלרגיה למזרק אפיפן ותיעוד רפואי נדרש. ההחלטה מתקבלת בביטוח הלאומי; עצם האבחנה או הגשת מסמך אינן מבטיחות קצבה.</p>
        <a href={sources[1].url} className="text-primary underline">לתנאים ולמסמכים באתר הביטוח הלאומי</a>
      </section>
      <section className="space-y-4" id="checklist">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">רשימת הכנה לביקור ולשיחה עם המסגרת</h2>
        <ul className="list-disc ps-6 space-y-3">{checklist.map(item => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="space-y-4" id="when-to-escalate">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">כשיש קושי בתיאום או מחלוקת</h2>
        <p>רכזו את ההנחיות ואת התכתובת ופנו להנהלת המסגרת לקבלת מענה כתוב. אם הקושי אינו נפתר, בררו מי הגוף המפקח או הגורם המוסמך לטפל בבקשה. במקרה של מחלוקת על זכאות, בדקו את מסלול ההשגה המתאים; המדריך אינו קובע את הזכאות במקרה אישי.</p>
      </section>
      <section id="faq"><h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">שאלות נפוצות</h2><FAQAccordion items={faqs} /></section>
      <section className="bg-card rounded-2xl border border-border/60 p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground">צריכים לברר את האבחנה וההנחיות הרפואיות?</h2>
        <p>אפשר לפנות למרפאת ד״ר אנה ברמלי בהוד השרון לייעוץ בנושא אלרגיה למזון. הביאו תיעוד רפואי וטפסים קיימים כדי לברר מה נדרש רפואית. המרפאה אינה הגוף שמאשר סייעת או קצבה.</p>
        <Link to="/contact" className="text-primary underline">פנייה למרפאה</Link>
        <p><Link to="/guides/בדיקות-אלרגיה-ילדים-ישראל" className="text-primary underline">מדריך בדיקות אלרגיה לילדים</Link> · <Link to="/services" className="text-primary underline">שירותי המרפאה</Link></p>
      </section>
      <section id="sources" className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">מקורות ועדכניות</h2>
        <ul className="space-y-4">{sources.map(source => <li key={source.url}><a href={source.url} className="text-primary underline">{source.title}</a><p className="text-sm">{source.note}</p></li>)}</ul>
        <p className="text-sm">המקורות נבדקו ב־6 באוקטובר 2026. נהלים ותנאי זכאות עשויים להשתנות; יש לבדוק את המקור הרשמי וההחלטה הפרטנית בעת הגשת בקשה. העמוד אינו ייעוץ משפטי או הוראות לטיפול בתגובה אלרגית.</p>
      </section>
    </article>
  </>;
}
