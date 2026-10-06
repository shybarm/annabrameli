export function readLeadAttribution(body: Record<string, unknown>) {
  const source = body.source === "allergist_private_landing" ? "allergist_private_landing" : "contact_form";
  const raw = body.attribution && typeof body.attribution === "object" ? body.attribution as Record<string, unknown> : {};
  const labels: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const value = raw[key];
    if (typeof value === "string" && /^[a-z0-9_.-]{1,100}$/i.test(value) && !/\d{7,}/.test(value)) labels[key] = value;
  }
  let referrer = "";
  try {
    const url = new URL(String(raw.referrer ?? ""));
    if (/^https?:$/.test(url.protocol)) referrer = url.origin;
  } catch { /* no valid referrer */ }
  // A known form source is authoritative; the landing path is descriptive, not a validated source of truth.
  return { source, labels, referrer };
}
