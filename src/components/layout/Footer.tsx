import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container-medical py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">א</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">ד״ר אנה ברמלי</h3>
                <p className="text-sm text-primary-foreground/70">אלרגיה ואימונולוגיה</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              מומחית לאלרגיה ואימונולוגיה עם ניסיון רב באבחון וטיפול באלרגיות בילדים ומבוגרים.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">ניווט מהיר</h4>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "אודות" },
                { href: "/services", label: "שירותים" },
                { href: "/faq", label: "שאלות ותשובות" },
                { href: "/contact", label: "יצירת קשר" },
                { href: "/book", label: "קביעת תור" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6">פרטי התקשרות</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-primary-foreground/70">טלפון</p>
                  <a href="tel:0545808008" className="text-sm hover:text-primary transition-colors">
                    054-580-8008
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-primary-foreground/70">דוא״ל</p>
                  <a href="mailto:info@drbrameli.co.il" className="text-sm hover:text-primary transition-colors">
                    info@drbrameli.co.il
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-primary-foreground/70">כתובת</p>
                  <p className="text-sm">טבס 3, הוד השרון</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-6">שעות פעילות</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm">ראשון - חמישי</p>
                  <p className="text-sm text-primary-foreground/70">08:00 - 19:00</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm">שישי</p>
                  <p className="text-sm text-primary-foreground/70">08:00 - 13:00</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            <Link
              to="/privacy"
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              מדיניות פרטיות
            </Link>
            <Link
              to="/accessibility"
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              הצהרת נגישות
            </Link>
            <Link
              to="/security"
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              אבטחת מידע
            </Link>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/60">
              © {currentYear} ד״ר אנה ברמלי. כל הזכויות שמורות.
            </p>
            <p className="text-xs text-primary-foreground/50">
              המידע באתר זה אינו מהווה תחליף לייעוץ רפואי מקצועי.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
