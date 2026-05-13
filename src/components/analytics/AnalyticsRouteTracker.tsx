import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureUtmFromUrl, trackPageView } from "@/lib/analytics";

/**
 * Captures UTM attribution on first landing and sends a GA4 page_view
 * on every SPA route change. Mount once inside <BrowserRouter>.
 */
export const AnalyticsRouteTracker = () => {
  const location = useLocation();

  // Capture UTM params on initial mount (first session landing).
  useEffect(() => {
    captureUtmFromUrl();
  }, []);

  useEffect(() => {
    // Re-check on every navigation in case the user lands deep with UTM.
    captureUtmFromUrl();
    const path = location.pathname + location.search;
    trackPageView(path);
  }, [location.pathname, location.search]);

  return null;
};
