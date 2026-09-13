import { FormEvent, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Baby,
  CheckCircle2,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Stethoscope,
  TestTube2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent, trackPhoneClick } from "@/lib/analytics";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildMedicalPageSchema,
} from "@/utils/medicalSchema";

const CANONICAL_URL = "https://ihaveallergy.com/allergist-private";
const PHONE_DISPLAY = "052-5916393";
const PHONE_E164 = "+972525916393";

const faqs = [
  {
    question: "למי מתאים ייעוץ אצל אלרגולוג פרטי?",
    answer:
      "ייעוץ אלרגולוגי עשוי להתאים כאשר יש תגובה חוזרת למזון, תרופה או עקיצה, פריחה לא מוסברת, נזלת ממושכת, חשד לאסתמה אלרגית או צורך בבירור נוסף. סוג הבירור נקבע לפי הסיפור הרפואי והתסמינים.",
  },
  {
    question: "האם כל פנייה מחייבת בדיקת אלרגיה?",
    answer:
      "לא. הבירור מתחיל בשיחה רפואית ובבדיקה. בהתאם לממצאים הרופאה עשויה להמליץ על תבחיני עור, בדיקת דם ל-IgE, תגר מבוקר או על המשך מעקב ללא בדיקה נוספת.",
  },
  {
    question: "האם המרפאה מטפלת גם בילדים וגם במבוגרים?",
    answer:
      "כן. ד״ר אנה ברמלי מעניקה ייעוץ בתחום האלרגיה והאימונולוגיה לילדים ולמבוגרים, עם ניסיון מרכזי ברפואת ילדים ובאלרגיה בילדים.",
  },
  {
    question: "האם ניתן לקבל החזר מביטוח פרטי?",
    answer:
      "ייתכן החזר בהתאם לחברת הביטוח ולתנאי הפוליסה האישית. מומלץ לבדוק את הזכאות והמסמכים הנדרשים ישירות מול חברת הביטוח לפני הביקור.",
  },
];

const reasons = [
  "חשד לאלרגיה למזון או תגובה לאחר אכילה",
  "תגובה לתרופה, אנטיביוטיקה או עקיצה",
  "פריחה חוזרת, אורטיקריה או אטופיק דרמטיטיס",
  "נזלת אלרגית, שיעול או חשד לאסתמה אלרגית",
  "צורך בחוות דעת נוספת או בתכנון המשך בירור",
];

const process = [
  {
    icon: Stethoscope,
    title: "שיחה ובדיקה רפואית",
    text: "סקירת התסמינים, החשיפות, התגובות הקודמות והרקע הרפואי כדי למקד את הבירור.",
  },
  {
    icon: TestTube2,
    title: "התאמת בדיקות לפי הצורך",
    text: "בחירה מושכלת בין תבחיני עור, בדיקות דם או בדיקות נוספות, בהתאם לשאלה הרפואית.",
  },
  {
    icon: ShieldCheck,
    title: "תכנית המשך ברורה",
    text: "הסבר של הממצאים והמלצות להמשך טיפול, הימנעות, מעקב או בירור נוסף.",
  },
];

