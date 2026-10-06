import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/זכויות-ילד-אלרגי-ישראל";

const relatedArticles = [
  { to: "/knowledge/גן-יכול-לסרב-לילד-אלרגי", label: "האם גן יכול לסרב לילד אלרגי?" },
  { to: "/knowledge/אפיפן-בגן-מי-אחראי", label: "אפיפן בגן – מי אחראי?" },
  { to: "/knowledge/טיול-שנתי-ילד-אלרגי", label: "טיול שנתי עם ילד אלרגי" },
  { to: "/knowledge/אישור-אלרגיה-למשרד-החינוך", label: "אישור אלרגיה למשרד החינוך" },
];

const MedicalAide = () => (
  <KnowledgeArticleLayout
    slug="סייעת-רפואית-לילד-אלרגי"
    title="סייעת לילד אלרגי: איך מבררים את הזכאות?"
    metaDescription="סייעת לילד אלרגי: איך מבררים את הזכאות? מסמכים, תיאום והפניה למקורות רשמיים, ללא הבטחת זכאות."
    relatedArticles={relatedArticles}
    dateModified="2026-10-06"
    editorialUpdate
  >
    <div className="text-muted-foreground leading-relaxed space-y-5">
      <p>בררו עם הרשות המקומית והגוף המפקח מי מטפל בבקשה, מה התנאים ומהם המסמכים והמועדים. גיל הילד וסוג המסגרת חשובים לבחירת המסלול; רשימת גורמי סיכון אינה תחליף לתנאי זכאות רשמיים.</p>
      <p>נייר העמדה מספטמבר 2026 אינו כשלעצמו ביטול סיוע שאושר. בדקו את ההנחיות התקפות ואת ההחלטה הפרטנית; אין להסיק זכאות או שלילתה מכותרת בכתבה.</p>
      <p>רכזו מסמך רפואי עדכני, תיעוד קיים וטפסים שהמסגרת מבקשת. שאלו מהו מסלול ההשגה במקרה של דחייה. אישור רפואי אינו מבטיח סייעת או קצבה.</p>
      <p><Link to={GOLDEN_GUIDE} className="text-primary underline">מדריך ההיערכות והזכויות — מקורות רשמיים ועדכון אוקטובר 2026</Link></p>
    </div>
  </KnowledgeArticleLayout>
);

export default MedicalAide;
