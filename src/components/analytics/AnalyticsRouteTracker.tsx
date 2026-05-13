import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/**
 * Sends a GA4 page_view on every SPA route change.
 * Mount once inside <BrowserRouter>.
 */
export const AnalyticsRouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname + location.search;
    trackPageView(path);
  }, [location.pathname, location.search]);

  return null;
};
