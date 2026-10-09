import { publicPath, sanitizeAttribution } from "./analytics";

// Exact Google Ads event snippet generated in account 664-227-1731 on 2026-10-09.
export const WEBSITE_CALL_TAG = "AW-18186381713/CyUZCMS40ZYdEJHT-N9D";
const ADS_TAG = "AW-18186381713";
const CLINIC_NUMBER = "052-5916393";
const isClinicNumber = (value: string) => /^(0525916393|972525916393)$/.test(value.replace(/\D/g, ""));

/** Actual Google forwarding-number calls after ads, not phone-click conversions.
 * Never configure on private routes. Restore links when a SPA route unmounts.
 */
export function startWebsiteCallTracking(): (() => void) | undefined {
  if (typeof window === "undefined" || !publicPath(window.location.pathname) || !window.gtag) return;
  let active = true;
  let forwarded: { display: string; dial: string } | undefined;
  const links = new Map<HTMLAnchorElement, string>();
  const texts = new Map<Text, string>();
  const replace = () => {
    if (!active || !forwarded || !publicPath(window.location.pathname)) return;
    document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]').forEach(link => {
      if (isClinicNumber(link.getAttribute("href") ?? "")) {
        links.set(link, link.getAttribute("href")!);
        link.setAttribute("href", `tel:${forwarded!.dial}`);
      }
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode as Text;
      if (text.parentElement?.closest("script,style,textarea,input,[contenteditable]")) continue;
      if (isClinicNumber(text.data.trim())) {
        texts.set(text, text.data);
        text.data = forwarded.display;
      }
    }
  };
  const observer = new MutationObserver(replace);
  observer.observe(document.body, { childList: true, subtree: true });
  const safeUrl = new URL(window.location.origin + window.location.pathname);
  // Preserve only Google ad attribution identifiers, never arbitrary queries/tokens.
  const query = new URLSearchParams(window.location.search);
  for (const key of ["gclid", "gbraid", "wbraid"]) {
    const value = query.get(key);
    if (value && /^[a-z0-9_-]{1,256}$/i.test(value)) safeUrl.searchParams.set(key, value);
  }
  const safeLocation = safeUrl.href;
  const privacy = {
    send_page_view: false,
    allow_ad_personalization_signals: false,
    page_location: safeLocation,
    page_referrer: sanitizeAttribution({ referrer: document.referrer }).referrer ?? "",
  };
  window.gtag("config", ADS_TAG, privacy);
  window.gtag("config", WEBSITE_CALL_TAG, {
    ...privacy,
    phone_conversion_number: CLINIC_NUMBER,
    phone_conversion_callback: (display: string, dial: string) => {
      if (!active || !/^\+?[0-9 ()-]+$/.test(dial) || !display || isClinicNumber(dial)) return;
      forwarded = { display, dial };
      replace();
    },
  });
  return () => {
    active = false;
    observer.disconnect();
    for (const [link, original] of links) {
      if (link.getAttribute("href") === `tel:${forwarded?.dial}`) link.setAttribute("href", original);
    }
    for (const [text, original] of texts) {
      if (text.data === forwarded?.display) text.data = original;
    }
  };
}
