import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/בדיקות-אלרגיה-ילדים-ישראל";

const relatedArticles = [
  { to: "/knowledge/תבחיני-עור-כואב-לילדים", label: "תבחיני עור – האם זה כואב?" },
  { to: "/knowledge/בדיקת-דם-לאלרגיה-ילדים", label: "בדיקת דם לאלרגיה – מתי מספיקה?" },
  { to: "/knowledge/בדיקה-חיובית-בלי-תסמינים", label: "בדיקה חיובית בלי תסמינים" },
  { to: "/knowledge/בדיקות-אלרגיה-פרטי-או-קופה", label: "בדיקות אלרגיה – פרטי או קופה?" },
];

const OralFoodChallenge = () => (
  <KnowledgeArticleLayout
    slug="תגר-מזון-איך-זה-נראה"
    title="תגר מזון – איך זה נראה בפועל ולמי זה מתאים?"
    metaDescription="תגר מזון (Oral Food Challenge) – איך הבדיקה נראית בפועל, למי מתאים, ומה לצפות. מדריך רפואי להורים."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        תגר מזון נחשב לבדיקה המכריעה, אך גם למורכבת ביותר.
      </p>
      <p>
        הוא מתבצע רק בהשגחה רפואית ומתאים למצבים מסוימים בלבד.
      </p>
      <p>
        להבנה מלאה של התהליך:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לבדיקות אלרגיה לילדים בישראל
        </Link>.
      </p>
    </div>
  </KnowledgeArticleLayout>
);

export default OralFoodChallenge;
