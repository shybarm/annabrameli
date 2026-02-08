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
    title="אפיפן בגן ובבית ספר – מי אחראי ומה באמת נדרש?"
    metaDescription="אפיפן בגן ובבית ספר – מי אחראי, מה נדרש מהצוות ומההורים. מדריך רפואי-משפטי להורים בישראל."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        כאשר לילד יש מרשם לאפיפן, עולות שאלות רבות סביב האחריות והיישום בפועל במסגרת החינוכית.
      </p>
      <p>
        בישראל, האחריות מתחלקת בין ההורים, הצוות החינוכי והרשות המקומית – בהתאם לסוג המסגרת.
      </p>
      <p>
        למסגרת המלאה והעדכנית, ראו:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לזכויות של ילד אלרגי בישראל
        </Link>.
      </p>

      <h2 className="text-lg font-bold text-foreground pt-4">נקודות חשובות להורים:</h2>
      <ul className="list-disc list-inside space-y-1.5">
        <li>אפיפן חייב להיות זמין ונגיש</li>
        <li>הצוות צריך לקבל הדרכה</li>
        <li>אין לצפות מהילד לשאת אחריות</li>
      </ul>
    </div>
  </KnowledgeArticleLayout>
);

export default EpiPenResponsibility;