export default function PrivateAllergistLanding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const medicalSchema = buildMedicalPageSchema({
    headline: "אלרגולוגית פרטית לילדים ולמבוגרים בהוד השרון",
    description:
      "ייעוץ אלרגולוגי פרטי אצל ד״ר אנה ברמלי, מומחית ברפואת ילדים, אלרגיה ואימונולוגיה קלינית.",
    datePublished: "2026-09-13",
    dateModified: "2026-09-13",
    canonicalUrl: CANONICAL_URL,
    about: {
      "@type": "MedicalSpecialty",
      name: "Allergy and Immunology",
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("notify-contact", {
        body: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          subject: "פנייה מעמוד אלרגולוג פרטי",
          message: formData.message.trim(),
          source: "allergist_private_landing",
        },
      });
      if (error) throw error;

      trackEvent("contact_form_submitted", {
        event_category: "Lead",
        event_label: "Private Allergist Landing",
        form_name: "private_allergist_landing",
        page_path: window.location.pathname,
      });
      navigate("/contact/success");
    } catch {
      toast({
        title: "שליחת הפנייה נכשלה",
        description: "נסו שוב או התקשרו למרפאה",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>אלרגולוג פרטי ובדיקת אלרגיה פרטית | ד״ר אנה ברמלי</title>
        <meta
          name="description"
          content="ייעוץ אלרגולוגי פרטי לילדים ולמבוגרים אצל ד״ר אנה ברמלי בהוד השרון. בירור אלרגיה והתאמת בדיקות לפי הסיפור הרפואי והתסמינים."
        />
        <link rel="canonical" href={CANONICAL_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL_URL} />
        <meta property="og:title" content="אלרגולוגית פרטית לילדים ולמבוגרים | ד״ר אנה ברמלי" />
        <meta
          property="og:description"
          content="ייעוץ ובירור אלרגיה במסגרת פרטית בהוד השרון, בתיאום מראש."
        />
        <meta property="og:image" content="https://ihaveallergy.com/images/optimized/portrait-768.webp" />
        <script type="application/ld+json">{JSON.stringify(medicalSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(buildFaqSchema(faqs))}</script>
        <script type="application/ld+json">
          {JSON.stringify(
            buildBreadcrumbSchema([
              { name: "דף הבית", item: "https://ihaveallergy.com/" },
              { name: "אלרגולוג פרטי", item: CANONICAL_URL },
            ]),
          )}
        </script>
      </Helmet>

      <section className="gradient-hero overflow-hidden py-12 md:py-20">
        <div className="container-medical">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-2 text-sm font-medium text-primary">
                <MapPin className="h-4 w-4" /> מרפאה פרטית בהוד השרון
              </p>
              <h1 className="mb-6 font-bold text-foreground">
                אלרגולוגית פרטית לילדים ולמבוגרים
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                ייעוץ אצל ד״ר אנה ברמלי, מומחית ברפואת ילדים, אלרגיה ואימונולוגיה קלינית. הבירור מתחיל בסיפור הרפואי ובתסמינים, ורק לאחר מכן מותאמות הבדיקות והמלצות ההמשך.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <a
                    href={`tel:${PHONE_E164}`}
                    onClick={() => trackPhoneClick("private_allergist_hero", PHONE_E164)}
                  >
                    <Phone className="ml-2 h-5 w-5" /> התקשרו למרפאה
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#contact-form">השאירו פרטים</a>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">הייעוץ מתקיים בתיאום מראש.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto w-full max-w-md"
            >
              <img
                src="/images/optimized/portrait-768.webp"
                srcSet="/images/optimized/portrait-384.webp 384w, /images/optimized/portrait-768.webp 768w"
                sizes="(max-width: 1024px) 90vw, 430px"
                width={768}
                height={768}
                alt="ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה"
                className="aspect-square w-full rounded-[2rem] object-cover object-top shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-spacing bg-background">
        <div className="container-medical grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-5">מתי כדאי לפנות לבירור אלרגיה?</h2>
            <p className="mb-6 text-muted-foreground">
              בדיקת אלרגיה אינה בדיקת סקר אחידה. התסמינים, מועד הופעתם והקשר לחשיפה מסוימת הם שמכוונים את בחירת הבדיקה.
            </p>
            <ul className="space-y-4">
              {reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-primary" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-border/60 bg-surface p-7 md:p-9">
            <Baby className="mb-5 h-10 w-10 text-primary" />
            <h2 className="mb-4">ניסיון רפואי שמותאם למשפחה</h2>
            <p className="leading-relaxed text-muted-foreground">
              ד״ר ברמלי בוגרת לימודי רפואה באוניברסיטת בן גוריון והתמחות ברפואת ילדים במרכז שניידר. את תת ההתמחות באלרגיה ואימונולוגיה קלינית השלימה ב־Vanderbilt University Medical Center.
            </p>
            <Link to="/dr-anna-brameli" className="mt-5 inline-block font-medium text-primary hover:underline">
              קראו על ההכשרה והניסיון של ד״ר ברמלי
            </Link>
          </div>
        </div>
      </section>

      <section className="section-spacing bg-surface">
        <div className="container-medical">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="mb-4">איך מתבצע הבירור?</h2>
            <p className="text-muted-foreground">שלושה שלבים שמייצרים תמונה רפואית ממוקדת ותכנית המשך ברורה.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {process.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border/60 bg-card p-7 shadow-sm">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-3 text-xl">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-muted-foreground">
            מידע נוסף על סוגי הבדיקות נמצא ב
            <Link to="/guides/בדיקות-אלרגיה-ילדים-ישראל" className="text-primary hover:underline">מדריך בדיקות האלרגיה</Link>
            {" "}ובעמוד <Link to="/services" className="text-primary hover:underline">שירותי המרפאה</Link>.
          </p>
        </div>
      </section>

      <section id="contact-form" className="section-spacing scroll-mt-24">
        <div className="container-medical grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="mb-5">פנייה למרפאה</h2>
            <p className="mb-6 text-muted-foreground">
              השאירו פרטים ונחזור אליכם לתיאום. אין צורך למסור מידע רפואי רגיש בטופס.
            </p>
            <div className="rounded-2xl border border-primary/20 bg-accent/50 p-5">
              <p className="font-semibold">מעדיפים לדבר?</p>
              <a
                href={`tel:${PHONE_E164}`}
                onClick={() => trackPhoneClick("private_allergist_contact", PHONE_E164)}
                className="mt-2 inline-flex items-center gap-2 text-lg font-bold text-primary"
                dir="ltr"
              >
                <Phone className="h-5 w-5" /> {PHONE_DISPLAY}
              </a>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-border/60 bg-card p-7 shadow-md md:p-9">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="landing-name">שם מלא *</Label>
                <Input
                  id="landing-name"
                  required
                  autoComplete="name"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="landing-phone">טלפון *</Label>
                <Input
                  id="landing-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  dir="ltr"
                  className="text-right"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="landing-email">דוא״ל</Label>
              <Input
                id="landing-email"
                type="email"
                autoComplete="email"
                dir="ltr"
                className="text-right"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landing-message">במה נוכל לעזור?</Label>
              <Textarea
                id="landing-message"
                rows={4}
                placeholder="תיאור קצר של סיבת הפנייה"
                value={formData.message}
                onChange={(event) => setFormData({ ...formData, message: event.target.value })}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              <Send className="ml-2 h-5 w-5" />
              {isSubmitting ? "שולח..." : "שליחת פנייה"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              שליחת הטופס אינה מיועדת למצבי חירום ואינה מהווה ייעוץ רפואי.
            </p>
          </form>
        </div>
      </section>

      <section className="section-spacing bg-surface">
        <div className="container-medical max-w-3xl">
          <h2 className="mb-8 text-center">שאלות נפוצות</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-2xl border border-border/60 bg-card p-5">
                <summary className="cursor-pointer font-semibold">{faq.question}</summary>
                <p className="mt-3 text-sm text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
