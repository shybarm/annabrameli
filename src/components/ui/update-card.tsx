import { Calendar, ExternalLink, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

interface UpdateCardProps {
  title: string;
  date: string;
  source: string;
  summary: string;
  link?: string;
  delay?: number;
}
const CopyLinkButton = ({ link }: { link: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("הקישור הועתק ללוח");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("לא ניתן להעתיק");
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
      title="העתק קישור"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

export const UpdateCard = ({ title, date, source, summary, link, delay = 0 }: UpdateCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group bg-card rounded-2xl border border-border/60 p-7 card-hover"
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{date}</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span className="text-xs">{source}</span>
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3">
        {summary}
      </p>
      
      {link && (
        <div className="flex items-center gap-3">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
          >
            <span>קרא את המאמר המלא</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <CopyLinkButton link={link} />
        </div>
      )}
    </motion.article>
  );
};
