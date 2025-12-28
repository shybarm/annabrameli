import { Helmet } from "react-helmet-async";

const AccessibilityStatement = () => {
  return (
    <>
      <Helmet>
        <title>הצהרת נגישות | iHaveAllergy</title>
        <meta name="description" content="הצהרת הנגישות של iHaveAllergy - התאמות נגישות ויצירת קשר" />
      </Helmet>

      <div className="container-medical py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">הצהרת נגישות</h1>
          <p className="text-xl text-primary font-semibold mb-8">iHaveAllergy</p>

          <div className="prose prose-lg max-w-none text-foreground space-y-8">
            <p className="text-lg leading-relaxed">
              אתר iHaveAllergy רואה חשיבות רבה בהנגשת שירותיו לכלל הציבור, ופועל בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ״ח–1998, ולתקנות הנגישות.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">התאמות נגישות שבוצעו באתר</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>התאמה לגלישה באמצעות מקלדת</li>
                <li>תאימות לקוראי מסך</li>
                <li>שימוש בכותרות ברורות ומבנה היררכי</li>
                <li>ניגודיות צבעים תקינה</li>
                <li>טקסטים קריאים וברורים</li>
                <li>אפשרות להגדלת טקסט</li>
                <li>מצב ניגודיות גבוהה</li>
                <li>הפחתת אנימציות</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">סייגים</h2>
              <p className="text-muted-foreground">
                למרות מאמצינו, ייתכן שחלק מהעמודים או רכיבים באתר אינם נגישים באופן מלא, במיוחד תכנים חיצוניים או רכיבי צד ג&apos;.
              </p>
            </section>

            <section className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-foreground mb-2">יצירת קשר בנושא נגישות</h3>
              <p className="text-muted-foreground mb-4">
                אם נתקלת בקושי או תקלה בנושא נגישות, נשמח לטפל בכך:
              </p>
              <a 
                href="mailto:support@ihaveallergy.com" 
                className="text-primary hover:underline"
              >
                📧 support@ihaveallergy.com
              </a>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccessibilityStatement;
