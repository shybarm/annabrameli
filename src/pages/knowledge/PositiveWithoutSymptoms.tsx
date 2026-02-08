import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/בדיקות-אלרגיה-ילדים-ישראל";

const relatedArticles = [
  { to: "/knowledge/תבחיני-עור-כואב-לילדים", label: "תבחיני עור – האם זה כואב?" },
  { to: "/knowledge/בדיקת-דם-לאלרגיה-ילדים", label: "בדיקת דם לאלרגיה – מתי מספיקה?" },
  { to: "/knowledge/תגר-מזון-איך-זה-נראה", label: "תגר מזון – איך זה נראה בפועל?" },
  { to: "/knowledge/בדיקות-אלרגיה-פרטי-או-קופה", label: "בדיקות אלרגיה – פרטי או קופה?" },
];

const PositiveWithoutSymptoms = () => (
  <KnowledgeArticleLayout
    slug="בדיקה-חיובית-בלי-תסמינים"
    title="בדיקת אלרגיה חיובית בלי תסמינים – מה זה אומר?"
    metaDescription="בדיקת אלרגיה חיובית בלי תסמינים – מה המשמעות ומתי צריך בירור נוסף. הסבר רפואי להורים."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        לא כל תוצאה חיובית משקפת אלרגיה פעילה.
      </p>
      <p>
        כאן נכנס שיקול הדעת הרפואי – ולא פרשנות עצמאית.
      </p>
      <p>
        להסבר כולל:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לבדיקות אלרגיה לילדים בישראל
        </Link>.
      </p>
    </div>
  </KnowledgeArticleLayout>
);

export default PositiveWithoutSymptoms;
