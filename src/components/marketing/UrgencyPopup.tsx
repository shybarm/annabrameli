import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "urgency_popup_food_desensitization_last_shown";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DELAY_MS = 10_000;
const SCROLL_THRESHOLD = 0.4;

export const UrgencyPopup = ({ ctaHref = "/book" }: { ctaHref?: string }) => {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last && Date.now() - Number(last) < COOLDOWN_MS) return;
    } catch {
      // ignore
    }

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setOpen(true);
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        // ignore
      }
      cleanup();
    };

    const onScroll = () => {
      const h = document.documentElement;
      const scrolled =
        (h.scrollTop || document.body.scrollTop) /
        Math.max(1, h.scrollHeight - h.clientHeight);
      if (scrolled >= SCROLL_THRESHOLD) show();
    };

    const timer = window.setTimeout(show, DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });

    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
    return cleanup;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    if (!isMobile) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  if (!open) return null;

  const handlePrimary = () => {
    setOpen(false);
    navigate(ctaHref);
  };

  const title = isMobile ? "זמינות התורים מוגבלת" : "רגע לפני שממשיכים";
  const body = isMobile
    ? "עקב עומס בפניות לד״ר אנה ברמלי, ייתכן שלא יהיו תורים קרובים לייעוץ התאמה. השאירו פרטים ונבדוק עבורכם את האפשרות הקרובה ביותר."
    : "עקב עומס בפניות לד״ר אנה ברמלי, זמינות התורים לייעוץ בנושא אלרגיה למזון ודה-סנסיטיזציה עשויה להיות מוגבלת בתקופה הקרובה.\n\nאם אתם שוקלים ייעוץ התאמה, מומלץ להשאיר פרטים עכשיו כדי שנוכל לבדוק עבורכם את המועד הקרוב ביותר.";
  const primaryLabel = isMobile ? "בדיקת זמינות" : "בדיקת תור קרוב";
  const secondaryLabel = isMobile ? "לא עכשיו" : "אמשיך לקרוא";

  // Mobile: bottom sheet, no full overlay
  if (isMobile) {
    return (
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="urgency-title"
        className="fixed inset-x-0 bottom-0 z-[60] p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] animate-in slide-in-from-bottom duration-300"
      >
        <div className="relative bg-card border border-border/70 rounded-2xl shadow-xl p-5">
          <button
            onClick={() => setOpen(false)}
            aria-label="סגירה"
            className="absolute top-3 left-3 w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 mb-3 pe-8">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h2 id="urgency-title" className="text-lg font-bold text-foreground mt-1.5">
              {title}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 whitespace-pre-line">
            {body}
          </p>
          <div className="flex flex-col gap-2 mb-3">
            <Button onClick={handlePrimary} className="w-full rounded-full">
              {primaryLabel}
            </Button>
            <Button
              onClick={() => setOpen(false)}
              variant="ghost"
              className="w-full rounded-full"
            >
              {secondaryLabel}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            הפנייה אינה מחייבת קביעת תור. נחזור אליכם רק לצורך תיאום ובדיקת זמינות.
          </p>
        </div>
      </div>
    );
  }

  // Desktop: centered modal with soft overlay
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="urgency-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div className="relative bg-card border border-border/70 rounded-3xl shadow-2xl max-w-md w-full p-7 animate-in zoom-in-95 duration-200">
        <button
          onClick={() => setOpen(false)}
          aria-label="סגירה"
          className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-4">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <h2 id="urgency-title" className="text-2xl font-bold text-foreground mb-3">
          {title}
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line text-[15px]">
          {body}
        </p>
        <div className="flex flex-col gap-2.5 mb-4">
          <Button onClick={handlePrimary} size="lg" className="w-full rounded-full">
            {primaryLabel}
          </Button>
          <Button
            onClick={() => setOpen(false)}
            variant="ghost"
            size="lg"
            className="w-full rounded-full"
          >
            {secondaryLabel}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          הפנייה אינה מחייבת קביעת תור. נחזור אליכם רק לצורך תיאום ובדיקת זמינות.
        </p>
      </div>
    </div>
  );
};

export default UrgencyPopup;
