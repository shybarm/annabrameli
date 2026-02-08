import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/בדיקות-אלרגיה-ילדים-ישראל";

const relatedArticles = [
  { to: "/knowledge/בדיקת-דם-לאלרגיה-ילדים", label: "בדיקת דם לאלרגיה – מתי מספיקה?" },
  { to: "/knowledge/תגר-מזון-איך-זה-נראה", label: "תגר מזון – איך זה נראה בפועל?" },
  { to: "/knowledge/בדיקה-חיובית-בלי-תסמינים", label: "בדיקה חיובית בלי תסמינים" },
  { to: "/knowledge/בדיקות-אלרגיה-פרטי-או-קופה", label: "בדיקות אלרגיה – פרטי או קופה?" },
];

const SkinPrickPain = () => (
  <KnowledgeArticleLayout
    slug="תבחיני-עור-כואב-לילדים"
    title="תבחיני עור לילדים – האם זה כואב ומה חשוב לדעת?"
    metaDescription="תבחיני עור לאלרגיה לילדים – האם זה כואב, איך מתכוננים, ומה לצפות. מדריך רפואי להורים."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        הרבה הורים חוששים מבדיקות אלרגיה בגלל החשש מכאב או טראומה לילד.
      </p>
      <p>
        בפועל, תבחיני עור הם בדיקה מהירה ועדינה יחסית, כאשר מבוצעת בידיים מיומנות.
      </p>
      <p>
        לפירוט מלא על סוגי הבדיקות:{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לבדיקות אלרגיה לילדים בישראל
        </Link>.
      </p>
    </div>
  </KnowledgeArticleLayout>
);

export default SkinPrickPain;
