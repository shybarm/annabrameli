import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Window } from "happy-dom";

const dist = resolve(process.cwd(), "dist");
const manifest = JSON.parse(readFileSync(join(dist, "prerendered-routes.json"), "utf8"));
const routeSet = new Set(manifest.routes);
const errors = [];
const warnings = [];
const titles = new Map();
const descriptions = new Map();

const routeFile = (route) => route === "/"
  ? join(dist, "index.html")
  : join(dist, ...route.slice(1).split("/").map(encodeURIComponent), "index.html");

for (const route of manifest.routes) {
  const file = routeFile(route);
  if (!existsSync(file)) {
    errors.push(`${route}: missing prerendered HTML`);
    continue;
  }

  const window = new Window({ url: `https://ihaveallergy.com${route}` });
  window.document.write(readFileSync(file, "utf8"));
  const { document } = window;
  const indexed = !document.querySelector('meta[name="robots"]')?.content.includes("noindex");
  const title = document.title.trim();
  const description = document.querySelector('meta[name="description"]')?.content.trim() || "";
  const canonical = document.querySelector('link[rel="canonical"]')?.href || "";
  let canonicalRoute = "";
  try {
    const parsedCanonical = new URL(canonical);
    canonicalRoute = parsedCanonical.origin === "https://ihaveallergy.com"
      ? decodeURIComponent(parsedCanonical.pathname).replace(/\/$/, "") || "/"
      : canonical;
  } catch {}
  const h1Count = document.querySelectorAll("h1").length;

  if (!title) errors.push(`${route}: missing title`);
  if (!description) errors.push(`${route}: missing meta description`);
  if (indexed && canonicalRoute !== route) errors.push(`${route}: canonical is ${canonical || "missing"}`);
  if (indexed && h1Count !== 1) errors.push(`${route}: expected one H1, found ${h1Count}`);
  if (document.documentElement.lang !== "he") errors.push(`${route}: html lang is not he`);
  if (document.documentElement.dir !== "rtl") errors.push(`${route}: html dir is not rtl`);
  if (indexed && !document.querySelector('meta[property="og:title"]')) warnings.push(`${route}: missing route-specific og:title`);
  if (indexed && !document.querySelector('meta[name="twitter:card"]')) warnings.push(`${route}: missing route-specific twitter:card`);

  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try { JSON.parse(script.textContent || ""); }
    catch { errors.push(`${route}: invalid JSON-LD`); }
  }

  for (const image of document.querySelectorAll("img")) {
    if (!image.hasAttribute("alt")) errors.push(`${route}: image missing alt (${image.getAttribute("src") || "unknown"})`);
  }

  for (const anchor of document.querySelectorAll("a[href]")) {
    const href = anchor.getAttribute("href");
    if (!href || !href.startsWith("/") || href.startsWith("//")) continue;
    const path = decodeURIComponent(href.split(/[?#]/)[0]).replace(/\/$/, "") || "/";
    if (!routeSet.has(path) && !path.startsWith("/admin") && !path.startsWith("/auth") &&
        !path.startsWith("/intake/") && !path.startsWith("/join/") && !path.startsWith("/patient-invite/")) {
      errors.push(`${route}: internal link has no prerendered target (${href})`);
    }
  }

  const previousTitle = titles.get(title);
  if (previousTitle && indexed) errors.push(`${route}: duplicate title with ${previousTitle}`);
  else if (indexed) titles.set(title, route);
  const previousDescription = descriptions.get(description);
  if (previousDescription && indexed) warnings.push(`${route}: duplicate description with ${previousDescription}`);
  else if (indexed && description) descriptions.set(description, route);
  window.close();
}

console.log(`SEO audit: ${manifest.routes.length} prerendered routes`);
console.log(`Errors: ${errors.length}`);
for (const error of [...new Set(errors)]) console.log(`ERROR ${error}`);
console.log(`Warnings: ${warnings.length}`);
for (const warning of [...new Set(warnings)]) console.log(`WARN  ${warning}`);
if (errors.length) process.exit(1);
