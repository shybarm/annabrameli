import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/טעימות-ראשונות-אלרגנים";

const relatedArticles = [
  { to: "/knowledge/פריחה-אחרי-במבה", label: "פריחה אחרי במבה לתינוק" },
  { to: "/knowledge/הקאה-אחרי-טחינה", label: "הקאה אחרי טעימה של טחינה" },
  { to: "/knowledge/כמה-ימים-בין-אלרגנים", label: "כמה ימים מחכים בין אלרגנים?" },
  { to: "/knowledge/במבה-גיל-4-חודשים", label: "במבה בגיל 4 חודשים" },
];

const RednessAroundMouth = () => (
  <KnowledgeArticleLayout
    slug="אודם-סביב-הפה-אחרי-אלרגן"
    title="אודם סביב הפה אחרי טעימת אלרגן – מתי זה תקין?"
    metaDescription="אודם סביב הפה אחרי טעימת אלרגן – מתי זו תגובה תקינה ומתי סימן אזהרה. הסבר רפואי ברור להורים."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        אודם סביב הפה הוא אחת התגובות השכיחות ביותר לאחר טעימות ראשונות. לרוב, מדובר בתגובה עורית מקומית ולא באלרגיה אמיתית.
      </p>
      <p>
        חשיפה נכונה ומבוקרת חשובה, ולכן כדאי להכיר את ההבדל בין תגובה צפויה לבין סימן אזהרה.
      </p>
      <p>
        לסקירה רחבה על סדר חשיפה לאלרגנים, ראו:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לטעימות ראשונות ואלרגנים
        </Link>.
      </p>

      <h2 className="text-lg font-bold text-foreground pt-4">תגובה תקינה:</h2>
      <ul className="list-disc list-inside space-y-1.5">
        <li>ללא נפיחות</li>
        <li>ללא החמרה</li>
      </ul>

      <h2 className="text-lg font-bold text-foreground pt-4">תגובה שמצריכה בירור:</h2>
      <ul className="list-disc list-inside space-y-1.5">
        <li>החמרה עם הזמן</li>
        <li>תסמינים כלליים</li>
      </ul>
    </div>
  </KnowledgeArticleLayout>
);

export default RednessAroundMouth;
