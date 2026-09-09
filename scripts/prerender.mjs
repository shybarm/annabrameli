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

// --- 1. happy-dom global shim ---------------------------------------------
// Some third-party modules (sonner, framer-motion, radix-ui, supabase client)
// touch window/document/localStorage at import time. happy-dom gives us a
// real-enough DOM in Node without Puppeteer/Chromium.
if (typeof globalThis.window === "undefined") {
  const { Window } = await import("happy-dom");
  const win = new Window({ url: "https://ihaveallergy.com/" });
  const props = [
    "window", "document", "navigator", "location", "history",
    "localStorage", "sessionStorage", "HTMLElement", "Element", "Node",
    "Text", "Document", "DocumentFragment", "ShadowRoot", "Event",
    "CustomEvent", "MouseEvent", "KeyboardEvent", "MutationObserver",
    "IntersectionObserver", "ResizeObserver", "matchMedia",
    "requestAnimationFrame", "cancelAnimationFrame", "getComputedStyle",
    "DOMParser", "XMLSerializer", "NodeFilter", "CSS",
  ];
  for (const k of props) {
    if (win[k] !== undefined && globalThis[k] === undefined) {
      try {
        Object.defineProperty(globalThis, k, {
          value: win[k], configurable: true, writable: true,
        });
      } catch {}
    }
  }
  // Always expose window/document explicitly.
  globalThis.window = win;
  globalThis.document = win.document;
  globalThis.self = win;
}

// --- 2. Routes come from src/data/public-routes.ts -------------------------
// Read off the compiled SSR bundle below, so this script and the app can
// never disagree about which routes exist.

const PROJECT_ROOT = resolve(process.cwd());
const DIST_DIR = resolve(PROJECT_ROOT, "dist");
const SSR_DIR = resolve(PROJECT_ROOT, "dist-ssr");

