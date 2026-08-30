/**
 * gsc-sync — ingest Search Console performance data, one property-day at a time.
 *
 * Read-only against Google. Writes only to search_console_daily and
 * gsc_sync_cursor, plus one audit_log row per invocation. Touches no patient
 * data and no site content.
 *
 * Design notes:
 *
 *   • Multi-property. GSC_SITE_URLS holds a comma-separated list; each property
 *     is ingested independently and `property` is part of the row key, so
 *     ihaveallergy.com and seo.ihaveallergy.com can never collide.
 *
 *   • Day by day. Each request covers exactly one date, which keeps every
 *     response well inside Google's row limits and makes progress restartable
 *     at day granularity. A single wide date range would silently truncate.
 *
 *   • Resumable. gsc_sync_cursor records per (property, date) status. An
 *     invocation processes what it can inside its time budget and reports what
 *     remains; re-invoking continues rather than starting over.
 *
 *   • Recent days are never trusted as final. Search Console settles data for
 *     two to three days, so the most recent RESETTLE_DAYS are always re-fetched
 *     and re-upserted even if previously marked ok.
 *
 * Auth: staff JWT or the internal cron token. verify_jwt stays true, so the
 * gateway rejects unauthenticated calls before this code runs.
 *
 * Required secrets: GOOGLE_SERVICE_ACCOUNT_JSON, GSC_SITE_URLS,
 * REMINDER_INTERNAL_TOKEN.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken, logSyncRun } from "../_shared/google-auth.ts";
import { normalizeUrl, hostFromProperty } from "../_shared/url-normalize.ts";
import { aggregateGscRows, type GscRow } from "../_shared/gsc-aggregate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

/** Search Console has no data for roughly the last two days. */
const REPORTING_LAG_DAYS = 2;
/** Days back that are always re-fetched, because they can still settle. */
const RESETTLE_DAYS = 4;
/** Rows per API page. Google caps this at 25000. */
const ROW_LIMIT = 25000;
/** Hard ceiling on pages per day, so a pathological response cannot loop. */
const MAX_PAGES_PER_DAY = 20;
/** Stop starting new work past this, leaving room to finish and respond. */
const TIME_BUDGET_MS = 100_000;
/** Gentle pacing between Google calls. */
const PACE_MS = 120;

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch every row for one property on one date, paginating as needed. */
async function fetchDay(
  token: string,
  property: string,
  date: string,
): Promise<GscRow[]> {
  const endpoint =
    `https://searchconsole.googleapis.com/webmasters/v3/sites/` +
    `${encodeURIComponent(property)}/searchAnalytics/query`;

  const rows: GscRow[] = [];
  let startRow = 0;

  for (let page = 0; page < MAX_PAGES_PER_DAY; page++) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: date,
        endDate: date,
        // No "date" dimension: the range already pins the day, and omitting it
        // keeps each response smaller.
        dimensions: ["page", "query"],
        rowLimit: ROW_LIMIT,
        startRow,
        dataState: "final",
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(
        `Search Console API ${res.status} for ${property} on ${date}: ${detail.slice(0, 300)}`,
      );
    }

    const data = await res.json();
    const batch: GscRow[] = data.rows ?? [];
    rows.push(...batch);

    if (batch.length < ROW_LIMIT) break;
    startRow += batch.length;
    await sleep(PACE_MS);
  }

  return rows;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return respond({ error: "Supabase credentials not configured" }, 500);
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // --- Authorisation: internal cron token, or a signed-in staff user ---------
  const cronToken = Deno.env.get("REMINDER_INTERNAL_TOKEN");
  const providedToken = req.headers.get("x-internal-token");
  let authorised = Boolean(cronToken && providedToken && providedToken === cronToken);

  // Scheduled pg_cron runs authenticate with the service role key held in the
  // database vault; they have no user JWT and no access to the internal token.
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!authorised && bearer && bearer === SERVICE_ROLE) authorised = true;

  if (!authorised) {
    const jwt = bearer;
    if (jwt) {
      const { data: userData } = await supabase.auth.getUser(jwt);
      const userId = userData?.user?.id;
      if (userId) {
        const { data: isStaff } = await supabase.rpc("is_staff", { _user_id: userId });
        authorised = Boolean(isStaff);
      }
    }
  }
  if (!authorised) return respond({ error: "Not authorised" }, 403);

  // --- Configuration --------------------------------------------------------
  const rawProperties =
    Deno.env.get("GSC_SITE_URLS") ?? Deno.env.get("GSC_SITE_URL") ?? "";
  const allProperties = rawProperties
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allProperties.length === 0) {
    return respond(
      {
        error: "GSC_SITE_URLS is not configured",
        hint:
          "Comma-separated Search Console property identifiers, exactly as they " +
          'appear in Search Console, e.g. "sc-domain:ihaveallergy.com,sc-domain:seo.ihaveallergy.com".',
      },
      500,
    );
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const mode: string = body.mode ?? "recent";
    const properties: string[] = Array.isArray(body.properties) && body.properties.length
      ? body.properties
      : allProperties;
    const maxDays: number = Number(body.maxDays) || 40;

    // Latest date Search Console can be expected to have.
    const latest = addDays(new Date(), -REPORTING_LAG_DAYS);

    // --- Connectivity probe: authenticate and confirm each property ---------
    const token = await getGoogleAccessToken(SCOPE);

    if (mode === "probe") {
      const probeDate = isoDate(addDays(latest, -3));
      const results: Record<string, unknown> = {};
      for (const property of properties) {
        try {
          const rows = await fetchDay(token, property, probeDate);
          results[property] = {
            accessible: true,
            probeDate,
            rowsReturned: rows.length,
            sampleHost: rows.length
              ? normalizeUrl(rows[0].keys?.[0] ?? "", hostFromProperty(property)).host
              : null,
          };
        } catch (err) {
          results[property] = {
            accessible: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
        await sleep(PACE_MS);
      }
      const summary = { mode, startedAt, finishedAt: new Date().toISOString(), results };
      await logSyncRun(supabase, "gsc_sync_probe", summary);
      return respond(summary);
    }

    // --- Decide which (property, day) pairs to process ----------------------
    let targets: { property: string; date: string }[] = [];

    if (mode === "backfill") {
      const days = Number(body.days) || 480;
      const start = body.startDate ?? isoDate(addDays(latest, -days));
      const end = body.endDate ?? isoDate(latest);

      // Seed cursor rows for the requested span, leaving existing rows alone.
      for (const property of properties) {
        const seeds: { property: string; date: string; status: string }[] = [];
        for (let d = new Date(start); isoDate(d) <= end; d = addDays(d, 1)) {
          seeds.push({ property, date: isoDate(d), status: "pending" });
        }
        for (let i = 0; i < seeds.length; i += 500) {
          const { error } = await supabase
            .from("gsc_sync_cursor")
            .upsert(seeds.slice(i, i + 500), {
              onConflict: "property,date",
              ignoreDuplicates: true,
            });
          if (error) throw new Error(`Cursor seed failed: ${error.message}`);
        }
      }

      // Oldest first, so an interrupted backfill makes forward progress.
      const { data: pending, error } = await supabase
        .from("gsc_sync_cursor")
        .select("property, date")
        .in("property", properties)
        .neq("status", "ok")
        .lte("date", end)
        .gte("date", start)
        .order("date", { ascending: true })
        .limit(maxDays);
      if (error) throw new Error(`Cursor read failed: ${error.message}`);
      targets = pending ?? [];
    } else {
      // "recent": always re-fetch the settle window, ok or not.
      for (const property of properties) {
        for (let i = RESETTLE_DAYS; i >= 0; i--) {
          targets.push({ property, date: isoDate(addDays(latest, -i)) });
        }
      }
    }

    // --- Ingest ------------------------------------------------------------
    let daysProcessed = 0;
    let rowsWritten = 0;
    const failures: { property: string; date: string; error: string }[] = [];
    let timedOut = false;

    for (const target of targets) {
      if (Date.now() - startMs > TIME_BUDGET_MS) {
        timedOut = true;
        break;
      }

      try {
        const raw = await fetchDay(token, target.property, target.date);
        const records = aggregateGscRows(raw, target.property, target.date);

        for (let i = 0; i < records.length; i += 500) {
          const { error } = await supabase
            .from("search_console_daily")
            .upsert(records.slice(i, i + 500), {
              onConflict: "property,date,page_host,page_path,query",
            });
          if (error) throw new Error(`Upsert failed: ${error.message}`);
        }

        await supabase.from("gsc_sync_cursor").upsert(
          {
            property: target.property,
            date: target.date,
            status: "ok",
            rows_written: records.length,
            last_error: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "property,date" },
        );

        daysProcessed++;
        rowsWritten += records.length;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failures.push({ ...target, error: message.slice(0, 300) });

        const { data: existing } = await supabase
          .from("gsc_sync_cursor")
          .select("attempts")
          .eq("property", target.property)
          .eq("date", target.date)
          .maybeSingle();

        await supabase.from("gsc_sync_cursor").upsert(
          {
            property: target.property,
            date: target.date,
            status: "error",
            attempts: ((existing?.attempts as number) ?? 0) + 1,
            last_error: message.slice(0, 500),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "property,date" },
        );

        // A permissions or auth failure will repeat for every remaining day;
        // stop rather than burning quota and filling the cursor with errors.
        if (/40[13]/.test(message)) {
          console.error("[gsc-sync] Access error - aborting run:", message);
          break;
        }
      }

      await sleep(PACE_MS);
    }

    // What is still outstanding, so the caller knows whether to run again.
    const { count: remaining } = await supabase
      .from("gsc_sync_cursor")
      .select("*", { count: "exact", head: true })
      .in("property", properties)
      .neq("status", "ok");

    const summary = {
      status: failures.length === 0 ? "ok" : "partial",
      mode,
      startedAt,
      finishedAt: new Date().toISOString(),
      properties,
      daysProcessed,
      rowsWritten,
      failures: failures.slice(0, 10),
      failureCount: failures.length,
      remainingDays: remaining ?? 0,
      timedOut,
      done: !timedOut && (remaining ?? 0) === 0,
    };

    await logSyncRun(supabase, "gsc_sync", summary);
    console.log(
      `[gsc-sync] ${mode}: ${daysProcessed} days, ${rowsWritten} rows, ` +
        `${failures.length} failures, ${remaining ?? 0} remaining`,
    );
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
