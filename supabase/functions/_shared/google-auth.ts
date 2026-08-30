/**
 * Google service-account authentication for read-only API access.
 *
 * Mints a short-lived OAuth2 access token from GOOGLE_SERVICE_ACCOUNT_JSON by
 * signing a JWT with the service account's private key (RS256, via WebCrypto -
 * no external dependency).
 *
 * Used by the gsc-sync and ga4-sync functions. Both request read-only scopes;
 * the service account should be granted read access on the Search Console
 * property and the GA4 property, and nothing else.
 *
 * The key never leaves the edge function. It is a Supabase secret, is not in
 * the repository, and must never be exposed to the client.
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function base64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** PEM (PKCS#8) -> CryptoKey for RS256 signing. */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    der.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function readServiceAccount(): ServiceAccount {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!raw) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not configured. Add the service account " +
        "key JSON as a Supabase Edge Function secret.",
    );
  }

  let parsed: ServiceAccount;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the whole key file " +
        "contents, including the surrounding braces.",
    );
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key.",
    );
  }

  // Secrets pasted through a UI often arrive with literal \n instead of real
  // newlines, which makes the PEM unparseable in a way that is tedious to
  // diagnose. Normalise rather than fail.
  parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  return parsed;
}

/**
 * Exchange the service account key for an access token.
 * @param scope Space-separated OAuth scopes. Read-only scopes only.
 */
export async function getGoogleAccessToken(scope: string): Promise<string> {
  const sa = readServiceAccount();
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope,
      aud: GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );

  const key = await importPrivateKey(sa.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  const assertion = `${header}.${claims}.${base64url(signature)}`;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Google token exchange failed (${res.status}). Check that the service ` +
        `account key is valid and the required API is enabled. ${detail.slice(0, 300)}`,
    );
  }

  const { access_token } = await res.json();
  if (!access_token) throw new Error("Google returned no access_token.");
  return access_token as string;
}

/**
 * Records a sync run in the existing audit_log. No new table needed.
 *
 * Typed as `any` deliberately: the supabase-js client's generic signature does
 * not narrow to a hand-written structural type, and pinning it here would mean
 * duplicating the generated Database types into edge-function scope.
 */
export async function logSyncRun(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the repo's ESLint config also covers supabase/functions
  supabase: any,
  action: string,
  summary: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from("audit_log").insert({
      action,
      table_name: "integration_sync",
      new_data: summary,
    });
  } catch (err) {
    // Never let logging failure break a sync.
    console.error(`[${action}] failed to write audit_log entry:`, err);
  }
}
