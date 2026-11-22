import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

const router = createBrowserRouter([{ path: "*", element: <App /> }]);

const container = document.getElementById("root");
if (container) {
  const tree = (
    <React.StrictMode>
      <HelmetProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
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
