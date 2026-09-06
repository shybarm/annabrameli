import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { buildBreadcrumbSchema } from "@/utils/medicalSchema";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";

const contactInfo = [
  {
    icon: Mail,
    title: "דוא״ל",
    value: "info@drbrameli.co.il",
    href: "mailto:info@drbrameli.co.il",
  },
  {
    icon: MapPin,
    title: "כתובת",
    value: "הטווס 3, הוד השרון",
    href: "https://maps.google.com/?q=%D7%94%D7%98%D7%95%D7%95%D7%A1+3+%D7%94%D7%95%D7%93+%D7%94%D7%A9%D7%A8%D7%95%D7%9F",

  },
];

const hours = [
  { days: "ראשון - חמישי", time: "08:00 - 19:00" },
  { days: "שישי", time: "08:00 - 13:00" },
  { days: "שבת", time: "סגור" },
];

const Contact = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('notify-contact', {
        body: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        },
      });
      if (error) throw error;

      trackEvent('contact_form_submitted', {
        event_category: 'Lead',
        event_label: 'Contact Form',
        form_name: 'contact_form',
        page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      });
      toast({
        title: "הפנייה נשלחה בהצלחה",
        description: "נחזור אליכם בהקדם האפשרי",
      });
      navigate('/contact/success');
    } catch (error) {
      toast({
        title: "שליחת הפנייה נכשלה",
        description: "נסו שוב או התקשרו אלינו ישירות",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      <Helmet>
        <title>יצירת קשר וקביעת תור | ד״ר אנה ברמלי – מרפאת אלרגיה בהוד השרון</title>
        <meta 
          name="description" 
          content="קביעת תור במרפאת אלרגיה של ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה. כתובת: הטווס 3, הוד השרון. ייעוץ אלרגיה פרטי." 
        />
        <link rel="canonical" href="https://ihaveallergy.com/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ihaveallergy.com/contact" />
        <meta property="og:title" content="קביעת תור ויצירת קשר - מרפאת אלרגיה בהוד השרון" />
        <meta property="og:description" content="קביעת תור אצל ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה. מרפאה פרטית בהוד השרון, ייעוץ ואבחון אלרגיות בילדים ובמבוגרים." />
        <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema([
          { name: "דף הבית", item: "https://ihaveallergy.com/" },
          { name: "יצירת קשר", item: "https://ihaveallergy.com/contact" },
        ]))}</script>
      </Helmet>
      <SchemaMarkup type="contactPage" />

      {/* Hero */}
      <section className="gradient-hero py-20 md:py-28">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="font-bold text-foreground mb-6">
              יצירת קשר וקביעת תור
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              נשמח לעזור - פנו אלינו לקביעת תור לאבחון מקצועי או לכל שאלה. אנו מתחייבים לחזור אליכם בהקדם האפשרי.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="section-spacing-lg">
        <div className="container-medical">
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="bg-card rounded-2xl border border-border/60 p-7 md:p-9">
                <h2 className="text-2xl font-bold text-foreground mb-7">
                  טופס פנייה
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">שם מלא *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="הזינו את שמכם"
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">טלפון *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          placeholder="050-0000000"
                          dir="ltr"
                          className="text-right h-12 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">דוא״ל</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        dir="ltr"
                        className="text-right h-12 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">נושא הפנייה *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="לדוגמה: קביעת תור לאבחון אלרגיה"
                        className="h-12 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">פרטים נוספים</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="ספרו לנו על התסמינים או הסיבה לפנייה..."
                        rows={4}
                        className="rounded-xl"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          שולח...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          שלח פנייה
                        </span>
                      )}
                    </Button>
                  </form>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              {/* Quick Contact */}
              <div className="bg-card rounded-2xl border border-border/60 p-7 md:p-9">
                <h2 className="text-2xl font-bold text-foreground mb-7">
                  פרטי התקשרות
                </h2>
                <div className="space-y-6">
                  {contactInfo.map((item) => (
                    <a
                      key={item.title}
                      href={item.href}
                      target={item.icon === MapPin ? "_blank" : undefined}
                      rel={item.icon === MapPin ? "noopener noreferrer" : undefined}
                      className="flex items-start gap-4 group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{item.title}</p>
                        <p className="text-foreground font-medium group-hover:text-primary transition-colors">
                          {item.value}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Hours */}
              <div className="bg-card rounded-2xl border border-border/60 p-7 md:p-9">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    שעות פעילות
                  </h2>
                </div>
                <div className="space-y-4">
                  {hours.map((item) => (
                    <div key={item.days} className="flex items-center justify-between py-3 border-b border-border/60 last:border-b-0">
                      <span className="text-foreground font-medium text-sm">{item.days}</span>
                      <span className="text-muted-foreground text-sm">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Google Maps Embed */}
              <div className="bg-surface rounded-2xl overflow-hidden h-64 border border-border/60">
                <iframe
                  src="https://www.google.com/maps?q=%D7%94%D7%98%D7%95%D7%95%D7%A1%203%2C%20%D7%94%D7%95%D7%93%20%D7%94%D7%A9%D7%A8%D7%95%D7%9F&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="מרפאת אלרגיה - ד״ר אנה ברמלי, הטווס 3, הוד השרון"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
