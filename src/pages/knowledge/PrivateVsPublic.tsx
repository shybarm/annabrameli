import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/בדיקות-אלרגיה-ילדים-ישראל";

const relatedArticles = [
  { to: "/knowledge/תבחיני-עור-כואב-לילדים", label: "תבחיני עור – האם זה כואב?" },
  { to: "/knowledge/בדיקת-דם-לאלרגיה-ילדים", label: "בדיקת דם לאלרגיה – מתי מספיקה?" },
  { to: "/knowledge/תגר-מזון-איך-זה-נראה", label: "תגר מזון – איך זה נראה בפועל?" },
  { to: "/knowledge/בדיקה-חיובית-בלי-תסמינים", label: "בדיקה חיובית בלי תסמינים" },
];

const PrivateVsPublic = () => (
  <KnowledgeArticleLayout
    slug="בדיקות-אלרגיה-פרטי-או-קופה"
    title="בדיקות אלרגיה בקופה או פרטי – מתי זה באמת משנה?"
    metaDescription="בדיקות אלרגיה פרטי או קופת חולים – מתי ההבדל באמת משנה ומה השיקולים. מדריך להורים בישראל."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        הבחירה בין מערכת ציבורית לפרטית תלויה בזמינות, בדחיפות ובמורכבות המקרה.
      </p>
      <p>
        אין תשובה אחת שמתאימה לכולם.
      </p>
      <p>
        לשיקולים המלאים:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לבדיקות אלרגיה לילדים בישראל
        </Link>.
      </p>
    </div>
  </KnowledgeArticleLayout>
);

export default PrivateVsPublic;
