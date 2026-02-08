import { Link } from "react-router-dom";
import { KnowledgeArticleLayout } from "@/components/knowledge/KnowledgeArticleLayout";

const GOLDEN_GUIDE = "/guides/טעימות-ראשונות-אלרגנים";

const relatedArticles = [
  { to: "/knowledge/אודם-סביב-הפה-אחרי-אלרגן", label: "אודם סביב הפה אחרי טעימת אלרגן" },
  { to: "/knowledge/במבה-גיל-4-חודשים", label: "במבה בגיל 4 חודשים – מותר או מוקדם מדי?" },
  { to: "/knowledge/הקאה-אחרי-טחינה", label: "הקאה אחרי טעימה של טחינה" },
  { to: "/knowledge/כמה-ימים-בין-אלרגנים", label: "כמה ימים מחכים בין אלרגנים?" },
];

const RashAfterBamba = () => (
  <KnowledgeArticleLayout
    slug="פריחה-אחרי-במבה"
    title="פריחה אחרי במבה לתינוק – אלרגיה או גירוי זמני?"
    metaDescription="פריחה אחרי במבה לתינוק – איך להבדיל בין גירוי עורי זמני לבין סימני אלרגיה אמיתית. מדריך רפואי מקצועי להורים."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-4">
      <p>
        פריחה שמופיעה סביב הפה או בלחיים אחרי טעימה ראשונה של במבה היא תופעה שמלחיצה הורים רבים. חשוב לדעת שלא כל אדמומיות מעידה על אלרגיה.
      </p>
      <p>
        במקרים רבים מדובר בגירוי מקומי של העור ממגע עם המזון עצמו, במיוחד אצל תינוקות עם עור רגיש. עם זאת, יש סימנים שמצריכים תשומת לב רפואית.
      </p>
      <p>
        לקריאה מעמיקה על חשיפה נכונה לאלרגנים, מומלץ לעיין ב־
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לטעימות ראשונות ואלרגנים
        </Link>.
      </p>

      <h2 className="text-lg font-bold text-foreground pt-4">מתי זה כנראה לא אלרגיה:</h2>
      <ul className="list-disc list-inside space-y-1.5">
        <li>אודם מקומי שחולף תוך זמן קצר</li>
        <li>ללא תסמינים נוספים</li>
      </ul>

      <h2 className="text-lg font-bold text-foreground pt-4">מתי כדאי להיבדק:</h2>
      <ul className="list-disc list-inside space-y-1.5">
        <li>פריחה מתפשטת</li>
        <li>הקאות, שיעול או נפיחות</li>
      </ul>

      <p className="font-medium text-foreground pt-2">בספק – לא מנסים שוב לבד.</p>
    </div>
  </KnowledgeArticleLayout>
);

export default RashAfterBamba;
