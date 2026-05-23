import { Window } from "happy-dom";
const win = new Window({ url: "https://ihaveallergy.com/" });
for (const k of ["window","document","navigator","location","history","localStorage","sessionStorage","HTMLElement","Element","Node","Text","Document","DocumentFragment","ShadowRoot","Event","CustomEvent","MouseEvent","KeyboardEvent","MutationObserver","IntersectionObserver","ResizeObserver","matchMedia","requestAnimationFrame","cancelAnimationFrame","getComputedStyle","DOMParser","XMLSerializer","NodeFilter","CSS"]) {
  if (win[k] !== undefined && globalThis[k] === undefined) {
    try { Object.defineProperty(globalThis, k, { value: win[k], configurable: true, writable: true }); } catch {}
  }
}
globalThis.window = win; globalThis.document = win.document; globalThis.self = win;

const { render } = await import("/dev-server/dist-ssr-test/entry-server.mjs");
for (const url of ["/", "/services", "/faq", "/dr-anna-brameli"]) {
  const r = render(url);
  console.log("==", url);
  console.log("title:", r.head.title.slice(0,200));
  console.log("script len:", r.head.script.length);
  console.log("html includes Services?", r.html.includes("שירותים ואבחונים"));
  console.log("html includes FAQ heading?", r.html.includes("שאלות נפוצות"));
}
