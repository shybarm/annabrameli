import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root");
if (container) {
  const tree = (
    <React.StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>
  );
  // If the container was prerendered to static HTML at build time, hydrate it.
  // Otherwise mount fresh (dev and non-prerendered routes).
  if (container.hasAttribute("data-ssr") || container.childElementCount > 0) {
    hydrateRoot(container, tree);
  } else {
    createRoot(container).render(tree);
  }
}
