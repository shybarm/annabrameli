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

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const;

type UtmKey = (typeof UTM_KEYS)[number];
export type UtmParams = Partial<Record<UtmKey | "referrer" | "landing_page", string>>;

const STORAGE_KEY = "ga_utm_attribution";

/**
 * Capture UTM params from the current URL on first landing of a session.
 * Persists in sessionStorage so subsequent events (clicks, form submits)
 * can attach the original acquisition source.
 */
export function captureUtmFromUrl(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const existing = readStoredUtm();
    const params = new URLSearchParams(window.location.search);
    const fresh: UtmParams = {};
    let hasNew = false;
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) {
        fresh[key] = value;
        hasNew = true;
      }
    }
    // Only overwrite stored attribution when this hit carries fresh UTM params,
    // so internal navigations don't wipe the original source.
    if (hasNew) {
      fresh.landing_page = window.location.pathname + window.location.search;
      fresh.referrer = document.referrer || undefined;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    if (existing) return existing;
    // First touch with no UTM: still store referrer + landing for context.
    const fallback: UtmParams = {
      landing_page: window.location.pathname + window.location.search,
      referrer: document.referrer || undefined,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  } catch {
    return {};
  }
}

function readStoredUtm(): UtmParams | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : null;
  } catch {
    return null;
  }
}

/** Returns the UTM attribution stored on first session landing. */
export function getStoredUtm(): UtmParams {
  return readStoredUtm() ?? {};
}

export function trackEvent(
  eventName: string,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  try {
    const payload = { ...getStoredUtm(), ...params };
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...payload });
    }
  } catch {
    // analytics must never break the UI
  }
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: path,
      ...getStoredUtm(),
    });
  } catch {
    /* noop */
  }
}

/** Conversion: user clicked a "schedule appointment" CTA. */
export function trackBookAppointmentClick(
  location: string,
  destinationUrl: string = "/book"
): void {
  trackEvent("book_appointment_click", {
    cta_location: location,
    destination_url: destinationUrl,
    link_url:
      typeof window !== "undefined"
        ? new URL(destinationUrl, window.location.origin).href
        : destinationUrl,
    page_path:
      typeof window !== "undefined" ? window.location.pathname : undefined,
    event_category: "conversion",
  });
}
