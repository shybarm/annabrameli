import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const FAQItem = ({ question, answer, isOpen = false, onToggle }: FAQItemProps) => {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-5 flex items-center justify-between text-right group"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors pr-0 pl-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-muted-foreground text-sm leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface FAQAccordionProps {
  items: { question: string; answer: string }[];
  title?: string;
}

export const FAQAccordion = ({ items, title }: FAQAccordionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
      {title && (
        <h3 className="text-xl font-bold text-foreground mb-6">{title}</h3>
      )}
      <div>
        {items.map((item, index) => (
          <FAQItem
            key={index}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
};
