import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, HelmetData } from "react-helmet-async";
import App from "./App";

// Re-exported so scripts/prerender.mjs can read the route table from the
// compiled SSR bundle instead of keeping its own copy in sync by hand.
export {
  PUBLIC_ROUTES,
  NOINDEX_ROUTES,
  SITEMAP_EXCLUDED,
  SAMPLE_ROUTES,
} from "./data/public-routes";

// Force react-helmet-async into server mode (happy-dom provides a `window`
// at SSR time, otherwise Helmet tries to mutate document.head and crashes).
(HelmetProvider as unknown as { canUseDOM: boolean }).canUseDOM = false;

export interface RenderResult {
  html: string;
  head: {
    title: string;
    meta: string;
    link: string;
    script: string;
    htmlAttributes: string;
    bodyAttributes: string;
  };
}

export function render(url: string): RenderResult {
  // CRITICAL: A *fresh* HelmetData per render. react-helmet-async otherwise
  // falls back to a process-wide singleton, and head state accumulates across
  // routes (every route ends up with every prior route's <title>/JSON-LD).
  const helmetData = new (HelmetData as unknown as new (
    context: Record<string, unknown>,
    canUseDOM?: boolean,
  ) => { context: { helmet?: any } })({}, false);

  const html = renderToString(
    <HelmetProvider context={helmetData.context as Record<string, unknown>}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </HelmetProvider>
  );

  const helmet = helmetData.context.helmet;
  return {
    html,
    head: {
      title: helmet?.title?.toString() ?? "",
      meta: helmet?.meta?.toString() ?? "",
      link: helmet?.link?.toString() ?? "",
      script: helmet?.script?.toString() ?? "",
      htmlAttributes: helmet?.htmlAttributes?.toString() ?? "",
      bodyAttributes: helmet?.bodyAttributes?.toString() ?? "",
    },
  };
}

