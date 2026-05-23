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

  // Cleanup SSR build artifacts (keep when DEBUG_SSR=1)
  if (!process.env.DEBUG_SSR) rmSync(SSR_DIR, { recursive: true, force: true });


  console.log(`\n[prerender] Done. ${succeeded.length} succeeded, ${failed.length} failed.`);
  if (failed.length) {
    console.log("[prerender] Failed routes (will fall back to CSR):");
    for (const f of failed) console.log(`  - ${f.route}: ${f.error}`);
  }
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
