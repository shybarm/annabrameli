import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";

const contactInfo = [
  {
    icon: Phone,
    title: "טלפון",
    value: "054-580-8008",
    href: "tel:0545808008",
  },
  {
    icon: Mail,
    title: "דוא״ל",
    value: "info@drbrameli.co.il",
    href: "mailto:info@drbrameli.co.il",
  },
  {
    icon: MapPin,
    title: "כתובת",
    value: "טבס 3, הוד השרון",
    href: "https://maps.google.com/?q=טבס+3+הוד+השרון",
  },
];

const hours = [
  { days: "ראשון - חמישי", time: "08:00 - 19:00" },
  { days: "שישי", time: "08:00 - 13:00" },
  { days: "שבת", time: "סגור" },
];

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

    // Simulate form submission
    // TODO: Connect to backend API for form handling
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
      title: "הפנייה נשלחה בהצלחה",
      description: "נחזור אליכם בהקדם האפשרי",
    });
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
        <title>יצירת קשר וקביעת תור | ד״ר אנה ברמלי</title>
        <meta 
          name="description" 
          content="קביעת תור לד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה. טלפון: 054-580-8008, כתובת: טבס 3, הוד השרון." 
        />
      </Helmet>
      <SchemaMarkup type="physician" />

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
              נשמח לעזור — פנו אלינו לקביעת תור לאבחון מקצועי או לכל שאלה. אנו מתחייבים לחזור אליכם בהקדם האפשרי.
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

                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-14"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      הפנייה נשלחה בהצלחה!
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      נחזור אליכם בהקדם האפשרי לתיאום התור.
                    </p>
                    <Button onClick={() => setIsSubmitted(false)} variant="outline">
                      שלח פנייה נוספת
                    </Button>
                  </motion.div>
                ) : (
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
                )}
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

              {/* Map Placeholder */}
              <div className="bg-surface rounded-2xl overflow-hidden h-64 flex items-center justify-center border border-border/60">
                <div className="text-center">
                  <MapPin className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">טבס 3, הוד השרון</p>
                  <a
                    href="https://maps.google.com/?q=טבס+3+הוד+השרון"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline mt-2 inline-block"
                  >
                    פתח במפות Google
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
