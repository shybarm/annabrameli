import { Link } from "react-router-dom";
import drAnnaImage from "@/assets/dr-anna-brameli.jpeg";

interface AuthorBadgeProps {
  compact?: boolean;
}

export const AuthorBadge = ({ compact = false }: AuthorBadgeProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <img
          src={drAnnaImage}
          alt="ד״ר אנה ברמלי"
          className="w-8 h-8 rounded-full object-cover"
          width={32}
          height={32}
          loading="lazy"
        />
        <span>נכתב ונסקר רפואית על ידי{" "}
          <Link to="/dr-anna-brameli" className="text-primary hover:underline font-medium">
            ד״ר אנה ברמלי
          </Link>
        </span>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-6 flex items-center gap-5">
      <img
        src={drAnnaImage}
        alt="ד״ר אנה ברמלי"
        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
        width={64}
        height={64}
        loading="lazy"
      />
      <div>
        <p className="text-sm text-muted-foreground mb-1">נכתב ונסקר רפואית על ידי</p>
        <Link to="/dr-anna-brameli" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
          ד״ר אנה ברמלי
        </Link>
        <p className="text-sm text-muted-foreground mt-1">
          מומחית לאלרגיה ואימונולוגיה | רופאת ילדים
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Vanderbilt University Medical Center | מרכז שניידר לרפואת ילדים
        </p>
      </div>
    </div>
  );
};
