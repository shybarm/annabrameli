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
 * Uses static <Link> elements for full crawlability.
 */
export const RelatedMedicalArticles = ({
  currentSlug,
  category,
  overrideSlugs,
}: RelatedMedicalArticlesProps) => {
  let articles: BlogArticle[];

  if (overrideSlugs && overrideSlugs.length > 0) {
    articles = overrideSlugs
      .map((s) => blogArticles.find((a) => a.slug === s))
      .filter((a): a is BlogArticle => !!a && a.slug !== currentSlug)
      .slice(0, 3);
  } else {
    articles = blogArticles
      .filter((a) => a.category === category && a.slug !== currentSlug)
      .slice(0, 3);
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
