/**
 * Crawlability acceptance test.
 *
 * Reports, for each public route, exactly what a non-JavaScript crawler
 * (GPTBot / ClaudeBot / PerplexityBot / Bingbot) receives:
 *
 *   HTTP-equivalent status · HTML bytes · <title> · meta description ·
 *   canonical · robots · JSON-LD present · meaningful body text without JS
 *
 * Two modes:
 *   node scripts/verify-crawlability.mjs            # read ./dist from disk
 *   node scripts/verify-crawlability.mjs --url https://ihaveallergy.com
 *
 * Disk mode resolves a route the way a static host does: try
 * dist/<route>/index.html, then fall back to dist/index.html (SPA fallback).
 * A route that resolves to the fallback is reported as NOT prerendered.
 *
 * Never executes JavaScript. That is the entire point.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const DIST_DIR = resolve(process.cwd(), "dist");

const args = process.argv.slice(2);
const urlFlagIndex = args.indexOf("--url");
const BASE_URL = urlFlagIndex !== -1 ? args[urlFlagIndex + 1] : null;
const jsonOut = args.includes("--json");

// ── Extraction helpers ────────────────────────────────────────────────────

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

function extractMeta(html, attr, value) {
  const re = new RegExp(
    `<meta[^>]*${attr}=["']${value}["'][^>]*>`,
    "i",
  );
  const tag = html.match(re);
  if (!tag) return null;
  const content = tag[0].match(/content=["']([\s\S]*?)["']/i);
  return content ? content[1].trim() : null;
}

function extractCanonical(html) {
  const tag = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  if (!tag) return null;
  const href = tag[0].match(/href=["']([^"']+)["']/i);
  return href ? href[1] : null;
}

function hasJsonLd(html) {
  return /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html);
}

function jsonLdTypes(html) {
  const types = new Set();
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const found = m[1].match(/"@type"\s*:\s*"([^"]+)"/g) || [];
    for (const f of found) types.add(f.split('"')[3]);
  }
  return [...types];
}

/**
 * Visible text a crawler would extract: strip head, scripts, styles, and the
 * <noscript> fallback nav (which exists on every page and would otherwise make
 * an empty shell look like it has content).
 */
function visibleText(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;
  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return body;
}

// ── Route resolution ──────────────────────────────────────────────────────

function readFromDisk(route) {
  // Must mirror writeRouteFile in scripts/prerender.mjs: routes are written
  // under their percent-encoded name, because the production host matches the
  // raw undecoded request path against filenames.
  const encodedRoute = encodeURI(route);
  const rel =
    encodedRoute === "/" ? "index.html" : `${encodedRoute.replace(/^\//, "")}/index.html`;
  const full = join(DIST_DIR, rel);
  if (existsSync(full)) {
    return { html: readFileSync(full, "utf8"), status: 200, prerendered: true };
  }
  const fallback = join(DIST_DIR, "index.html");
  if (existsSync(fallback)) {
    return { html: readFileSync(fallback, "utf8"), status: 200, prerendered: false };
  }
  return { html: "", status: 404, prerendered: false };
}

async function readFromUrl(route) {
  const url = new URL(encodeURI(route), BASE_URL).href;
  const res = await fetch(url, {
    headers: {
      // Identify honestly. No cloaking, no pretending to be a search engine.
      "User-Agent": "ihaveallergy-crawlability-check/1.0 (+non-JS fetch)",
      Accept: "text/html",
    },
    redirect: "follow",
  });
  const html = await res.text();
  return { html, status: res.status, prerendered: null };
}

// ── Report ────────────────────────────────────────────────────────────────

async function inspect(route) {
  const { html, status, prerendered } =
    BASE_URL ? await readFromUrl(route) : readFromDisk(route);

  const text = visibleText(html);
  return {
    route,
    status,
    prerendered,
    bytes: Buffer.byteLength(html, "utf8"),
    title: extractTitle(html),
    description: extractMeta(html, "name", "description"),
    canonical: extractCanonical(html),
    robots: extractMeta(html, "name", "robots"),
    ogTitle: extractMeta(html, "property", "og:title"),
    twitterCard: extractMeta(html, "name", "twitter:card"),
    jsonLd: hasJsonLd(html),
    jsonLdTypes: jsonLdTypes(html),
    textChars: text.length,
    textSample: text.slice(0, 120),
  };
}

function truncate(s, n) {
  if (s === null || s === undefined) return "—";
  const str = String(s);
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
}

async function main() {
  let routes;
  const routeArgs = args.filter((a) => a.startsWith("/"));
  const manifestPath = join(DIST_DIR, "prerendered-routes.json");

  if (routeArgs.length) {
    routes = routeArgs;
  } else if (existsSync(manifestPath)) {
    // Written by scripts/prerender.mjs — the routes actually generated.
    routes = JSON.parse(readFileSync(manifestPath, "utf8")).routes;
  } else {
    routes = ["/", "/blog", "/faq", "/services", "/dr-anna-brameli"];
  }

  const results = [];
  for (const route of routes) results.push(await inspect(route));

  if (jsonOut) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log(
    BASE_URL
      ? `\nCrawlability report — ${BASE_URL} (no JavaScript executed)\n`
      : `\nCrawlability report — ./dist (no JavaScript executed)\n`,
  );

  for (const r of results) {
    const meaningful = r.textChars > 500;
    console.log(`── ${r.route}`);
    console.log(`   status        ${r.status}${r.prerendered === false ? "  (SPA fallback — NOT prerendered)" : ""}`);
    console.log(`   bytes         ${r.bytes.toLocaleString()}`);
    console.log(`   title         ${truncate(r.title, 78)}`);
    console.log(`   description   ${truncate(r.description, 78)}`);
    console.log(`   canonical     ${truncate(r.canonical, 78)}`);
    console.log(`   robots        ${truncate(r.robots, 78)}`);
    console.log(`   og:title      ${r.ogTitle ? "yes" : "no"}    twitter:card  ${r.twitterCard ? "yes" : "no"}`);
    console.log(`   JSON-LD       ${r.jsonLd ? `yes  [${r.jsonLdTypes.join(", ")}]` : "no"}`);
    console.log(`   body text     ${meaningful ? "YES" : "NO "}  (${r.textChars.toLocaleString()} chars)  ${truncate(r.textSample, 60)}`);
    console.log("");
  }

  const withText = results.filter((r) => r.textChars > 500).length;
  const uniqueTitles = new Set(results.map((r) => r.title)).size;
  console.log(
    `Summary: ${withText}/${results.length} routes deliver body text without JS · ` +
      `${uniqueTitles}/${results.length} unique titles\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
