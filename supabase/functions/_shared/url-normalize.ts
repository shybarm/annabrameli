/**
 * Canonical URL normalization, shared by gsc-sync and ga4-sync.
 *
 * One implementation, used by both, so a page has the same identity whichever
 * source reported it.
 *
 * Rules:
 *   - lowercase the HOST only, never the path
 *   - strip a leading "www."
 *   - percent-decode the path, per segment, never throwing on malformed input
 *   - Unicode NFC
 *   - drop the query string and fragment
 *   - strip the trailing slash except for root
 *
 * The path is deliberately NOT lowercased: Hebrew has no case, and lowercasing
 * would silently merge two ASCII routes that a case-sensitive host treats as
 * different pages.
 *
 * Host is returned separately and is never folded into the path. Two hosts that
 * share a path - ihaveallergy.com/faq and seo.ihaveallergy.com/faq - must stay
 * distinct records until a migration is explicitly decided, so callers store
 * host alongside path and key on both.
 */

export interface NormalizedUrl {
  /** Lowercased host with any leading "www." removed. Empty when the input carried no host. */
  host: string;
  /** Normalized path, always starting with "/". */
  path: string;
  /** The input, unchanged, for audit. */
  original: string;
}

/**
 * Percent-decode without ever throwing.
 *
 * decodeURIComponent rejects malformed sequences such as a bare "%" or "%zz".
 * Google occasionally returns those, and one bad row must not abort an entire
 * day of ingestion - so decoding falls back to the raw segment.
 *
 * Decoding is applied per path segment, so an encoded "%2F" inside a segment
 * cannot silently turn into a path separator and change the URL's shape.
 */
function safeDecodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Normalize a path that may arrive encoded, decoded, or partially either way.
 * Accepts a bare path ("/guides/x?y=1") as well as the path portion of a URL.
 */
export function normalizePath(rawPath: string): string {
  if (!rawPath) return "/";

  // Drop fragment first, then query - a fragment can legally contain "?".
  let path = rawPath.split("#")[0].split("?")[0];

  if (!path.startsWith("/")) path = `/${path}`;

  path = path
    .split("/")
    .map(safeDecodeSegment)
    .join("/")
    .normalize("NFC");

  // Collapse any accidental double slashes introduced by the source.
  path = path.replace(/\/{2,}/g, "/");

  // Trailing slash carries no meaning here, except at root.
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  return path || "/";
}

/** Lowercase, strip "www.", and drop any port. */
export function normalizeHost(rawHost: string): string {
  return rawHost.toLowerCase().replace(/^www\./, "").split(":")[0];
}

/**
 * Normalize a full URL or a bare path.
 *
 * Search Console returns absolute URLs; GA4 returns paths with query strings.
 * Both go through here so the resulting page_path values are directly
 * comparable between the two sources.
 */
export function normalizeUrl(raw: string, fallbackHost = ""): NormalizedUrl {
  const original = raw ?? "";

  if (!original || original === "(not set)") {
    return { host: normalizeHost(fallbackHost), path: "/", original };
  }

  // Absolute URL: parse it so the host never leaks into the path.
  if (/^https?:\/\//i.test(original)) {
    try {
      const url = new URL(original);
      return {
        host: normalizeHost(url.hostname),
        path: normalizePath(url.pathname),
        original,
      };
    } catch {
      // Unparseable absolute URL - fall through to path handling rather than
      // dropping the row.
    }
  }

  return {
    host: normalizeHost(fallbackHost),
    path: normalizePath(original),
    original,
  };
}

/**
 * Best-effort host for a Search Console property identifier, used as the
 * fallback when a returned URL has no host of its own.
 *
 *   "sc-domain:ihaveallergy.com"   -> "ihaveallergy.com"
 *   "https://ihaveallergy.com/"    -> "ihaveallergy.com"
 */
export function hostFromProperty(property: string): string {
  if (property.startsWith("sc-domain:")) {
    return normalizeHost(property.slice("sc-domain:".length));
  }
  try {
    return normalizeHost(new URL(property).hostname);
  } catch {
    return normalizeHost(property);
  }
}
