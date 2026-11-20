import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** New pages always start at the top; in-page section links keep working. */
export function RouteScrollReset() {
  const { pathname } = useLocation();

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
