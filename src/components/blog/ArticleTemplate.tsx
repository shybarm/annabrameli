import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Calendar, ChevronLeft, ArrowRight } from "lucide-react";
import { AuthorBadge } from "./AuthorBadge";
import { ArticleCTA } from "./ArticleCTA";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import { RelatedMedicalArticles } from "@/components/blog/RelatedMedicalArticles";
import type { BlogArticle } from "@/data/blog-articles";
import { blogArticles, blogCategories } from "@/data/blog-articles";
import { buildMedicalPageSchema, buildBreadcrumbSchema, buildFaqSchema } from "@/utils/medicalSchema";
import React from "react";

/**
 * Parses plain-text content and converts inline links like
 * "link text (/some/path)" into clickable <Link> elements.
 */
function renderContentWithLinks(content: string): React.ReactNode[] {
  // Match patterns like "link text (/path)" or "link text (/path)."
  const linkRegex = /([^\n(]+?)\s*\((\/(blog|guides|knowledge|about|services|contact|faq)[^\s)]*)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const linkText = match[1].trim();
    const linkPath = match[2];
    parts.push(
      <Link key={match.index} to={linkPath} className="text-primary hover:underline font-medium">
        {linkText}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

interface ArticleTemplateProps {
  article: BlogArticle;
}

function formatHebrewDate(dateStr: string): string {
  const months = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
  const d = new Date(dateStr);
  return `${d.getDate()} ב${months[d.getMonth()]} ${d.getFullYear()}`;
}

export const ArticleTemplate = ({ article }: ArticleTemplateProps) => {
  // Find related articles; fall back to same-category articles if slugs don't match
  let relatedArticles = blogArticles.filter((a) => article.relatedSlugs.includes(a.slug));
  if (relatedArticles.length < 3) {
    const sameCat = blogArticles.filter(
      (a) => a.category === article.category && a.slug !== article.slug && !relatedArticles.some((r) => r.slug === a.slug)
    );
    relatedArticles = [...relatedArticles, ...sameCat].slice(0, 6);
  }
  const category = blogCategories[article.category];

  const canonicalUrl = `https://ihaveallergy.com/blog/${article.slug}`;
  const faqSchema = buildFaqSchema(article.faqs);
  const articleSchema = buildMedicalPageSchema({
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    canonicalUrl,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "ראשי", item: "https://ihaveallergy.com/" },
    { name: "בלוג", item: "https://ihaveallergy.com/blog" },
    { name: article.title, item: canonicalUrl },
  ]);

  return (
    <>
      <Helmet>
        <title>{article.metaTitle}</title>
        <meta name="description" content={article.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={article.metaTitle} />
        <meta property="og:description" content={article.metaDescription} />
        <meta property="og:image" content="https://ihaveallergy.com/og-logo.png" />
        <meta property="article:published_time" content={article.publishedAt} />
        <meta property="article:modified_time" content={article.updatedAt} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.metaTitle} />
        <meta name="twitter:description" content={article.metaDescription} />
        <meta name="twitter:image" content="https://ihaveallergy.com/og-logo.png" />
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
              {renderContentWithLinks(section.content)}
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

        {/* Same-category related articles component */}
        <RelatedMedicalArticles currentSlug={article.slug} category={article.category} />

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
