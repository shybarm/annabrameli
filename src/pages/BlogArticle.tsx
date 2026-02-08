import { useParams, Navigate } from "react-router-dom";
import { getArticleBySlug } from "@/data/blog-articles";
import { ArticleTemplate } from "@/components/blog/ArticleTemplate";

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(decodeURIComponent(slug)) : undefined;

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  return <ArticleTemplate article={article} />;
};

export default BlogArticle;
