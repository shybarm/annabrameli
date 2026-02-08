import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/בדיקות-אלרגיה-ילדים-ישראל";

const relatedArticles = [
  { to: "/knowledge/תבחיני-עור-כואב-לילדים", label: "תבחיני עור – האם זה כואב?" },
  { to: "/knowledge/תגר-מזון-איך-זה-נראה", label: "תגר מזון – איך זה נראה בפועל?" },
  { to: "/knowledge/בדיקה-חיובית-בלי-תסמינים", label: "בדיקה חיובית בלי תסמינים" },
  { to: "/knowledge/בדיקות-אלרגיה-פרטי-או-קופה", label: "בדיקות אלרגיה – פרטי או קופה?" },
];

const BloodTestAllergy = () => (
  <KnowledgeArticleLayout
    slug="בדיקת-דם-לאלרגיה-ילדים"
    title="בדיקת דם לאלרגיה – מתי היא מספיקה?"
    metaDescription="בדיקת דם לאלרגיה לילדים – מתי היא מספיקה ומתי נדרש בירור נוסף. הסבר רפואי ברור להורים."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        בדיקות דם לאלרגיה נתפסות כפשוטות יותר, אך לא תמיד מספקות תשובה מלאה.
      </p>
      <p>
        חשוב להבין מתי בדיקת דם מספיקה ומתי נדרש בירור נוסף.
      </p>
      <p>
        להקשר הרחב:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לבדיקות אלרגיה לילדים בישראל
        </Link>.
      </p>
    </div>
  </KnowledgeArticleLayout>
);

export default BloodTestAllergy;
