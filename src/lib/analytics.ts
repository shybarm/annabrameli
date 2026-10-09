import { PUBLIC_ROUTES } from "@/data/public-routes";
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
  "utm_content",
] as const;

type UtmKey = (typeof UTM_KEYS)[number];
export type UtmParams = Partial<Record<UtmKey | "referrer" | "landing_page", string>>;

const STORAGE_KEY = "ga_utm_attribution";
const publicPaths = new Set([...PUBLIC_ROUTES, "/contact/success", "/book/success"]);

export function publicPath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value, window.location.origin);
    const path = decodeURI(url.pathname).replace(/\/$/, "") || "/";
    return url.origin === window.location.origin && publicPaths.has(path) ? path : undefined;
  } catch { return undefined; }
}

/** Only campaign labels, public paths and referrer origins; no arbitrary queries or form data. */
export function sanitizeAttribution(value: unknown): UtmParams {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  const safe: UtmParams = {};
  for (const key of UTM_KEYS) {
    const label = raw[key];
    if (typeof label === "string" && /^[a-z0-9_.-]{1,100}$/i.test(label) && !/\d{7,}/.test(label)) safe[key] = label;
  }
  const landing = publicPath(raw.landing_page);
  if (landing) safe.landing_page = landing;
  if (typeof raw.referrer === "string") {
    try {
      const url = new URL(raw.referrer);
      if (/^https?:$/.test(url.protocol)) safe.referrer = url.origin;
    } catch { /* Invalid referrers are discarded. */ }
  }
  return safe;
}


/**
 * Capture UTM params from the current URL on first landing of a session.
 * Persists in sessionStorage so subsequent events (clicks, form submits)
 * can attach the original acquisition source.
 */
export function captureUtmFromUrl(): UtmParams {
  if (typeof window === "undefined" || !publicPath(window.location.pathname)) return {};
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
      fresh.landing_page = window.location.pathname;
      fresh.referrer = document.referrer || undefined;
      const safe = sanitizeAttribution(fresh);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
      return safe;
    }
    if (existing) return existing;
    // First touch with no UTM: still store referrer + landing for context.
    const fallback: UtmParams = {
      landing_page: window.location.pathname,
      referrer: document.referrer || undefined,
    };
    const safe = sanitizeAttribution(fallback);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return safe;
  } catch {
    return {};
  }
}

function readStoredUtm(): UtmParams | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeAttribution(JSON.parse(raw)) : null;
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
  if (typeof window === "undefined" || !publicPath(window.location.pathname)) return;
  try {
    const payload = {
      ...getStoredUtm(), ...params,
      page_location: window.location.origin + window.location.pathname,
      page_referrer: sanitizeAttribution({ referrer: document.referrer }).referrer ?? "",
    };
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
    if (!publicPath(url.href) || url.origin !== window.location.origin ||
      /^\/(admin|auth|reset-password|intake|verify-booking|verify-email|magic|join|patient-invite|portal|\.lovable)(\/|$)/i.test(url.pathname)) return;
    // Initial config disables automatic views; route views must be explicit.
    // Acquisition is handled by the Google tag, not arbitrary stored URLs.
    window.gtag?.("event", "page_view", {
      send_to: GA_MEASUREMENT_ID,
      page_path: url.pathname,
      page_location: url.origin + url.pathname,
      page_referrer: sanitizeAttribution({ referrer: document.referrer }).referrer ?? "",
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
