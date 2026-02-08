import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Calendar, ChevronLeft, ArrowRight } from "lucide-react";
import { AuthorBadge } from "./AuthorBadge";
import { ArticleCTA } from "./ArticleCTA";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import type { BlogArticle } from "@/data/blog-articles";
import { blogArticles, blogCategories } from "@/data/blog-articles";

interface ArticleTemplateProps {
  article: BlogArticle;
}

function formatHebrewDate(dateStr: string): string {
  const months = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
  const d = new Date(dateStr);
  return `${d.getDate()} ב${months[d.getMonth()]} ${d.getFullYear()}`;
}

export const ArticleTemplate = ({ article }: ArticleTemplateProps) => {
  const relatedArticles = blogArticles.filter((a) => article.relatedSlugs.includes(a.slug));
  const category = blogCategories[article.category];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Physician",
      name: "ד״ר אנה ברמלי",
      url: "https://ihaveallergy.com/about",
    },
    publisher: {
      "@type": "Organization",
      name: "ihaveallergy.com",
    },
    specialty: "Allergy and Immunology",
    audience: { "@type": "MedicalAudience", audienceType: "Patient" },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ראשי", item: "https://ihaveallergy.com/" },
      { "@type": "ListItem", position: 2, name: "בלוג", item: "https://ihaveallergy.com/blog" },
      { "@type": "ListItem", position: 3, name: category.label, item: `https://ihaveallergy.com/blog?category=${article.category}` },
      { "@type": "ListItem", position: 4, name: article.title },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{article.metaTitle}</title>
        <meta name="description" content={article.metaDescription} />
        <link rel="canonical" href={`https://ihaveallergy.com/blog/${article.slug}`} />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <article className="gradient-hero py-12 md:py-16">
        <div className="container-medical max-w-3xl">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">ראשי</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <Link to="/blog" className="hover:text-foreground transition-colors">בלוג</Link>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-foreground">{category.label}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full mb-4">
              {article.categoryLabel}
            </span>

            <h1 className="font-bold text-foreground mb-6 text-balance">{article.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatHebrewDate(article.updatedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {article.readingTime} דקות קריאה
              </span>
            </div>

            <AuthorBadge compact />
          </motion.div>
        </div>
      </article>

      {/* Article body */}
      <div className="container-medical max-w-3xl py-12 md:py-16 space-y-10">
        {article.sections.map((section, index) => (
          <motion.section
            key={section.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            id={section.id}
          >
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">{section.title}</h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line prose-content">
              {section.content}
            </div>

            {/* CTA after "when-see-doctor" section */}
            {section.id === "when-see-doctor" && (
              <div className="mt-6">
                <ArticleCTA variant="inline" />
              </div>
            )}
          </motion.section>
        ))}

        {/* FAQ section */}
        {article.faqs.length > 0 && (
          <section className="pt-4">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">שאלות נפוצות</h2>
            <FAQAccordion items={article.faqs} />
          </section>
        )}

        {/* Bottom CTA */}
        <ArticleCTA variant="section" />

        {/* Author full badge */}
        <AuthorBadge />

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-5">מאמרים קשורים</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedArticles.map((related) => (
                <Link
                  key={related.slug}
                  to={`/blog/${related.slug}`}
                  className="bg-card rounded-2xl p-5 border border-border/60 card-hover group"
                >
                  <span className="text-xs text-primary font-medium">{related.categoryLabel}</span>
                  <h3 className="text-base font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">
                    {related.title}
                  </h3>
                  <span className="flex items-center gap-1 text-sm text-primary mt-3">
                    <ArrowRight className="w-3.5 h-3.5" />
                    קרא עוד
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
};
