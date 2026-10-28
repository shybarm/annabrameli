// Deliberately limited to an explicitly approved public landing document.
// Navigation ends recording before React can display a private route.
const allowed = new Set(['/', '/about', '/services', '/allergist-private']);
let stopped = false;
let recorder: { stop: () => void } | undefined;
let started = false;
export function clarityEligible(): boolean {
  return !stopped && allowed.has(window.location.pathname) && !window.location.search && !window.location.hash;
}
export function stopPublicClarity(): void {
  stopped = true;
  recorder?.stop();
}
export async function startPublicClarity(): Promise<boolean> {
  if (!clarityEligible() || started) return false;
  const { clarity } = await import('clarity-js');
  if (!clarityEligible() || started) return false;
  started = true;
  recorder = clarity;
  // Register before the recorder's listeners and before any sensitive DOM renders.
  window.addEventListener('popstate', stopPublicClarity, { capture: true });
  window.addEventListener('hashchange', stopPublicClarity, { capture: true });
  window.addEventListener('pagehide', stopPublicClarity, { capture: true });
  document.addEventListener('focusin', e => {
    if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) stopPublicClarity();
  }, { capture: true });
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = window.history[method];
    window.history[method] = function (...args) {
      stopPublicClarity();
      return original.apply(this, args);
    };
  }
  const queryKeys = (value: string) => { try { return [...new URL(value).searchParams.keys()]; } catch { return []; } };
  clarity.start({
    projectId: 'z4y5o89e7s', upload: 'https://a.clarity.ms/collect',
    content: false, mask: ['html'], unmask: [], cookies: [], track: false,
    fraud: false, diagnostics: false, includeSubdomains: false,
    drop: [...new Set([...queryKeys(document.referrer), 'token', 'email', 'phone', 'name', 'message'])],
  });
  return true;
}
