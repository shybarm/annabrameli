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
    title="בדיקת אלרגיה פרטית או בקופה – מחיר ומה חשוב לבדוק"
    metaDescription="בדיקת אלרגיה פרטית או דרך קופת חולים: מה עשוי להשפיע על המחיר, מה כולל הבירור ואילו שאלות כדאי לשאול לפני שקובעים תור."
    relatedArticles={relatedArticles}
  >
    <div className="text-muted-foreground leading-relaxed space-y-8">
      <p>
        כשמחפשים בדיקת אלרגיה פרטית, חשוב להבחין בין הייעוץ אצל אלרגולוג לבין הבדיקה עצמה. הבירור מתחיל בסיפור הרפואי: מה קרה, כמה זמן לאחר החשיפה, האם התגובה חזרה ואילו טיפולים ניתנו. רק לאחר מכן מחליטים אם יש צורך בתבחיני עור, בבדיקת דם או בבדיקה אחרת.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">מה ההבדל בין בירור בקופה לבירור פרטי?</h2>
        <p>
          השיקולים העיקריים הם זמינות התור, ההסדר עם הביטוח או הקופה, מקום ביצוע הבדיקות והאפשרות להמשך מעקב. איכות הבירור תלויה בהתאמה בין הסיפור הרפואי לבדיקה, ולא במספר האלרגנים שנבדקים.
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li><strong className="text-foreground">בקופת חולים:</strong> כדאי לבדוק אם נדרשת הפניה, היכן מבוצעות הבדיקות ומה זמן ההמתנה.</li>
          <li><strong className="text-foreground">במסלול פרטי:</strong> כדאי לברר מראש מה כולל מחיר הייעוץ, האם בדיקה מתבצעת באותו ביקור ומה עשוי להיות מחויב בנפרד.</li>
          <li><strong className="text-foreground">ביטוח משלים או פרטי:</strong> תנאי ההחזר משתנים, ולכן יש לבדוק זכאות ישירות מול הגוף המבטח לפני קביעת התור.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">מה משפיע על מחיר בדיקת אלרגיה פרטית?</h2>
        <p>
          אין מחיר אחיד לכל בירור. העלות עשויה להשתנות לפי סוג הייעוץ, הבדיקות שנמצאו מתאימות, מקום ביצוען והכיסוי הביטוחי. תגר מזון או תרופה הוא הליך רפואי שונה מתבחין עור או בדיקת דם, ולכן חשוב לקבל פירוט שמתייחס לבדיקה הספציפית שהומלצה.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">ארבע שאלות שכדאי לשאול לפני שקובעים</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>האם צריך הפניה או מסמכים רפואיים קודמים?</li>
          <li>האם מחיר התור כולל בדיקה, או שהבדיקות מחויבות בנפרד?</li>
          <li>האם צריך להפסיק תרופות לפני הביקור, ורק לפי הנחיה רפואית?</li>
          <li>כיצד מתקבלים הסיכום, התוצאות והנחיות ההמשך?</li>
        </ol>
      </section>

      <p>
        להסבר על תבחיני עור, בדיקות דם ותגרי מזון, עברו אל{" "}
        <Link to={GOLDEN_GUIDE} className="text-primary font-medium hover:underline">
          המדריך המלא לבדיקות אלרגיה לילדים בישראל
        </Link>. מידע על סוגי הייעוץ והמצבים המטופלים נמצא גם ב<Link to="/services" className="text-primary font-medium hover:underline">עמוד שירותי מרפאת האלרגיה</Link>.
      </p>
    </div>
  </KnowledgeArticleLayout>
);

export default PrivateVsPublic;
