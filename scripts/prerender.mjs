/**
 * Build-time prerender (SSG) for static-content public routes.
 *
 * Runs as `postbuild` after `vite build`. Pipeline:
 *   1) Install minimal Node globals so module-level browser API access
 *      (localStorage in supabase client, etc.) does not crash on import.
 *   2) Run a Vite SSR build of `src/entry-server.tsx` into `dist-ssr/`.
 *   3) Import the SSR bundle and, for each route in PRERENDER_ROUTES,
 *      call render(url) and inject the result into a copy of the
 *      client `dist/index.html` written to `dist/<route>/index.html`.
 *   4) Routes that throw during SSR are SKIPPED, not fatal.
 *
 * No Puppeteer. No Chromium. Pure Node.
 */

import { build } from "vite";
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

// --- 1. Minimal browser-global shims --------------------------------------
// renderToString never touches the DOM, but some modules read globals at
// import time (e.g. supabase client reads `localStorage`). Stub the minimum.
const memStore = () => {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
};

if (typeof globalThis.window === "undefined") {
  globalThis.localStorage = memStore();
  globalThis.sessionStorage = memStore();
  globalThis.window = /** @type {any} */ ({
    location: { href: "https://ihaveallergy.com/", pathname: "/", search: "", origin: "https://ihaveallergy.com" },
    navigator: { userAgent: "node-ssg" },
    localStorage: globalThis.localStorage,
    sessionStorage: globalThis.sessionStorage,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
    addEventListener() {},
    removeEventListener() {},
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
    scrollTo() {},
    history: { pushState() {}, replaceState() {} },
    dataLayer: [],
  });
  globalThis.document = /** @type {any} */ ({
    head: { querySelectorAll: () => [], appendChild() {} },
    body: { classList: { add() {}, remove() {} } },
    documentElement: { classList: { add() {}, remove() {} }, style: {}, lang: "he", dir: "rtl" },
    createElement: () => ({ setAttribute() {}, appendChild() {}, style: {} }),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener() {},
    removeEventListener() {},
  });
  try { Object.defineProperty(globalThis, "navigator", { value: globalThis.window.navigator, configurable: true }); } catch {}
  try { Object.defineProperty(globalThis, "matchMedia", { value: globalThis.window.matchMedia, configurable: true }); } catch {}
  globalThis.HTMLElement = class {};
  globalThis.Element = class {};
  globalThis.Node = class {};
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  globalThis.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };
}

// --- 2. Routes to prerender (Wave 1: static-content public pages) ---------
const PRERENDER_ROUTES = [
  "/",
  "/about",
  "/services",
  "/contact",
  "/faq",
  "/dr-anna-brameli",
  "/whois",
  "/book",
  "/privacy",
  "/accessibility",
  "/security",
  "/guides/טעימות-ראשונות-אלרגנים",
  "/guides/זכויות-ילד-אלרגי-ישראל",
  "/guides/בדיקות-אלרגיה-ילדים-ישראל",
  "/guides/אלרגיה-מדריך-מקיף",
  "/אלרגיה-בילדים-מדריך-מלא",
];

const PROJECT_ROOT = resolve(process.cwd());
const DIST_DIR = resolve(PROJECT_ROOT, "dist");
const SSR_DIR = resolve(PROJECT_ROOT, "dist-ssr");

async function main() {
  if (!existsSync(DIST_DIR) || !existsSync(join(DIST_DIR, "index.html"))) {
    console.error("[prerender] dist/index.html not found - skipping SSG.");
    process.exit(0); // do not fail the build
  }

  console.log("[prerender] Building SSR bundle...");
  if (existsSync(SSR_DIR)) rmSync(SSR_DIR, { recursive: true, force: true });

  try {
    await build({
      logLevel: "warn",
      build: {
        ssr: resolve(PROJECT_ROOT, "src/entry-server.tsx"),
        outDir: SSR_DIR,
        emptyOutDir: true,
        rollupOptions: {
          output: { format: "esm", entryFileNames: "entry-server.mjs" },
        },
      },
      ssr: {
        // Force these into the bundle so they get the SSR-safe globals shim
        noExternal: ["react-helmet-async", "react-router-dom"],
      },
    });
  } catch (err) {
    console.error("[prerender] SSR build failed - skipping SSG, client bundle still ships.");
    console.error(err);
    process.exit(0);
  }

  const entryUrl = pathToFileURL(join(SSR_DIR, "entry-server.mjs")).href;
  let render;
  try {
    ({ render } = await import(entryUrl));
  } catch (err) {
    console.error("[prerender] Failed to import SSR bundle - skipping.");
    console.error(err);
    process.exit(0);
  }

  const template = readFileSync(join(DIST_DIR, "index.html"), "utf8");

  const succeeded = [];
  const failed = [];

  for (const route of PRERENDER_ROUTES) {
    try {
      const { html, head } = render(route);
      const out = injectIntoTemplate(template, route, html, head);
      writeRouteFile(route, out);
      succeeded.push(route);
      console.log(`[prerender] ✓ ${route}`);
    } catch (err) {
      failed.push({ route, error: err?.message || String(err) });
      console.warn(`[prerender] ✗ ${route} - ${err?.message || err}`);
    }
  }

  // Cleanup SSR build artifacts
  rmSync(SSR_DIR, { recursive: true, force: true });

  console.log(`\n[prerender] Done. ${succeeded.length} succeeded, ${failed.length} failed.`);
  if (failed.length) {
    console.log("[prerender] Failed routes (will fall back to CSR):");
    for (const f of failed) console.log(`  - ${f.route}: ${f.error}`);
  }
}

function injectIntoTemplate(template, route, appHtml, head) {
  let out = template;

  // 1) Inject Helmet head BEFORE </head>. Helmet's stringified output already
  // includes <title>, <meta>, <link>, <script type="application/ld+json"> tags
  // with data-rh attributes so the client-side Helmet recognises and replaces them.
  const headFragment = [head.title, head.meta, head.link, head.script]
    .filter(Boolean)
    .join("\n    ");
  if (headFragment) {
    out = out.replace("</head>", `    ${headFragment}\n  </head>`);
  }

  // 2) Inject rendered React app into #root and mark as SSR so main.tsx hydrates.
  out = out.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root" data-ssr="true">${appHtml}</div>`
  );

  return out;
}

function writeRouteFile(route, html) {
  // "/" -> dist/index.html (overwrites the empty template with hydrated version)
  // "/services" -> dist/services/index.html
  const relativePath = route === "/" ? "index.html" : `${route.replace(/^\//, "")}/index.html`;
  const fullPath = join(DIST_DIR, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, html, "utf8");
}

main().catch((err) => {
  console.error("[prerender] Fatal error:", err);
  // Do not fail the build - CSR still works.
  process.exit(0);
});
