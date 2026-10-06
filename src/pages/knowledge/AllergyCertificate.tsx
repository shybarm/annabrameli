import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/זכויות-ילד-אלרגי-ישראל";

const relatedArticles = [
  { to: "/knowledge/גן-יכול-לסרב-לילד-אלרגי", label: "האם גן יכול לסרב לילד אלרגי?" },
  { to: "/knowledge/אפיפן-בגן-מי-אחראי", label: "אפיפן בגן – מי אחראי?" },
  { to: "/knowledge/סייעת-רפואית-לילד-אלרגי", label: "סייעת רפואית לילד אלרגי" },
  { to: "/knowledge/טיול-שנתי-ילד-אלרגי", label: "טיול שנתי עם ילד אלרגי" },
];

const AllergyCertificate = () => (
  <KnowledgeArticleLayout
    slug="אישור-אלרגיה-למשרד-החינוך"
    title="מסמכי אלרגיה למסגרת החינוכית: מה להביא לביקור?"
    metaDescription="מסמכי אלרגיה למסגרת החינוכית: מה להביא לביקור? מסמכים, תיאום והפניה למקורות רשמיים, ללא הבטחת זכאות."
    relatedArticles={relatedArticles}
    dateModified="2026-10-06"
    editorialUpdate
  >
    <div className="text-muted-foreground leading-relaxed space-y-5">
      <p>בקשו מהמסגרת את הטופס העדכני ואת פירוט המסמכים. הנחיות לצוות, בקשת סיוע ותביעה לביטוח הלאומי הן מסלולים שונים.</p>
      <p>הביאו סיכומים רפואיים, בדיקות שכבר בוצעו, תיעוד תגובות וטיפול שניתן ורשימת תרופות. הרופא יקבע מה דרוש להערכה ולמסמך; אין צורך בבדיקות אקראיות רק לצורך טופס.</p>
      <p>מסמך רפואי מתאר אבחנה והנחיות בהתאם להערכה. הגורם המוסמך מחליט על זכאות; המרפאה אינה מאשרת סייעת או קצבה.</p>
      <p><Link to={GOLDEN_GUIDE} className="text-primary underline">מדריך ההיערכות והזכויות — מקורות רשמיים ועדכון אוקטובר 2026</Link></p>
    </div>
  </KnowledgeArticleLayout>
);

export default AllergyCertificate;
