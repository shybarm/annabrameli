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
    title="האם גן יכול לסרב לקבל ילד עם אלרגיה למזון?"
    metaDescription="האם גן רשאי לסרב לקבל ילד עם אלרגיה למזון? מה הזכויות שלכם ומה לעשות בפועל. מדריך להורים."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        הורים רבים מופתעים לגלות שגן או מסגרת חינוכית מעלה הסתייגות כאשר ילד מאובחן עם אלרגיה למזון. חשוב לדעת: ברוב המקרים, סירוב כזה אינו לגיטימי.
      </p>
      <p>
        המסגרת מחויבת להיערך בהתאם להנחיות משרד החינוך והגורמים הרפואיים, ולא להטיל את האחריות על ההורים בלבד.
      </p>
      <p>
        להבנה רחבה של הזכויות והחובות של כל הצדדים, מומלץ לקרוא את{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לזכויות של ילד אלרגי בישראל
        </Link>.
      </p>

      <h2 className="text-lg font-bold text-foreground pt-4">מתי סירוב כן עלול לקרות:</h2>
      <ul className="list-disc list-inside space-y-1.5">
        <li>היעדר מסמכים רפואיים</li>
        <li>חוסר בהירות לגבי רמת הסיכון</li>
      </ul>

      <h2 className="text-lg font-bold text-foreground pt-4">מה עושים בפועל:</h2>
      <ul className="list-disc list-inside space-y-1.5">
        <li>מציגים אישור רפואי מסודר</li>
        <li>מבקשים פגישה עם הנהלת המסגרת</li>
        <li>לא מוותרים בשלב הראשון</li>
      </ul>
    </div>
  </KnowledgeArticleLayout>
);

export default GardenRefusal;
