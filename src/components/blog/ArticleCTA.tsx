import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArticleCTAProps {
  variant?: "inline" | "section";
}

export const ArticleCTA = ({ variant = "inline" }: ArticleCTAProps) => {
  const whatsappUrl = "https://wa.me/972545808008?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A7%D7%91%D7%95%D7%A2%20%D7%99%D7%99%D7%A2%D7%95%D7%A5";

  if (variant === "section") {
    return (
      <div className="bg-accent/50 rounded-2xl p-8 text-center border border-border/40">
        <h3 className="text-xl font-bold text-foreground mb-3">רוצים סדר? דברו איתנו</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          ייעוץ אלרגולוג ילדים מותאם אישית, עם מענה מהיר ובדיקות מקיפות
        </p>
        <Button size="lg" asChild>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="w-5 h-5 ml-2" />
            לקביעת ייעוץ ראשוני
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-4 px-5 bg-surface-warm rounded-xl border border-border/40">
      <MessageCircle className="w-5 h-5 text-primary flex-shrink-0" />
      <p className="text-sm text-muted-foreground">
        רוצים סדר?{" "}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-medium hover:underline"
        >
          דברו איתנו בוואטסאפ
        </a>
      </p>
    </div>
  );
};
