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
    title="סייעת רפואית לילד אלרגי – מי זכאי ומתי?"
    metaDescription="סייעת רפואית לילד אלרגי – מי זכאי, מתי מאשרים, ומה הקריטריונים. מדריך להורים בישראל."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        לא כל ילד אלרגי זכאי אוטומטית לסייעת רפואית, אך במקרים מסוימים מדובר בצורך חיוני.
      </p>
      <p>
        ההחלטה מתקבלת על בסיס חומרת האלרגיה, גיל הילד וסוג המסגרת החינוכית.
      </p>
      <p>
        להסבר מסודר על הזכויות והקריטריונים:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לזכויות של ילד אלרגי בישראל
        </Link>.
      </p>

      <h2 className="text-lg font-bold text-foreground pt-4">מה משפיע על ההחלטה:</h2>
      <ul className="list-disc list-inside space-y-1.5">
        <li>אלרגיה מסכנת חיים</li>
        <li>צורך באפיפן</li>
        <li>גיל הילד</li>
      </ul>
    </div>
  </KnowledgeArticleLayout>
);

export default MedicalAide;