async function main() {
  if (!existsSync(DIST_DIR) || !existsSync(join(DIST_DIR, "index.html"))) {
    console.error("[prerender] dist/index.html not found - refusing to ship without SSG.");
    process.exit(1);
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
    console.error("[prerender] SSR build failed - refusing to ship without SSG.");
    console.error(err);
    process.exit(1);
  }

  const entryUrl = pathToFileURL(join(SSR_DIR, "entry-server.mjs")).href;
  let render;
  let PRERENDER_ROUTES;
  let NOINDEX_ROUTES;
  let CRITICAL_ROUTES;
  let MIN_SUCCESSFUL_ROUTES;
  try {
    ({
      render,
      PUBLIC_ROUTES: PRERENDER_ROUTES,
      NOINDEX_ROUTES,
      CRITICAL_ROUTES,
      MIN_SUCCESSFUL_ROUTES,
    } = await import(entryUrl));
  } catch (err) {
    console.error("[prerender] Failed to import SSR bundle - refusing to ship without SSG.");
    console.error(err);
    process.exit(1);
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

  // --- Private surfaces: ship `noindex` in the initial HTML ----------------
  // These are not rendered with app content. They get the plain client shell
  // plus a robots directive, so a crawler that never runs JavaScript still
  // sees noindex. Access control remains Supabase auth + RLS; this only
  // controls indexing.
  for (const route of NOINDEX_ROUTES) {
    try {
      writeRouteFile(route, injectNoindex(template));
      console.log(`[prerender] ⊘ ${route} (noindex shell)`);
    } catch (err) {
      console.warn(`[prerender] ✗ noindex ${route} - ${err?.message || err}`);
    }
  }

  // Manifest for scripts/verify-crawlability.mjs and generate-sitemap.mjs.
  writeFileSync(
    join(DIST_DIR, "prerendered-routes.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), routes: succeeded }, null, 2),
    "utf8",
  );

  // Cleanup SSR build artifacts (keep when DEBUG_SSR=1)
  if (!process.env.DEBUG_SSR) rmSync(SSR_DIR, { recursive: true, force: true });

  // A single broken page falls back to CSR, which is where the whole site was
  // before, so it should not block a release. Two things should:
  //   • a systemic regression, caught by the count threshold
  //   • losing a route the site's identity depends on, caught by the critical list
  if (failed.length) {
    console.log("\n[prerender] Failed routes (will fall back to CSR):");
    for (const f of failed) console.log(`  - ${f.route}: ${f.error}`);
  }

  const succeededSet = new Set(succeeded);

  // A critical route missing from the route table is a configuration error,
  // not a render failure - surface it as its own reason to stop.
  const unknownCritical = CRITICAL_ROUTES.filter(
    (route) => !PRERENDER_ROUTES.includes(route),
  );
  const failedCritical = CRITICAL_ROUTES.filter(
    (route) => PRERENDER_ROUTES.includes(route) && !succeededSet.has(route),
  );

  const criticalPass = failedCritical.length === 0 && unknownCritical.length === 0;
  const thresholdPass = succeeded.length >= MIN_SUCCESSFUL_ROUTES;

  console.log(
    `\nPrerender:\n` +
      `${PRERENDER_ROUTES.length} expected\n` +
      `${succeeded.length} succeeded\n` +
      `${failed.length} failed\n` +
      `Critical routes: ${criticalPass ? "PASS" : "FAIL"}\n` +
      `Threshold: ${thresholdPass ? "PASS" : "FAIL"}`,
  );

  if (!criticalPass || !thresholdPass) {
    console.error("\n[prerender] FATAL: refusing to ship this build.");
    if (unknownCritical.length) {
      console.error(
        `  Critical routes not present in the route table: ${unknownCritical.join(", ")}`,
      );
    }
    if (failedCritical.length) {
      console.error(`  Critical routes that failed: ${failedCritical.join(", ")}`);
    }
    if (!thresholdPass) {
      console.error(
        `  Only ${succeeded.length} of ${PRERENDER_ROUTES.length} routes prerendered; ` +
          `${MIN_SUCCESSFUL_ROUTES} required.`,
      );
    }
    console.error(
      "  Set PRERENDER_SKIP_GATES=1 to override, but understand that shipping " +
        "restores the empty-shell behaviour for the affected pages.",
    );
    if (!process.env.PRERENDER_SKIP_GATES) process.exit(1);
    console.error("  PRERENDER_SKIP_GATES=1 set - continuing anyway.");
  }

  // Importing the app for SSR leaves handles open that never settle - the
  // supabase client's auth refresh timer, happy-dom timers, react-query.
  // Without an explicit exit the build hangs here forever after doing all
  // of its work. Everything is written to disk by this point.
  process.exit(0);
}

/** Add a robots noindex directive to the plain client shell. */
function injectNoindex(template) {
  if (/<meta[^>]*name=["']robots["']/i.test(template)) return template;
  return template.replace(
    "</head>",
    '    <meta name="robots" content="noindex, nofollow" />\n  </head>',
  );
}

function injectIntoTemplate(template, route, appHtml, head) {
  let out = template;

  const hasHelmetHead = Boolean(head.title || head.meta || head.link || head.script);

  // 1) Strip static head tags that Helmet will replace per-route, to avoid
  // duplicate <title>, <meta name="description">, <link rel="canonical">, and
  // duplicate og:* tags in the prerendered HTML. We only strip when Helmet
  // produced its own output - if SSR head capture failed, leave the static
  // fallback so the page still has *some* metadata.
  if (hasHelmetHead) {
    // <title>...</title>
    out = out.replace(/\s*<title>[\s\S]*?<\/title>/i, "");
    // <meta name="description" ...> (handles multi-line)
    out = out.replace(/\s*<meta\s+name=["']description["'][\s\S]*?\/?>/gi, "");
    // <meta name="keywords" ...> (Helmet pages own this too)
    out = out.replace(/\s*<meta\s+name=["']keywords["'][\s\S]*?\/?>/gi, "");
    // <link rel="canonical" ...>
    out = out.replace(/\s*<link\s+rel=["']canonical["'][\s\S]*?\/?>/gi, "");
    // og:* and twitter:* meta - Helmet emits per-route, drop static dupes
    out = out.replace(/\s*<meta\s+property=["']og:(title|description|url|image|type)["'][\s\S]*?\/?>/gi, "");
    out = out.replace(/\s*<meta\s+name=["']twitter:(card|title|description|image)["'][\s\S]*?\/?>/gi, "");
  }

  // 2) Inject Helmet head BEFORE </head>. Helmet's stringified output already
  // includes <title>, <meta>, <link>, <script type="application/ld+json"> tags
  // with data-rh attributes so the client-side Helmet recognises and replaces them.
  const headFragment = [head.title, head.meta, head.link, head.script]
    .filter(Boolean)
    .join("\n    ");
  if (headFragment) {
    out = out.replace("</head>", `    ${headFragment}\n  </head>`);
  }

  // 3) Inject rendered React app into #root and mark as SSR so main.tsx hydrates.
  out = out.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root" data-ssr="true">${appHtml}</div>`
  );

  return out;
}

function writeRouteFile(route, html) {
  // "/" -> dist/index.html (overwrites the empty template with hydrated version)
  // "/services" -> dist/services/index.html
  //
  // Non-ASCII routes are written under their PERCENT-ENCODED name:
  //   "/guides/אלרגיה-מדריך-מקיף" -> dist/guides/%D7%90%D7%9C.../index.html
  //
  // The production host matches the raw, undecoded request path against
  // filenames - it never percent-decodes before lookup. Verified against
  // production with the public/_probe/* experiment: a request for
  // /_probe/%D7%A2... resolved to the directory literally named
  // "%D7%A2...", while the directory named "עברית" was unreachable by every
  // request form tried. Since a browser always sends the encoded form on the
  // wire, encoding the filename is what makes the Hebrew URLs resolve.
  //
  // encodeURI leaves "/" and every ASCII route untouched, so ASCII output
  // paths are byte-identical to before.
  const encodedRoute = encodeURI(route);
  const relativePath =
    encodedRoute === "/" ? "index.html" : `${encodedRoute.replace(/^\//, "")}/index.html`;
  const fullPath = join(DIST_DIR, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, html, "utf8");
}

main().catch((err) => {
  console.error("[prerender] Fatal error:", err);
  // A client shell alone is not an acceptable production SEO build.
  process.exit(1);
});
