/**
 * Lightweight analytics helper for Google Tag (gtag.js / GA4).
 * The base script is loaded in index.html with measurement ID G-671NNHCM9J.
 *
 * Use trackEvent(...) to fire custom conversions. In GA4 you can mark
 * any of these events as a "Conversion" from the Admin UI.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = "G-671NNHCM9J";

export function trackEvent(
  eventName: string,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...params });
    }
  } catch {
    // analytics must never break the UI
  }
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("config", GA_MEASUREMENT_ID, { page_path: path });
  } catch {
    /* noop */
  }
}

/** Conversion: user clicked a "schedule appointment" CTA. */
export function trackBookAppointmentClick(location: string): void {
  trackEvent("book_appointment_click", {
    cta_location: location,
    event_category: "conversion",
  });
}
