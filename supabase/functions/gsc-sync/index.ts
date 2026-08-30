/**
 * gsc-sync — pull Search Console performance data into search_console_daily.
 *
 * Read-only against Google. Writes only to search_console_daily and one
 * audit_log row per run. Touches no patient data and no site content.
 *
 * Search Console finalises a day's data 2-3 days after the fact, so each run
 * re-fetches a trailing window and upserts. Re-running is always safe.
 *
 * Auth: this function is NOT public. It requires either a staff JWT or the
 * internal cron token, checked below. Do not set verify_jwt = false for it.
 *
 * Required secrets:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  service account key JSON
 *   GSC_SITE_URL                 e.g. "https://ihaveallergy.com/" or
 *                                "sc-domain:ihaveallergy.com"
 *   REMINDER_INTERNAL_TOKEN      reused as the cron token (already configured)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken, logSyncRun } from "../_shared/google-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

/** Days back to re-fetch each run. Covers Search Console's reporting lag. */
const DEFAULT_WINDOW_DAYS = 5;
const MAX_ROWS_PER_REQUEST = 25000;

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface GscRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

async function fetchSearchAnalytics(
  token: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
): Promise<GscRow[]> {
  const endpoint =
    `https://searchconsole.googleapis.com/webmasters/v3/sites/` +
    `${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

  const rows: GscRow[] = [];
  let startRow = 0;

  // Paginate until Google returns a short page.
  while (true) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["date", "page", "query"],
        rowLimit: MAX_ROWS_PER_REQUEST,
        startRow,
        dataState: "final",
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(
        `Search Console API ${res.status}: ${detail.slice(0, 400)}`,
      );
    }

    const data = await res.json();
    const page: GscRow[] = data.rows ?? [];
    rows.push(...page);

    if (page.length < MAX_ROWS_PER_REQUEST) break;
    startRow += page.length;
  }

  return rows;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return respond({ error: "Supabase credentials not configured" }, 500);
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // --- Authorisation -------------------------------------------------------
  // Either the internal cron token, or a signed-in staff user. Never open.
  const cronToken = Deno.env.get("REMINDER_INTERNAL_TOKEN");
  const providedToken = req.headers.get("x-internal-token");
  let authorised = Boolean(cronToken && providedToken && providedToken === cronToken);

  if (!authorised) {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (jwt) {
      const { data: userData } = await supabase.auth.getUser(jwt);
      const userId = userData?.user?.id;
      if (userId) {
        const { data: isStaff } = await supabase.rpc("is_staff", { _user_id: userId });
        authorised = Boolean(isStaff);
      }
    }
  }

  if (!authorised) {
    return respond({ error: "Not authorised" }, 403);
  }

  // --- Configuration -------------------------------------------------------
  const siteUrl = Deno.env.get("GSC_SITE_URL");
  if (!siteUrl) {
    return respond(
      {
        error: "GSC_SITE_URL is not configured",
        hint:
          'Set it to the exact property as it appears in Search Console, e.g. ' +
          '"https://ihaveallergy.com/" for a URL-prefix property or ' +
          '"sc-domain:ihaveallergy.com" for a domain property.',
      },
      500,
    );
  }

  const startedAt = new Date().toISOString();

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const windowDays = Number(body.windowDays) || DEFAULT_WINDOW_DAYS;

    // Search Console has no data for the last ~2 days; start the window before it.
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 2);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - windowDays);

    const startDate = body.startDate || isoDate(start);
    const endDate = body.endDate || isoDate(end);

    console.log(`[gsc-sync] Fetching ${siteUrl} from ${startDate} to ${endDate}`);

    const token = await getGoogleAccessToken(SCOPE);
    const rows = await fetchSearchAnalytics(token, siteUrl, startDate, endDate);

    console.log(`[gsc-sync] Search Console returned ${rows.length} rows`);

    const records = rows
      .filter((r) => Array.isArray(r.keys) && r.keys.length === 3)
      .map((r) => ({
        date: r.keys![0],
        page: r.keys![1],
        query: r.keys![2],
        clicks: Math.round(r.clicks ?? 0),
        impressions: Math.round(r.impressions ?? 0),
        ctr: Number((r.ctr ?? 0).toFixed(6)),
        position: Number((r.position ?? 0).toFixed(2)),
        fetched_at: new Date().toISOString(),
      }));

    // Upsert in chunks so one oversized request cannot fail the whole run.
    let written = 0;
    const CHUNK = 1000;
    for (let i = 0; i < records.length; i += CHUNK) {
      const chunk = records.slice(i, i + CHUNK);
      const { error } = await supabase
        .from("search_console_daily")
        .upsert(chunk, { onConflict: "date,page,query" });
      if (error) throw new Error(`Upsert failed at row ${i}: ${error.message}`);
      written += chunk.length;
    }

    const summary = {
      status: "ok",
      startedAt,
      finishedAt: new Date().toISOString(),
      siteUrl,
      startDate,
      endDate,
      rowsReturned: rows.length,
      rowsWritten: written,
    };
    await logSyncRun(supabase, "gsc_sync", summary);
    console.log(`[gsc-sync] Wrote ${written} rows`);

    return respond(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[gsc-sync] Failed:", message);
    await logSyncRun(supabase, "gsc_sync", {
      status: "error",
      startedAt,
      finishedAt: new Date().toISOString(),
      error: message,
    });
    return respond({ error: message }, 500);
  }
});
