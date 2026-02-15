import { Helmet } from "react-helmet-async";

const SecurityPolicy = () => {
  return (
    <>
      <Helmet>
        <title>אבטחת מידע | iHaveAllergy</title>
        <meta name="description" content="מדיניות אבטחת המידע של iHaveAllergy - אמצעי אבטחה ואחריות" />
        <link rel="canonical" href="https://ihaveallergy.com/security" />
      </Helmet>

      <div className="container-medical py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">אבטחת מידע</h1>
          <p className="text-xl text-primary font-semibold mb-8">iHaveAllergy</p>

          <div className="prose prose-lg max-w-none text-foreground space-y-8">
            <p className="text-lg leading-relaxed">
              אבטחת המידע באתר ובמערכת מהווה נדבך מרכזי בפעילות iHaveAllergy.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">אמצעי אבטחה</h2>
              <p className="mb-4">האתר והמערכת עושים שימוש באמצעים מקובלים, לרבות:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>הצפנת מידע בתעבורה</li>
                <li>בקרת גישה והרשאות</li>
                <li>הפרדת סביבות</li>
                <li>גיבויים תקופתיים</li>
                <li>ניטור ואמצעי הגנה טכנולוגיים</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">אחריות וסייגים</h2>
              <p className="mb-4 text-muted-foreground">
                המערכת ניתנת לשימוש במתכונת AS IS.
              </p>
              <p className="text-muted-foreground">
                למרות נקיטת אמצעי אבטחה, ייתכנו אירועים שאינם בשליטת מפעיל האתר, לרבות חדירות, כשלים טכנולוגיים או תקלות צד ג&apos;.
              </p>
              <p className="mt-4 text-muted-foreground">
                מפעיל האתר לא יישא באחריות לכל נזק שייגרם עקב אירועים כאמור, אלא אם הוכחה רשלנות חמורה על פי דין.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">אחריות המשתמש</h2>
              <p className="mb-4">המשתמש אחראי:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>לשמירת סודיות פרטי ההתחברות</li>
                <li>לשימוש זהיר במידע</li>
                <li>לפעול בהתאם להוראות הדין</li>
              </ul>
            </section>

            <section className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-foreground mb-2">שאלות בנושא אבטחה:</h3>
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

export default SecurityPolicy;
