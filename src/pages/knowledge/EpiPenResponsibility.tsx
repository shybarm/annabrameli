import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/זכויות-ילד-אלרגי-ישראל";

const relatedArticles = [
  { to: "/knowledge/גן-יכול-לסרב-לילד-אלרגי", label: "האם גן יכול לסרב לילד אלרגי?" },
  { to: "/knowledge/סייעת-רפואית-לילד-אלרגי", label: "סייעת רפואית לילד אלרגי" },
  { to: "/knowledge/טיול-שנתי-ילד-אלרגי", label: "טיול שנתי עם ילד אלרגי" },
  { to: "/knowledge/אישור-אלרגיה-למשרד-החינוך", label: "אישור אלרגיה למשרד החינוך" },
];

const EpiPenResponsibility = () => (
  <KnowledgeArticleLayout
    slug="אפיפן-בגן-מי-אחראי"
    title="אפיפן בגן ובבית הספר: שאלות לתיאום עם הצוות"
    metaDescription="אפיפן בגן ובבית הספר: שאלות לתיאום עם הצוות מסמכים, תיאום והפניה למקורות רשמיים, ללא הבטחת זכאות."
    relatedArticles={relatedArticles}
    dateModified="2026-10-06"
    editorialUpdate
  >
    <div className="text-muted-foreground leading-relaxed space-y-5">
      <p>כאשר נרשם לילד מזרק אדרנלין, בררו היכן הוא נמצא, כיצד מוודאים את תוקפו ומי מכיר את ההנחיות האישיות. יש לתאם גם צהרון, החלפת צוות ופעילויות מחוץ למסגרת.</p>
      <p>מסרו לצוות את תוכנית הפעולה שניתנה לילד ובררו כיצד מתקיימת ההדרכה. העמוד אינו מחליף הדרכה לשימוש במזרק או הוראות לטיפול בתגובה.</p>
      <p>את חלוקת האחריות והכללים החלים על המסגרת יש לברר מול הנהלתה והגוף המפקח. אין להסיק מספר מחייב של אנשי צוות או הסדר משפטי מהמידע הכללי בעמוד.</p>
      <p><Link to={GOLDEN_GUIDE} className="text-primary underline">מדריך ההיערכות והזכויות — מקורות רשמיים ועדכון אוקטובר 2026</Link></p>
    </div>
  </KnowledgeArticleLayout>
);

export default EpiPenResponsibility;
