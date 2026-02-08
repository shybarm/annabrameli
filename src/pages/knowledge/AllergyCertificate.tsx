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
    title="אישור אלרגיה למשרד החינוך – מה צריך לכלול?"
    metaDescription="אישור אלרגיה למשרד החינוך – מה חייב להיות במסמך הרפואי כדי לשמור על זכויות הילד. מדריך להורים."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        מסמך רפואי ברור הוא הבסיס לשמירה על זכויות הילד במסגרת החינוכית.
      </p>
      <p>
        אישור חלקי או לא ברור עלול להקשות על שיתוף הפעולה עם המערכת.
      </p>
      <p>
        להנחיות מלאות:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לזכויות של ילד אלרגי בישראל
        </Link>.
      </p>
    </div>
  </KnowledgeArticleLayout>
);

export default AllergyCertificate;
