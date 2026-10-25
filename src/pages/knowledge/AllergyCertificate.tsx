import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/זכויות-ילד-אלרגי-ישראל";

const relatedArticles = [
  { to: "/knowledge/גן-יכול-לסרב-לילד-אלרגי", label: "האם גן יכול לסרב לילד אלרגי?" },
  { to: "/knowledge/אפיפן-בגן-מי-אחראי", label: "אפיפן בגן - מי אחראי?" },
  { to: "/knowledge/סייעת-רפואית-לילד-אלרגי", label: "סייעת רפואית לילד אלרגי" },
  { to: "/knowledge/טיול-שנתי-ילד-אלרגי", label: "טיול שנתי עם ילד אלרגי" },
];

const AllergyCertificate = () => (
  <KnowledgeArticleLayout
    slug="אישור-אלרגיה-למשרד-החינוך"
    title="מסמכי אלרגיה למסגרת החינוכית: מה להביא לביקור?"
    metaDescription="מסמכי אלרגיה למסגרת החינוכית: מה להביא לביקור? רשימת הכנה להורים: הטופס שהמסגרת דורשת, תיעוד קיים וההבדל בין מסמך לצוות לבקשת סייעת."
    relatedArticles={relatedArticles}
    dateModified="2026-10-25"
    editorialUpdate
  >
    <div className="text-muted-foreground leading-relaxed space-y-5">
      <p>בקשו מהמסגרת את הטופס העדכני ואת פירוט המסמכים. הנחיות לצוות, בקשת סיוע ותביעה לביטוח הלאומי הן מסלולים שונים.</p>
      <p>הביאו סיכומים רפואיים, בדיקות שכבר בוצעו, תיעוד תגובות וטיפול שניתן ורשימת תרופות. הרופא יקבע מה דרוש להערכה ולמסמך; אין צורך בבדיקות אקראיות רק לצורך טופס.</p>
      <p>מסמך רפואי מתאר אבחנה והנחיות בהתאם להערכה. הגורם המוסמך מחליט על זכאות; המרפאה אינה מאשרת סייעת או קצבה.</p>
      <h2 className="text-xl font-semibold text-foreground">שלוש שאלות לפני שמבקשים אישור</h2>
      <ol className="list-decimal ps-6 space-y-2">
        <li><strong>למי מיועד המסמך?</strong> ציינו אם הבקשה היא של הגן, בית הספר, מפעיל הצהרון או הרשות המקומית.</li>
        <li><strong>מה מטרתו?</strong> בקשו להבחין בין עדכון הצוות לבין מסמך שמצורף לבקשת סיוע. אין להניח שטופס אחד מחליף את האחר.</li>
        <li><strong>מה הדרישה העדכנית?</strong> הביאו את הטופס עצמו, אם נמסר, ואת מועד ההגשה. אל תסתמכו רק על צילום טופס משנה קודמת.</li>
      </ol>
      <h2 className="text-xl font-semibold text-foreground">תיק לביקור אינו תיק להגשה לרשות</h2>
      <p>התיעוד שמביאים לרופא נועד לעזור בהערכה. לרשות מגישים את המסמכים שהיא דורשת למסלול המתאים. פורטל ההורים מבחין בין מסמך מומחה לבקשת תומכת חינוך לבין מסמכים אחרים, ומבהיר שמסמכי ביטוח לאומי ותעודת נכות אינם נידונים בוועדה זו. <a href="https://parents.education.gov.il/gov-education/support/medical-assistants/" className="text-primary underline">דרישות המסמכים בפורטל משרד החינוך</a>.</p>
      <p><strong>כלל אצבע:</strong> לפני שליחת מסמכים אישיים, ודאו מי הנמען, אילו מסמכים נדרשים ובאיזה ערוץ מוסרים אותם. לבירור המסלול עצמו עברו ל<Link to="/knowledge/סייעת-רפואית-לילד-אלרגי" className="text-primary underline">מדריך הגשת בקשת סיוע</Link>. המידע אינו ייעוץ רפואי ואינו מבטיח אישור בקשה.</p>
      <p><Link to={GOLDEN_GUIDE} className="text-primary underline">מדריך ההיערכות והזכויות - מקורות רשמיים ועדכון אוקטובר 2026</Link></p>
    </div>
  </KnowledgeArticleLayout>
);

export default AllergyCertificate;
