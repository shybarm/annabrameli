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
    const url = new URL(path, window.location.origin);
    // Never send token-bearing or staff/patient routes as manual page views.
    if (url.origin !== window.location.origin ||
      /^\/(admin|auth|reset-password|intake|verify-booking|verify-email|magic|join|patient-invite|portal|\.lovable)(\/|$)/i.test(url.pathname)) return;
    // Initial config disables automatic views; route views must be explicit.
    // Acquisition is handled by the Google tag, not arbitrary stored URLs.
    window.gtag?.("event", "page_view", {
      send_to: GA_MEASUREMENT_ID,
      page_path: url.pathname,
      page_location: url.origin + url.pathname,
    });
  } catch {
    /* noop */
  }
}

/** Conversion: user clicked a "schedule appointment" CTA. */
/**
 * A visitor opening WhatsApp to contact the clinic.
 *
 * Deliberately NOT fired by the share-via-WhatsApp helper in
 * src/utils/shareHelper.ts: sharing an article is a different intent from
 * contacting the clinic, and counting the two together would inflate this
 * number with traffic that never reached the practice.
 */
export function trackWhatsAppClick(location: string, destinationUrl: string): void {
  trackEvent("whatsapp_click", {
    cta_location: location,
    destination_url: destinationUrl,
    page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
    event_category: "conversion",
  });
}

/**
 * A visitor tapping a phone number on the public site.
 *
 * Not fired from the admin area - staff dialling a patient is an internal
 * action, not a conversion, and it sits next to patient data.
 */
export function trackPhoneClick(location: string, phoneNumber: string): void {
  trackEvent("phone_click", {
    cta_location: location,
    destination_url: `tel:${phoneNumber}`,
    page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
    event_category: "conversion",
  });
}

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
