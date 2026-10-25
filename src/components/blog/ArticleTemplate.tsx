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
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";

/**
 * Parses plain-text content and converts inline links like
 * "link text (/some/path)" into clickable <Link> elements.
 */
function renderContentWithLinks(content: string): React.ReactNode[] {
  // Support both explicit Markdown labels and legacy "label (/path)" content.
  // Keep destinations restricted to known local route families.
  const route = String.raw`\/(?:blog|guides|knowledge|about|services|contact|faq|dr-anna-brameli|אלרגיה-בילדים-מדריך-מלא)[^\s)]*`;
  const linkRegex = new RegExp(String.raw`\[([^\]\n]+)\]\((${route})\)|([^\n(\[]+?)\s*\((${route})\)`, "g");
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const linkText = (match[1] ?? match[3]).trim();
    const linkPath = match[2] ?? match[4];
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
  const articleSchema = article.editorial ? {
    "@context": "https://schema.org", "@type": "WebPage",
    "@id": canonicalUrl, url: canonicalUrl, name: article.title,
    description: article.metaDescription, inLanguage: "he-IL",
    datePublished: article.publishedAt, dateModified: article.updatedAt,
    publisher: { "@type": "Organization", name: "ihaveallergy.com", "@id": "https://ihaveallergy.com/#organization" },
    citation: article.sources?.map(source => source.url),
  } : buildMedicalPageSchema({
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
        <meta property="og:image" content="https://ihaveallergy.com/og-logo.png?v=6" />
        <meta property="article:published_time" content={article.publishedAt} />
        <meta property="article:modified_time" content={article.updatedAt} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.metaTitle} />
        <meta name="twitter:description" content={article.metaDescription} />
        <meta name="twitter:image" content="https://ihaveallergy.com/og-logo.png?v=6" />
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

            {article.editorial ? <p className="text-sm text-muted-foreground">מידע מערכתי המבוסס על המקורות המפורטים במאמר. אינו חוות דעת אישית של ד״ר אנה ברמלי ואינו מוצג כסקירה רפואית שלה.</p> : <AuthorBadge compact />}
            <div className="mt-6"><MedicalDisclaimer /></div>
          </motion.div>
        </div>
      </article>

      {/* Article body */}
      <div className="container-medical max-w-3xl py-12 md:py-16 space-y-10">
        {article.sections.length >= 4 && (
          <nav aria-label="ניווט בפרקי המאמר" className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="text-lg font-bold mb-3">מה תרצו לקרוא?</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {article.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="block rounded-md px-2 py-2 text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {article.rulesOfThumb && <section className="bg-accent rounded-2xl p-6" aria-labelledby="rules-title">
          <h2 id="rules-title" className="text-xl font-bold mb-3">כללי אצבע לזכירה</h2>
          <ul className="list-disc ps-6 space-y-2">{article.rulesOfThumb.map(rule => <li key={rule}>{rule}</li>)}</ul>
          <p className="text-sm mt-4">כללי האצבע מסכמים את המידע; הם אינם קובעים זכאות ואינם הוראות טיפול.</p>
        </section>}
        {article.sections.map((section, index) => (
          <motion.section
            key={section.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            id={section.id}
            className="scroll-mt-28"
          >
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">{section.title}</h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line prose-content">
              {renderContentWithLinks(section.content)}
            </div>

            {section.sourceIds && <p className="text-sm mt-3">מקורות: {section.sourceIds.map(id => {
              const source = article.sources?.find(item => item.id === id);
              return source ? <a key={id} href={source.url} className="text-primary underline ms-2">{source.title}</a> : null;
            })}</p>}

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

        {article.sources && <section id="sources" className="border-t border-border pt-6">
          <h2 className="text-xl font-bold mb-4">מקורות ועדכניות</h2>
          <ul className="space-y-3">{article.sources.map(source => <li key={source.id}>
            <a href={source.url} className="text-primary underline">{source.title}</a>
            {source.note && <p className="text-sm text-muted-foreground">{source.note}</p>}
          </li>)}</ul>
          {article.sourcesCheckedAt && <p className="text-sm mt-4">בדיקת מקורות: {formatHebrewDate(article.sourcesCheckedAt)}. נהלים ומסמכים עשויים להשתנות; יש לברר את ההנחיות התקפות למקרה ולמסגרת.</p>}
        </section>}

        {/* Same-category related articles component */}
        <RelatedMedicalArticles currentSlug={article.slug} category={article.category} />

        {/* Bottom CTA */}
        <ArticleCTA variant="section" />

        {/* Author full badge */}
        {!article.editorial && <AuthorBadge />}

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
