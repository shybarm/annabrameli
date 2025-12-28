import { Helmet } from "react-helmet-async";

const PrivacyPolicy = () => {
  const currentDate = new Date().toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Helmet>
        <title>מדיניות פרטיות | iHaveAllergy</title>
        <meta name="description" content="מדיניות הפרטיות של iHaveAllergy - איסוף מידע, שימוש במידע וזכויות המשתמש" />
      </Helmet>

      <div className="container-medical py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">מדיניות פרטיות</h1>
          <p className="text-xl text-primary font-semibold mb-2">iHaveAllergy</p>
          <p className="text-muted-foreground mb-8">עודכן לאחרונה: {currentDate}</p>

          <div className="prose prose-lg max-w-none text-foreground space-y-8">
            <p className="text-lg leading-relaxed">
              אתר iHaveAllergy (להלן: &quot;האתר&quot;) מכבד את פרטיות המשתמשים ופועל בהתאם לחוק הגנת הפרטיות, התשמ״א–1981, ולתקנות מכוחו.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. איסוף מידע</h2>
              <p className="mb-4">במסגרת השימוש באתר ייתכן וייאסף מידע כדלקמן:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>מידע מזהה: שם, מספר טלפון, כתובת דוא״ל</li>
                <li>מידע רפואי הנמסר ביוזמת המשתמש</li>
                <li>מידע טכני: כתובת IP, סוג דפדפן, זמני גלישה</li>
              </ul>
              <p className="mt-4 text-muted-foreground">
                מסירת מידע אישי נעשית מרצון חופשי ובהסכמת המשתמש.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. שימוש במידע</h2>
              <p className="mb-4">המידע שנאסף ישמש לצרכים הבאים בלבד:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>מתן שירותים דרך האתר</li>
                <li>יצירת קשר עם המשתמש</li>
                <li>תפעול, תחזוקה ושיפור השירות</li>
                <li>עמידה בדרישות חוק</li>
              </ul>
              <p className="mt-4 text-muted-foreground">
                המידע לא ישמש לצרכים שיווקיים ללא הסכמה מפורשת.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. מסירת מידע לצד שלישי</h2>
              <p className="mb-4">האתר לא יעביר מידע אישי לצדדים שלישיים, אלא באחד מהמקרים הבאים:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>על פי דרישת חוק או רשות מוסמכת</li>
                <li>לספקי שירות טכנולוגיים (אחסון, אבטחה), בכפוף להתחייבות לשמירת סודיות</li>
                <li>בהסכמת המשתמש</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. אבטחת מידע</h2>
              <p className="mb-4 text-muted-foreground">
                האתר נוקט באמצעי אבטחה מקובלים לשמירה על המידע (ראו פירוט במדיניות אבטחת המידע).
              </p>
              <p className="text-muted-foreground">
                יחד עם זאת, אין אפשרות להבטיח הגנה מוחלטת, והמשתמש מוותר מראש על כל טענה בעניין זה, למעט רשלנות חמורה.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. זכויות המשתמש</h2>
              <p className="mb-4">המשתמש רשאי לבקש:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>עיון במידע אודותיו</li>
                <li>תיקון מידע שגוי</li>
                <li>מחיקת מידע – בכפוף להוראות הדין</li>
              </ul>
            </section>

            <section className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-foreground mb-2">פניות בנושא פרטיות:</h3>
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

export default PrivacyPolicy;
