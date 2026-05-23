import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";

// CRITICAL: Force react-helmet-async into server mode even though our SSR
// runtime has a happy-dom `window`. Without this, the Dispatcher detects DOM
// and tries to mutate document.head (calling cancelAnimationFrame, etc.),
// which crashes SSR and leaves `helmetContext.helmet` undefined.
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
  const helmetContext: { helmet?: any } = {};
  const html = renderToString(
    <React.StrictMode>
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>
    </React.StrictMode>
  );

  const helmet = helmetContext.helmet;
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
