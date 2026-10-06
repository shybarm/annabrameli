import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/זכויות-ילד-אלרגי-ישראל";

const relatedArticles = [
  { to: "/knowledge/גן-יכול-לסרב-לילד-אלרגי", label: "האם גן יכול לסרב לילד אלרגי?" },
  { to: "/knowledge/אפיפן-בגן-מי-אחראי", label: "אפיפן בגן – מי אחראי?" },
  { to: "/knowledge/סייעת-רפואית-לילד-אלרגי", label: "סייעת רפואית לילד אלרגי" },
  { to: "/knowledge/אישור-אלרגיה-למשרד-החינוך", label: "אישור אלרגיה למשרד החינוך" },
];

const SchoolTrip = () => (
  <KnowledgeArticleLayout
    slug="טיול-שנתי-ילד-אלרגי"
    title="טיול עם ילד אלרגי: מה מתאמים מראש?"
    metaDescription="טיול עם ילד אלרגי: מה מתאמים מראש? מסמכים, תיאום והפניה למקורות רשמיים, ללא הבטחת זכאות."
    relatedArticles={relatedArticles}
    dateModified="2026-10-06"
    editorialUpdate
  >
    <div className="text-muted-foreground leading-relaxed space-y-5">
      <p>בררו מה כוללות הארוחות והפעילויות והעבירו מראש את ההנחיות הרפואיות האישיות. אם נרשם מזרק אדרנלין, תאמו נגישות אליו גם מחוץ לבית הספר.</p>
      <p>בררו מי מכיר את תוכנית הפעולה, כיצד מעבירים מידע לצוות המלווה ואיך יוצרים קשר עם ההורים. שינוי בהנחיות רפואיות יש לברר עם הרופא.</p>
      <p>בקשו תשובה כתובה על ההתאמות ועל הכללים החלים על הטיול. פנו לגוף המפקח אם אין מענה; אין במדריך הבטחה לבטיחות מוחלטת או קביעה משפטית לגבי השתתפות במקרה אישי.</p>
      <p><Link to={GOLDEN_GUIDE} className="text-primary underline">מדריך ההיערכות והזכויות — מקורות רשמיים ועדכון אוקטובר 2026</Link></p>
    </div>
  </KnowledgeArticleLayout>
);

export default SchoolTrip;
