import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/טעימות-ראשונות-אלרגנים";

const relatedArticles = [
  { to: "/knowledge/פריחה-אחרי-במבה", label: "פריחה אחרי במבה לתינוק" },
  { to: "/knowledge/אודם-סביב-הפה-אחרי-אלרגן", label: "אודם סביב הפה אחרי טעימת אלרגן" },
  { to: "/knowledge/במבה-גיל-4-חודשים", label: "במבה בגיל 4 חודשים" },
  { to: "/knowledge/הקאה-אחרי-טחינה", label: "הקאה אחרי טעימה של טחינה" },
];

const DaysBetweenAllergens = () => (
  <KnowledgeArticleLayout
    slug="כמה-ימים-בין-אלרגנים"
    title="כמה ימים מחכים בין חשיפה לאלרגן אחד לשני?"
    metaDescription="כמה ימים להמתין בין אלרגנים בטעימות ראשונות – עקרונות ברורים להורים לפי ההנחיות העדכניות."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        אחת השאלות הנפוצות ביותר היא כמה זמן להמתין בין אלרגן לאלרגן.
      </p>
      <p>
        אין כלל אחד שמתאים לכולם, אך יש עקרונות ברורים שעוזרים לצמצם בלבול וחרדה.
      </p>
      <p>
        להסבר מלא על סדר טעימות:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לטעימות ראשונות ואלרגנים
        </Link>.
      </p>

      <h2 className="text-lg font-bold text-foreground pt-4">עקרונות כלליים:</h2>
      <ul className="list-disc list-inside space-y-1.5">
        <li>אלרגן אחד בכל פעם</li>
        <li>מעקב של כמה ימים</li>
        <li>לא לשלב אלרגנים חדשים יחד</li>
      </ul>
    </div>
  </KnowledgeArticleLayout>
);

export default DaysBetweenAllergens;
