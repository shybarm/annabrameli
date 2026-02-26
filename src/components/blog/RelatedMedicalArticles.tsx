import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { blogArticles, type BlogArticle } from "@/data/blog-articles";

interface RelatedMedicalArticlesProps {
  currentSlug: string;
  category: BlogArticle["category"];
  /** Override automatic selection with specific slugs */
  overrideSlugs?: string[];
}

/**
 * Renders 3 related articles from the same category (excluding current).
 * Falls back to newest articles across all categories if insufficient same-category matches.
 * Uses static <Link> elements for full crawlability.
 * Ordering is deterministic: same-category newest first, then fallback newest first.
 */
export const RelatedMedicalArticles = ({
  currentSlug,
  category,
  overrideSlugs,
}: RelatedMedicalArticlesProps) => {
  let articles: BlogArticle[];

  if (overrideSlugs && overrideSlugs.length > 0) {
    // Deduplicate and exclude current page
    const seen = new Set<string>();
    articles = overrideSlugs
      .filter((s) => {
        if (s === currentSlug || seen.has(s)) return false;
        seen.add(s);
        return true;
      })
      .map((s) => blogArticles.find((a) => a.slug === s))
      .filter((a): a is BlogArticle => !!a)
      .slice(0, 3);
  } else {
    // Same category, newest first (deterministic by publishedAt desc, then slug asc)
    articles = blogArticles
      .filter((a) => a.category === category && a.slug !== currentSlug)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug))
      .slice(0, 3);
  }

  // Fallback: fill from newest articles across all categories if < 3
  if (articles.length < 3) {
    const usedSlugs = new Set([currentSlug, ...articles.map((a) => a.slug)]);
    const fallback = blogArticles
      .filter((a) => !usedSlugs.has(a.slug))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug))
      .slice(0, 3 - articles.length);
    articles = [...articles, ...fallback];
  }

  if (articles.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-foreground mb-4">מאמרים נוספים בנושא</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            to={`/blog/${article.slug}`}
            className="flex items-start gap-2 bg-card rounded-xl p-4 border border-border/60 card-hover group text-sm"
          >
            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-foreground group-hover:text-primary transition-colors font-medium leading-snug">
              {article.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
