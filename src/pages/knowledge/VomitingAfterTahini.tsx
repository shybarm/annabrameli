import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/טעימות-ראשונות-אלרגנים";

const relatedArticles = [
  { to: "/knowledge/פריחה-אחרי-במבה", label: "פריחה אחרי במבה לתינוק" },
  { to: "/knowledge/אודם-סביב-הפה-אחרי-אלרגן", label: "אודם סביב הפה אחרי טעימת אלרגן" },
  { to: "/knowledge/כמה-ימים-בין-אלרגנים", label: "כמה ימים מחכים בין אלרגנים?" },
  { to: "/knowledge/במבה-גיל-4-חודשים", label: "במבה בגיל 4 חודשים" },
];

const VomitingAfterTahini = () => (
  <KnowledgeArticleLayout
    slug="הקאה-אחרי-טחינה"
    title="הקאה אחרי טעימה של טחינה – האם זו אלרגיה?"
    metaDescription="הקאה אחרי טחינה לתינוק – מתי זו אלרגיה לשומשום ומתי תגובה רגילה. מדריך רפואי להורים ישראליים."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        הקאה לאחר חשיפה לשומשום עלולה להיות סימן רגיש, במיוחד בישראל שבה שומשום הוא אלרגן נפוץ.
      </p>
      <p>
        לא כל הקאה היא אלרגיה, אך אין להתעלם מהתגובה.
      </p>
      <p>
        לרקע והקשר רחב יותר:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לטעימות ראשונות ואלרגנים
        </Link>.
      </p>

      <h2 className="text-lg font-bold text-foreground pt-4">מה עושים:</h2>
      <ul className="list-disc list-inside space-y-1.5">
        <li>מפסיקים חשיפה</li>
        <li>מתעדים את המקרה</li>
        <li>פונים לייעוץ רפואי</li>
      </ul>
    </div>
  </KnowledgeArticleLayout>
);

export default VomitingAfterTahini;
