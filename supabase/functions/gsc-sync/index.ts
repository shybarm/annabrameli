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
import {
  aggregateGscRows,
  aggregateGscPageRows,
  type GscRow,
} from "../_shared/gsc-aggregate.ts";

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
  dimensions: string[] = ["page", "query"],
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
        // keeps each response smaller. An empty array asks Google for the
        // property's undimensioned daily totals.
        dimensions,
        rowLimit: ROW_LIMIT,
        startRow,
        dataState: "final",
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(
        `Search Console API ${res.status} for ${property} on ${date} ` +
          `[${dimensions.join(",") || "totals"}]: ${detail.slice(0, 300)}`,
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


/**
 * Ingest one non-query grain for a set of property-days.
 *
 * Kept separate from the query-grain loop, and tracked in its own cursor table,
 * because the three grains carry different truths and must fail independently:
 *
 *   totals  dimensions []        the property's true daily traffic
 *   page    dimensions ["page"]  true per-page performance
 *   query   dimensions [page,query] (elsewhere) which queries reach a page,
 *                                heavily suppressed by Google's anonymisation
 *                                of rare queries and never a traffic measure
 *
 * Days where Google returns nothing are recorded as ok with rows_written 0 -
 * no row is fabricated for a zero-data day.
 */
async function ingestGrain(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the repo's ESLint config also covers supabase/functions
  supabase: any,
  token: string,
  dataset: "page" | "totals",
  targets: { property: string; date: string }[],
  startMs: number,
): Promise<{
  daysProcessed: number;
  rowsWritten: number;
  failures: { property: string; date: string; error: string }[];
  timedOut: boolean;
}> {
  const failures: { property: string; date: string; error: string }[] = [];
  let daysProcessed = 0;
  let rowsWritten = 0;
  let timedOut = false;

  const table =
    dataset === "page" ? "search_console_page_daily" : "search_console_totals_daily";
  const conflict =
    dataset === "page" ? "property,date,page_host,page_path" : "property,date";
  const dimensions = dataset === "page" ? ["page"] : [];

  for (const target of targets) {
    if (Date.now() - startMs > TIME_BUDGET_MS) {
      timedOut = true;
      break;
    }

    try {
      const raw = await fetchDay(token, target.property, target.date, dimensions);

      let records: unknown[] = [];
      if (dataset === "page") {
        records = aggregateGscPageRows(raw, target.property, target.date);
      } else if (raw.length > 0) {
        // Undimensioned request: Google returns at most one row, which IS the
        // property total. Never derive this by summing page or query rows.
        const row = raw[0];
        records = [{
          property: target.property,
          date: target.date,
          clicks: Math.round(row.clicks ?? 0),
          impressions: Math.round(row.impressions ?? 0),
          ctr: Number((row.ctr ?? 0).toFixed(6)),
          position: Number((row.position ?? 0).toFixed(2)),
          fetched_at: new Date().toISOString(),
        }];
      }

      for (let i = 0; i < records.length; i += 500) {
        const { error } = await supabase
          .from(table)
          .upsert(records.slice(i, i + 500), { onConflict: conflict });
        if (error) throw new Error(`Upsert failed: ${error.message}`);
      }

      await supabase.from("gsc_dataset_sync_cursor").upsert(
        {
          property: target.property,
          dataset,
          date: target.date,
          status: "ok",
          rows_written: records.length,
          last_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "property,dataset,date" },
      );

      daysProcessed++;
      rowsWritten += records.length;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ ...target, error: message.slice(0, 300) });

      const { data: existing } = await supabase
        .from("gsc_dataset_sync_cursor")
        .select("attempts")
        .eq("property", target.property)
        .eq("dataset", dataset)
        .eq("date", target.date)
        .maybeSingle();

      await supabase.from("gsc_dataset_sync_cursor").upsert(
        {
          property: target.property,
          dataset,
          date: target.date,
          status: "error",
          attempts: ((existing?.attempts as number) ?? 0) + 1,
          last_error: message.slice(0, 500),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "property,dataset,date" },
      );

      if (/40[13]/.test(message)) {
        console.error(`[gsc-sync] ${dataset}: access error - aborting grain:`, message);
        break;
      }
    }

    await sleep(PACE_MS);
  }

  return { daysProcessed, rowsWritten, failures, timedOut };
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
  if (!authorised && bearer) {
    if (bearer === SERVICE_ROLE) {
      authorised = true;
    } else {
      // Vault-held keys may be rotated/alternate service keys: accept any token
      // whose JWT payload carries the service_role claim.
      try {
        const payload = JSON.parse(atob(bearer.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (payload?.role === "service_role") authorised = true;
      } catch (_) { /* not a JWT */ }
    }
  }

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

    // --- Audit: reconcile our stored totals against Search Console itself ---
    // Read-only, writes nothing. Compares, for one date range and property:
    //   a) totals with NO dimensions (what the Search Console UI shows)
    //   b) totals grouped by page+query (what we ingest - Google withholds
    //      anonymised/rare queries here, so this is usually lower)
    //   c) the same, with dataState "all" instead of "final"
    if (mode === "audit") {
      const endDate: string = body.endDate ?? isoDate(latest);
      const startDate: string = body.startDate ?? isoDate(addDays(new Date(endDate), -27));
      const results: Record<string, unknown> = {};

      for (const property of properties) {
        const endpoint =
          `https://searchconsole.googleapis.com/webmasters/v3/sites/` +
          `${encodeURIComponent(property)}/searchAnalytics/query`;

        const call = async (payload: Record<string, unknown>) => {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ startDate, endDate, rowLimit: 25000, ...payload }),
          });
          if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
          const data = await res.json();
          const rows = (data.rows ?? []) as GscRow[];
          return {
            rows: rows.length,
            clicks: rows.reduce((s, r) => s + (r.clicks ?? 0), 0),
            impressions: rows.reduce((s, r) => s + (r.impressions ?? 0), 0),
          };
        };

        try {
          results[property] = {
            totalsNoDimensions_final: await call({ dimensions: [], dataState: "final" }),
            totalsNoDimensions_all: await call({ dimensions: [], dataState: "all" }),
            byPageQuery_final: await call({ dimensions: ["page", "query"], dataState: "final" }),
            byPageQuery_all: await call({ dimensions: ["page", "query"], dataState: "all" }),
            byPage_final: await call({ dimensions: ["page"], dataState: "final" }),
          };
        } catch (err) {
          results[property] = { error: err instanceof Error ? err.message : String(err) };
        }
        await sleep(PACE_MS);
      }

      return respond({ mode, startDate, endDate, results });
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

    // --- New grains: page and property totals -------------------------------
    // Independent of the query grain above: separate cursor, separate failure
    // accounting. One grain failing must never make the others look current.
    const requestedDatasets: ("page" | "totals")[] =
      Array.isArray(body.datasets) && body.datasets.length
        ? body.datasets.filter((d: string) => d === "page" || d === "totals")
        : ["totals", "page"];

    const grainResults: Record<string, unknown> = {};

    for (const dataset of requestedDatasets) {
      let grainTargets: { property: string; date: string }[] = [];

      if (mode === "backfill") {
        const days = Number(body.days) || 480;
        const start = body.startDate ?? isoDate(addDays(latest, -days));
        const end = body.endDate ?? isoDate(latest);

        for (const property of properties) {
          const seeds: { property: string; dataset: string; date: string; status: string }[] = [];
          for (let d = new Date(start); isoDate(d) <= end; d = addDays(d, 1)) {
            seeds.push({ property, dataset, date: isoDate(d), status: "pending" });
          }
          for (let i = 0; i < seeds.length; i += 500) {
            const { error } = await supabase
              .from("gsc_dataset_sync_cursor")
              .upsert(seeds.slice(i, i + 500), {
                onConflict: "property,dataset,date",
                ignoreDuplicates: true,
              });
            if (error) throw new Error(`Dataset cursor seed failed: ${error.message}`);
          }
        }

        const { data: pending, error } = await supabase
          .from("gsc_dataset_sync_cursor")
          .select("property, date")
          .eq("dataset", dataset)
          .in("property", properties)
          .neq("status", "ok")
          .lte("date", end)
          .gte("date", start)
          .order("date", { ascending: true })
          .limit(maxDays);
        if (error) throw new Error(`Dataset cursor read failed: ${error.message}`);
        grainTargets = pending ?? [];
      } else {
        for (const property of properties) {
          for (let i = RESETTLE_DAYS; i >= 0; i--) {
            grainTargets.push({ property, date: isoDate(addDays(latest, -i)) });
          }
        }
      }

      const result = await ingestGrain(supabase, token, dataset, grainTargets, startMs);

      const { count: grainRemaining } = await supabase
        .from("gsc_dataset_sync_cursor")
        .select("*", { count: "exact", head: true })
        .eq("dataset", dataset)
        .in("property", properties)
        .neq("status", "ok");

      grainResults[dataset] = {
        status: result.failures.length === 0 ? "ok" : "partial",
        daysProcessed: result.daysProcessed,
        rowsWritten: result.rowsWritten,
        failureCount: result.failures.length,
        failures: result.failures.slice(0, 5),
        remainingDays: grainRemaining ?? 0,
        timedOut: result.timedOut,
      };
    }

    // What is still outstanding, so the caller knows whether to run again.
    const { count: remaining } = await supabase
      .from("gsc_sync_cursor")
      .select("*", { count: "exact", head: true })
      .in("property", properties)
      .neq("status", "ok");

    // Overall status is the WORST of the three grains, so a page-grain failure
    // can never be hidden behind a healthy query-grain run.
    const grainFailureCount = Object.values(grainResults).reduce(
      (acc: number, g) => acc + ((g as { failureCount: number }).failureCount ?? 0),
      0,
    );
    const grainRemainingTotal = Object.values(grainResults).reduce(
      (acc: number, g) => acc + ((g as { remainingDays: number }).remainingDays ?? 0),
      0,
    );
    const grainTimedOut = Object.values(grainResults).some(
      (g) => (g as { timedOut: boolean }).timedOut,
    );

    const summary = {
      status:
        failures.length === 0 && grainFailureCount === 0 ? "ok" : "partial",
      mode,
      startedAt,
      finishedAt: new Date().toISOString(),
      properties,
      grains: {
        // Query grain: discovery only. Never a traffic or page-performance
        // measure - Google suppresses anonymised queries.
        query: {
          status: failures.length === 0 ? "ok" : "partial",
          daysProcessed,
          rowsWritten,
          failureCount: failures.length,
          failures: failures.slice(0, 5),
          remainingDays: remaining ?? 0,
          timedOut,
        },
        ...grainResults,
      },
      daysProcessed,
      rowsWritten,
      failures: failures.slice(0, 10),
      failureCount: failures.length,
      remainingDays: remaining ?? 0,
      timedOut,
      done:
        !timedOut &&
        !grainTimedOut &&
        (remaining ?? 0) === 0 &&
        grainRemainingTotal === 0,
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
