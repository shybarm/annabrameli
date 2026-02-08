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
    title="טיול שנתי עם ילד אלרגי – מה חובה להסדיר מראש?"
    metaDescription="טיול שנתי עם ילד אלרגי – מה חובה להכין, מה זכויות הילד, ואיך לוודא שהכל בטוח. מדריך להורים."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        טיולים מחוץ למסגרת מעלים חששות טבעיים אצל הורים לילדים אלרגיים.
      </p>
      <p>
        דווקא כאן, הכנה מוקדמת ושיח מסודר עם בית הספר יכולים למנוע מצבי לחץ מיותרים.
      </p>
      <p>
        למידע מקיף על זכויות והיערכות:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לזכויות של ילד אלרגי בישראל
        </Link>.
      </p>
    </div>
  </KnowledgeArticleLayout>
);

export default SchoolTrip;
