import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/טעימות-ראשונות-אלרגנים";

const relatedArticles = [
  { to: "/knowledge/פריחה-אחרי-במבה", label: "פריחה אחרי במבה לתינוק" },
  { to: "/knowledge/אודם-סביב-הפה-אחרי-אלרגן", label: "אודם סביב הפה אחרי טעימת אלרגן" },
  { to: "/knowledge/כמה-ימים-בין-אלרגנים", label: "כמה ימים מחכים בין אלרגנים?" },
  { to: "/knowledge/הקאה-אחרי-טחינה", label: "הקאה אחרי טעימה של טחינה" },
];

const BambaAt4Months = () => (
  <KnowledgeArticleLayout
    slug="במבה-גיל-4-חודשים"
    title="במבה בגיל 4 חודשים – מותר או מוקדם מדי?"
    metaDescription="במבה בגיל 4 חודשים – האם מותר? מתי ואיך לתת במבה לתינוק לפי ההמלצות הישראליות העדכניות."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        בשנים האחרונות ההמלצות השתנו, והורים רבים שומעים שבמבה יכולה להיות כלי לחשיפה מוקדמת לבוטנים.
      </p>
      <p>
        עם זאת, חשוב להבין מתי ואיך לעשות זאת נכון.
      </p>
      <p>
        המדריך המפורט כולל הסברים לפי גיל:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לטעימות ראשונות ואלרגנים
        </Link>.
      </p>

      <h2 className="text-lg font-bold text-foreground pt-4">כללים חשובים:</h2>
      <ul className="list-disc list-inside space-y-1.5">
        <li>רק במרקם מתאים</li>
        <li>רק בבית</li>
        <li>בכמות קטנה</li>
      </ul>
    </div>
  </KnowledgeArticleLayout>
);

export default BambaAt4Months;
