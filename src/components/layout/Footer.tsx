import { Link } from "react-router-dom";
import { Mail, MapPin, Clock } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/60 border-t border-border">
      <div className="container-medical py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl gradient-teal flex items-center justify-center shadow-teal">
                <span className="text-primary-foreground font-bold text-lg">א</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">ד״ר אנה ברמלי</h3>
                <p className="text-xs text-muted-foreground">אלרגיה ואימונולוגיה</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              מומחית לאלרגיה ואימונולוגיה עם ניסיון רב באבחון וטיפול באלרגיות בילדים ומבוגרים.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-5 uppercase tracking-wider">ניווט מהיר</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/about", label: "אודות" },
                { href: "/dr-anna-brameli", label: "ד״ר אנה ברמלי – פרופיל מקצועי" },
                { href: "/services", label: "שירותים" },
                { href: "/guides/טעימות-ראשונות-אלרגנים", label: "מדריך טעימות ראשונות" },
                { href: "/guides/בדיקות-אלרגיה-ילדים-ישראל", label: "מדריך בדיקות אלרגיה" },
                { href: "/guides/זכויות-ילד-אלרגי-ישראל", label: "זכויות ילד אלרגי" },
                { href: "/faq", label: "שאלות ותשובות" },
                { href: "/contact", label: "יצירת קשר" },
                { href: "/book", label: "קביעת תור" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-5 uppercase tracking-wider">פרטי התקשרות</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">דוא״ל</p>
                  <a href="mailto:info@drbrameli.co.il" className="text-sm text-foreground hover:text-primary transition-colors">
                    info@drbrameli.co.il
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">כתובת</p>
                  <p className="text-sm text-foreground">הוד השרון</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-5 uppercase tracking-wider">שעות פעילות</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-foreground">ראשון - חמישי</p>
                  <p className="text-xs text-muted-foreground">08:00 - 19:00</p>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-foreground">שישי</p>
                  <p className="text-xs text-muted-foreground">08:00 - 13:00</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Areas Served */}
        <div className="mt-10 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto">
            מרפאת האלרגיה של ד״ר אנה ברמלי ממוקמת בהוד השרון ומספקת שירות לתושבי כפר סבא, רעננה, פתח תקווה, הרצליה ואזור השרון.
          </p>
        </div>

        {/* Legal Links */}
        <div className="mt-10 pt-8 border-t border-border">
          <div className="flex flex-wrap justify-center gap-6 mb-5">
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              מדיניות פרטיות
            </Link>
            <Link
              to="/accessibility"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              הצהרת נגישות
            </Link>
            <Link
              to="/security"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              אבטחת מידע
            </Link>
            <Link
              to="/blog"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              מאמרים ומשאבים
            </Link>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-muted-foreground">
              © {currentYear} ד״ר אנה ברמלי. כל הזכויות שמורות.
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              המידע באתר זה אינו מהווה תחליף לייעוץ רפואי מקצועי.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
