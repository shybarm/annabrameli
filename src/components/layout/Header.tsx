import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/", label: "ראשי" },
  { href: "/about", label: "אודות" },
  { href: "/services", label: "שירותים" },
  { href: "/updates", label: "עדכונים אחרונים" },
  { href: "/faq", label: "שאלות ותשובות" },
  { href: "/contact", label: "יצירת קשר" },
];

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, isStaff } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-card/95 backdrop-blur-md shadow-soft"
          : "bg-transparent"
      }`}
    >
      <nav className="container-medical">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center shadow-teal">
              <span className="text-primary-foreground font-bold text-lg">א</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">ד״ר אנה ברמלי</h1>
              <p className="text-xs text-muted-foreground">אלרגיה ואימונולוגיה</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {user && isStaff ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">
                  <Settings className="w-4 h-4 ml-2" />
                  ניהול
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">
                  <Settings className="w-4 h-4 ml-2" />
                  כניסת צוות
                </Link>
              </Button>
            )}
            <Button variant="default" size="sm" className="shadow-teal" asChild>
              <Link to="/book">
                <Phone className="w-4 h-4 ml-2" />
                קביעת תור
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="תפריט"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 border-t border-border space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      location.pathname === link.href
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 px-4 space-y-2">
                  {user && isStaff ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/admin">
                        <Settings className="w-4 h-4 ml-2" />
                        ניהול
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/auth">
                        <Settings className="w-4 h-4 ml-2" />
                        כניסת צוות
                      </Link>
                    </Button>
                  )}
                  <Button variant="default" className="w-full shadow-teal" asChild>
                    <Link to="/book">
                      <Phone className="w-4 h-4 ml-2" />
                      קביעת תור
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};
