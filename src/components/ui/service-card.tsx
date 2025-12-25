import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  delay?: number;
}

export const ServiceCard = ({ icon: Icon, title, description, href, delay = 0 }: ServiceCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Link
        to={href}
        className="group block h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-medical transition-all duration-300"
      >
        <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {description}
        </p>
        <div className="flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <span>קרא עוד</span>
          <ArrowLeft className="w-4 h-4" />
        </div>
      </Link>
    </motion.div>
  );
};
