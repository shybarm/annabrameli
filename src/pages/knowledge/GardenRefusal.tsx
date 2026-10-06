import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/זכויות-ילד-אלרגי-ישראל";

const relatedArticles = [
  { to: "/knowledge/אפיפן-בגן-מי-אחראי", label: "אפיפן בגן – מי אחראי?" },
  { to: "/knowledge/סייעת-רפואית-לילד-אלרגי", label: "סייעת רפואית לילד אלרגי" },
  { to: "/knowledge/טיול-שנתי-ילד-אלרגי", label: "טיול שנתי עם ילד אלרגי" },
  { to: "/knowledge/אישור-אלרגיה-למשרד-החינוך", label: "אישור אלרגיה למשרד החינוך" },
];

const GardenRefusal = () => (
  <KnowledgeArticleLayout
    slug="גן-יכול-לסרב-לילד-אלרגי"
    title="הגן מסתייג מקבלת ילד אלרגי: מה כדאי לברר?"
    metaDescription="הגן מסתייג מקבלת ילד אלרגי: מה כדאי לברר? מסמכים, תיאום והפניה למקורות רשמיים, ללא הבטחת זכאות."
    relatedArticles={relatedArticles}
    dateModified="2026-10-06"
    editorialUpdate
  >
    <div className="text-muted-foreground leading-relaxed space-y-5">
      <p>אין להסיק כלל משפטי אחד לכל מעון, גן פרטי או מסגרת ציבורית. בקשו מההנהלה לפרט בכתב את הקושי ואת ההנחיות שעליהן היא מסתמכת.</p>
      <p>העבירו מסמכים רפואיים והנחיות אישיות ותאמו פגישה לבירור ההתאמות. תעדו את המענה ואת הנושאים שנותרו ללא פתרון.</p>
      <p>בררו מי הגוף המפקח על המסגרת ופנו אליו עם התיעוד. במחלוקת משפטית על קבלה או התאמות יש לקבל ייעוץ פרטני; העמוד אינו קובע אם סירוב מסוים חוקי.</p>
      <p><Link to={GOLDEN_GUIDE} className="text-primary underline">מדריך ההיערכות והזכויות — מקורות רשמיים ועדכון אוקטובר 2026</Link></p>
    </div>
  </KnowledgeArticleLayout>
);

export default GardenRefusal;
