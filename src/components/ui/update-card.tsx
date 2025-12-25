import { Calendar, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface UpdateCardProps {
  title: string;
  date: string;
  source: string;
  summary: string;
  link?: string;
  delay?: number;
}

export const UpdateCard = ({ title, date, source, summary, link, delay = 0 }: UpdateCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group bg-card rounded-2xl border border-border p-6 hover:shadow-medical hover:border-primary/20 transition-all duration-300"
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{date}</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
        <span>{source}</span>
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
        {summary}
      </p>
      
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
        >
          <span>קרא את המאמר המלא</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </motion.article>
  );
};
