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
  { href: "/guides/טעימות-ראשונות-אלרגנים", label: "מדריכים", matchPrefix: "/guides" },
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
          ? "bg-background/90 backdrop-blur-xl shadow-md border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <nav className="container-medical">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-teal flex items-center justify-center shadow-teal transition-transform duration-200 group-hover:scale-105">
              <span className="text-primary-foreground font-bold text-lg">א</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">ד״ר אנה ברמלי</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">אלרגיה ואימונולוגיה</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.href || (link.matchPrefix && location.pathname.startsWith(link.matchPrefix))
                    ? "text-primary bg-accent"
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
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin">
                  <Settings className="w-4 h-4 ml-1.5" />
                  ניהול
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">
                  <Settings className="w-4 h-4 ml-1.5" />
                  כניסת צוות
                </Link>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link to="/book">
                <Phone className="w-4 h-4 ml-1.5" />
                קביעת תור
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2.5 rounded-xl hover:bg-muted transition-colors"
            aria-label="תפריט"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
              <div className="py-4 border-t border-border/50 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      location.pathname === link.href || (link.matchPrefix && location.pathname.startsWith(link.matchPrefix))
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 px-4 space-y-3">
                  {user && isStaff ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/admin">
                        <Settings className="w-4 h-4 ml-1.5" />
                        ניהול
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/auth">
                        <Settings className="w-4 h-4 ml-1.5" />
                        כניסת צוות
                      </Link>
                    </Button>
                  )}
                  <Button className="w-full" asChild>
                    <Link to="/book">
                      <Phone className="w-4 h-4 ml-1.5" />
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
