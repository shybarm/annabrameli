import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>404 – הדף לא נמצא | IhaveAllergy</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-muted" dir="rtl">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
          <p className="mb-6 text-xl text-muted-foreground">הדף שחיפשת לא נמצא</p>
          <p className="mb-8 text-sm text-muted-foreground">
            הכתובת <code className="rounded bg-muted-foreground/10 px-2 py-1 text-xs">{location.pathname}</code> אינה קיימת באתר
          </p>
          <a href="/" className="inline-block rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            חזרה לדף הבית
          </a>
        </div>
      </div>
    </>
  );
};

export default NotFound;
