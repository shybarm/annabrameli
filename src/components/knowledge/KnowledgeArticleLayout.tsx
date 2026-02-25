import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { AuthorBadge } from "@/components/blog/AuthorBadge";
import { ArticleCTA } from "@/components/blog/ArticleCTA";
import { buildMedicalPageSchema, buildBreadcrumbSchema } from "@/utils/medicalSchema";

export interface KnowledgeArticleProps {
  slug: string;
  title: string;
  metaDescription: string;
  children: React.ReactNode;
  relatedArticles?: { to: string; label: string }[];
}

export const KnowledgeArticleLayout = ({
  slug,
  title,
  metaDescription,
  children,
  relatedArticles = [],
}: KnowledgeArticleProps) => {
  const canonicalUrl = `https://ihaveallergy.com/knowledge/${slug}`;
  const articleSchema = buildMedicalPageSchema({
    headline: title,
    description: metaDescription,
    datePublished: "2026-02-08",
    dateModified: "2026-02-08",
    canonicalUrl,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "ראשי", item: "https://ihaveallergy.com/" },
    { name: "מדריכים", item: "https://ihaveallergy.com/guides/טעימות-ראשונות-אלרגנים" },
    { name: title },
  ]);

  return (
    <>
      <Helmet>
        <title>{title} | ד״ר אנה ברמלי</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://ihaveallergy.com/knowledge/${slug}`} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="gradient-hero py-12 md:py-16">
        <div className="container-medical max-w-3xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">ראשי</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <Link to="/guides/טעימות-ראשונות-אלרגנים" className="hover:text-foreground transition-colors">מדריך טעימות ראשונות</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-foreground truncate">{title}</span>
          </nav>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full mb-4">
              הרחבה למדריך
            </span>
            <h1 className="font-bold text-foreground mb-6 text-balance">{title}</h1>
            <AuthorBadge compact />
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <div className="container-medical max-w-3xl py-12 md:py-16 space-y-10">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          {children}
        </motion.div>

        {/* CTA */}
        <ArticleCTA variant="section" />

        {/* Related satellite articles */}
        {relatedArticles.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">קריאה נוספת</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {relatedArticles.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 bg-card rounded-xl p-4 border border-border/60 card-hover group text-sm"
                >
                  <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-foreground group-hover:text-primary transition-colors font-medium">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Author + disclaimer */}
        <div className="space-y-6">
          <AuthorBadge />
          <div className="bg-surface rounded-2xl p-5 border border-border/40 text-xs text-muted-foreground leading-relaxed">
            <p className="mb-2">
              <strong className="text-foreground">הבהרה רפואית:</strong> המידע בעמוד זה נועד לצרכי הסברה בלבד ואינו מהווה תחליף לייעוץ רפואי מקצועי.
            </p>
            <p>
              תוכן זה נכתב ונסקר רפואית על ידי ד״ר אנה ברמלי, מומחית לאלרגיה ואימונולוגיה. עודכן: פברואר 2026.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
