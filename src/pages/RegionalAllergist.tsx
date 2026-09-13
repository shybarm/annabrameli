import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { MapPin, Phone, Stethoscope, TestTube2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/utils/medicalSchema";
import { trackPhoneClick } from "@/lib/analytics";

const CANONICAL = "https://ihaveallergy.com/allergist-central-sharon";
const PHONE_E164 = "+972525916393";
const areas = ["הוד השרון", "כפר סבא", "רעננה", "הרצליה", "נתניה", "פתח תקווה", "תל אביב", "רמת גן", "ראשון לציון", "חולון"];
const faqs = [
  { question: "היכן מתקיים הייעוץ?", answer: "הייעוץ מתקיים במרפאה הפרטית בהוד השרון, בתיאום מראש. העמוד מיועד גם למשפחות שמחפשות אלרגולוג באזור המרכז והשרון ומעוניינות להגיע למרפאה בהוד השרון." },
  { question: "האם אפשר לבצע בדיקת אלרגיה בכל ביקור?", answer: "לא כל פנייה מחייבת בדיקה. תחילה עוברים על הסיפור הרפואי והתסמינים, ורק לאחר מכן מותאמת הבדיקה הנכונה לפי הצורך הרפואי." },
  { question: "האם הייעוץ מתאים גם לאלרגיה למזון?", answer: "כן. ניתן לפנות לבירור חשד לאלרגיה למזון, מעבר על תגובות ובדיקות קודמות, והכוונה לגבי המשך בירור או טיפול במסגרת המתאימה." },
];

export default function RegionalAllergist() {
  const clinicSchema = {
    "@context": "https://schema.org", "@type": "MedicalClinic",
    name: "מרפאת האלרגיה של ד״ר אנה ברמלי", url: CANONICAL,
    medicalSpecialty: "Allergy and Immunology",
    address: { "@type": "PostalAddress", addressLocality: "הוד השרון", addressCountry: "IL" },
    areaServed: areas.map((name) => ({ "@type": "City", name })),
  };
  return <>
    <Helmet>
      <title>אלרגולוג פרטי במרכז ובשרון | ד״ר אנה ברמלי</title>
      <meta name="description" content="מחפשים רופא אלרגיה פרטי במרכז או בשרון? ייעוץ לילדים ולמבוגרים במרפאת ד״ר אנה ברמלי בהוד השרון, כולל בירור אלרגיה למזון והתאמת בדיקות." />
      <link rel="canonical" href={CANONICAL} /><meta name="robots" content="index, follow, max-image-preview:large" />
      <meta property="og:type" content="website" /><meta property="og:url" content={CANONICAL} />
      <meta property="og:title" content="אלרגולוג פרטי במרכז ובשרון | ד״ר אנה ברמלי" />
      <meta property="og:description" content="ייעוץ אלרגיה פרטי במרפאה בהוד השרון, בתיאום מראש, למשפחות מהמרכז והשרון." />
      <meta property="og:image" content="https://ihaveallergy.com/images/optimized/portrait-768.webp" /><meta name="twitter:card" content="summary_large_image" />
      <script type="application/ld+json">{JSON.stringify(clinicSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(buildFaqSchema(faqs))}</script>
      <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema([{ name: "ראשי", item: "https://ihaveallergy.com/" }, { name: "אלרגולוג במרכז ובשרון", item: CANONICAL }]))}</script>
    </Helmet>
    <section className="gradient-hero py-14 md:py-20"><div className="container-medical grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
      <div><p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-2 text-sm font-medium text-primary"><MapPin className="h-4 w-4" /> המרפאה בהוד השרון</p>
        <h1 className="mb-6 text-balance font-bold text-foreground">אלרגולוג פרטי באזור המרכז והשרון</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">ד״ר אנה ברמלי מעניקה ייעוץ פרטי באלרגיה ואימונולוגיה לילדים ולמבוגרים. משפחות מהמרכז ומהשרון יכולות להגיע למרפאה בהוד השרון לבירור אלרגיה למזון, תרופות ועקיצות, פריחה ואורטיקריה, נזלת ואסתמה אלרגית.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Button size="lg" asChild><a href={`tel:${PHONE_E164}`} onClick={() => trackPhoneClick("regional_allergist_hero", PHONE_E164)}><Phone className="ml-2 h-5 w-5" /> התקשרו למרפאה</a></Button><Button size="lg" variant="outline" asChild><Link to="/allergist-private#contact-form">השאירו פרטים</Link></Button></div><p className="mt-4 text-sm text-muted-foreground">הייעוץ מתקיים בתיאום מראש.</p></div>
      <img src="/images/optimized/portrait-768.webp" srcSet="/images/optimized/portrait-384.webp 384w, /images/optimized/portrait-768.webp 768w" sizes="(max-width: 1024px) 90vw, 420px" width={768} height={768} alt="ד״ר אנה ברמלי, אלרגולוגית פרטית במרפאה בהוד השרון" className="mx-auto aspect-square w-full max-w-md rounded-[2rem] object-cover object-top shadow-xl" />
    </div></section>
    <section className="section-spacing bg-background"><div className="container-medical"><div className="mx-auto max-w-3xl text-center"><h2 className="mb-4">ייעוץ ממוקד לפני שבוחרים בדיקה</h2><p className="text-muted-foreground">בדיקת אלרגיה לבדה אינה אבחנה. הבחירה בין תבחין עור, בדיקת דם או תגר מבוקר מתחילה בהיסטוריה רפואית ובהערכת אלרגולוג.</p></div>
      <div className="mt-10 grid gap-5 md:grid-cols-3"><div className="rounded-3xl border bg-card p-7"><Stethoscope className="mb-4 h-8 w-8 text-primary" /><h3 className="mb-2 font-semibold">ייעוץ אלרגולוגי פרטי</h3><p className="text-sm text-muted-foreground">סקירת התסמינים, החשיפות, התגובות ובדיקות קודמות.</p></div><div className="rounded-3xl border bg-card p-7"><TestTube2 className="mb-4 h-8 w-8 text-primary" /><h3 className="mb-2 font-semibold">התאמת בדיקות</h3><p className="text-sm text-muted-foreground">בחירת בדיקה לפי השאלה הרפואית, בלי בדיקות סקר מיותרות.</p></div><div className="rounded-3xl border bg-card p-7"><MapPin className="mb-4 h-8 w-8 text-primary" /><h3 className="mb-2 font-semibold">מרפאה בהוד השרון</h3><p className="text-sm text-muted-foreground">גישה פרטית בתיאום מראש למטופלים מאזור המרכז והשרון.</p></div></div>
    </div></section>
    <section className="section-spacing bg-muted/40"><div className="container-medical grid gap-10 lg:grid-cols-2"><div><h2 className="mb-5">אזורי השירות</h2><p className="mb-6 text-muted-foreground">המרפאה נמצאת בהוד השרון. העמוד מסייע למי שמחפש רופא אלרגיה פרטי במרכז ובשרון להבין היכן מתקיים הייעוץ לפני הפנייה.</p><ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">{areas.map((area) => <li key={area} className="rounded-xl border bg-background px-4 py-3 text-sm font-medium">{area}</li>)}</ul></div>
      <div><h2 className="mb-5">בירור אלרגיה למזון</h2><p className="mb-5 text-muted-foreground">בפגישה ניתן לעבור על תגובות לאחר אכילה, תבחיני עור ובדיקות IgE קודמות, ולבדוק האם נדרש תגר מזון, מעקב או הערכת התאמה לטיפול במסגרת רפואית מתאימה.</p><div className="flex flex-wrap gap-3"><Button variant="outline" asChild><Link to="/food-desensitization">ייעוץ בנושא אלרגיה למזון</Link></Button><Button variant="outline" asChild><Link to="/guides/בדיקות-אלרגיה-ילדים-ישראל">מדריך לבדיקות אלרגיה</Link></Button></div></div></div></section>
    <section className="section-spacing bg-background"><div className="container-medical max-w-3xl"><h2 className="mb-6 text-center">שאלות נפוצות</h2>{faqs.map((faq) => <details key={faq.question} className="mb-3 rounded-2xl border bg-card p-5"><summary className="cursor-pointer font-semibold">{faq.question}</summary><p className="mt-3 leading-relaxed text-muted-foreground">{faq.answer}</p></details>)}</div></section>
  </>;
}
