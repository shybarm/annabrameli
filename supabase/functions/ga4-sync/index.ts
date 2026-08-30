/**
 * ga4-sync — ingest GA4 behaviour data.
 *
 * Read-only against Google. Writes only to analytics_daily and
 * analytics_landing_daily, plus one audit_log row per invocation. Touches no
 * patient data.
 *
 * Two reports:
 *   A. daily site totals            — dimensions [date]
 *   B. landing page × channel group — dimensions [date, landingPagePlusQueryString,
 *                                     sessionDefaultChannelGroup]
 *
 * Organic totals in analytics_daily are summed from report B rather than
 * fetched separately, so the two tables cannot disagree about what "organic"
 * means and we make one fewer API call.
 *
 * Metrics use current Google Analytics Data API names. `keyEvents` replaces the
 * deprecated `conversions`; `totalUsers` is the user count. If Google rejects a
 * metric name the run fails loudly rather than silently recording zeros.
 *
 * TIMEZONE: GA4 reports in the property's own timezone, which the API returns
 * in response metadata and which this function logs and echoes in its summary.
 * Search Console reports in America/Los_Angeles. Dates from each source are
 * stored verbatim and never converted, so the two calendars can differ by up to
 * one day - account for that when joining, rather than shifting either one.
 *
 * Auth: staff JWT or the internal cron token. verify_jwt stays true.
 *
 * Required secrets: GOOGLE_SERVICE_ACCOUNT_JSON, GA4_PROPERTY_ID,
 * REMINDER_INTERNAL_TOKEN.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken, logSyncRun } from "../_shared/google-auth.ts";
import { normalizeUrl } from "../_shared/url-normalize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const DEFAULT_WINDOW_DAYS = 7;
const ORGANIC_CHANNEL = "Organic Search";
const ROW_LIMIT = 100_000;

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface Ga4Row {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
}

interface Ga4Response {
  rows: Ga4Row[];
  timeZone: string | null;
  currencyCode: string | null;
}

/** GA4 returns dates as YYYYMMDD. */
function toIsoDate(compact: string): string {
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

const num = (v?: string) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

async function runReport(
  token: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<Ga4Response> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GA4 Data API ${res.status}: ${detail.slice(0, 400)}`);
  }

  const data = await res.json();
  return {
    rows: data.rows ?? [],
    timeZone: data.metadata?.timeZone ?? null,
    currencyCode: data.metadata?.currencyCode ?? null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = new Date().toISOString();

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return respond({ error: "Supabase credentials not configured" }, 500);
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // --- Authorisation (identical rule to gsc-sync) ---------------------------
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

  const propertyId = Deno.env.get("GA4_PROPERTY_ID");
  if (!propertyId) {
    return respond(
      {
        error: "GA4_PROPERTY_ID is not configured",
        hint:
          "GA4 Admin > Property Settings > Property ID. Digits only - this is " +
          'not the "G-" measurement id used by gtag.',
      },
      500,
    );
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const mode: string = body.mode ?? "sync";
    const windowDays = Number(body.windowDays) || DEFAULT_WINDOW_DAYS;
    const dateRanges = body.startDate && body.endDate
      ? [{ startDate: body.startDate, endDate: body.endDate }]
      : [{ startDate: `${windowDays}daysAgo`, endDate: "today" }];

    const token = await getGoogleAccessToken(SCOPE);

    // --- Connectivity probe: one tiny report, no writes --------------------
    if (mode === "probe") {
      const probe = await runReport(token, propertyId, {
        dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
        limit: 5,
      });
      const summary = {
        mode,
        startedAt,
        finishedAt: new Date().toISOString(),
        propertyId,
        accessible: true,
        rowsReturned: probe.rows.length,
        propertyTimeZone: probe.timeZone,
        currencyCode: probe.currencyCode,
        note:
          "GA4 dates are in the property timezone above; Search Console dates " +
          "are America/Los_Angeles. Stored verbatim, never converted.",
      };
      await logSyncRun(supabase, "ga4_sync_probe", summary);
      return respond(summary);
    }

    // --- Report B: landing page × channel group ----------------------------
    const landing = await runReport(token, propertyId, {
      dateRanges,
      dimensions: [
        { name: "date" },
        { name: "landingPagePlusQueryString" },
        { name: "sessionDefaultChannelGroup" },
      ],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "engagedSessions" },
        { name: "engagementRate" },
        { name: "keyEvents" },
      ],
      limit: ROW_LIMIT,
    });

    const landingRecords: Record<string, unknown>[] = [];
    // date -> organic sessions, summed from this same report so the two tables
    // cannot disagree about what "organic" means.
    const organicByDate = new Map<string, number>();
    const fetchedAt = new Date().toISOString();

    for (const row of landing.rows) {
      const dims = row.dimensionValues ?? [];
      const mets = row.metricValues ?? [];
      const compact = dims[0]?.value;
      if (!compact) continue;

      const date = toIsoDate(compact);
      const rawLanding = dims[1]?.value ?? "";
      const channel = dims[2]?.value || "(not set)";
      const { path } = normalizeUrl(rawLanding, "ihaveallergy.com");

      const sessions = num(mets[0]?.value);
      if (channel === ORGANIC_CHANNEL) {
        organicByDate.set(date, (organicByDate.get(date) ?? 0) + sessions);
      }

      landingRecords.push({
        date,
        landing_page_path: path,
        landing_page_url: rawLanding === "(not set)" ? "" : rawLanding,
        channel_group: channel,
        sessions,
        users: num(mets[1]?.value),
        engaged_sessions: num(mets[2]?.value),
        engagement_rate: Number(num(mets[3]?.value).toFixed(4)),
        key_events: num(mets[4]?.value),
        fetched_at: fetchedAt,
      });
    }

    // GA4 can return several raw landing paths that normalize to one page.
    // Collapse them so the upsert cannot fight itself over the primary key.
    const collapsed = new Map<string, Record<string, unknown>>();
    for (const rec of landingRecords) {
      const key = `${rec.date} ${rec.landing_page_path} ${rec.channel_group}`;
      const prev = collapsed.get(key);
      if (!prev) {
        collapsed.set(key, rec);
        continue;
      }
      const prevSessions = prev.sessions as number;
      const nextSessions = rec.sessions as number;
      const total = prevSessions + nextSessions;
      collapsed.set(key, {
        ...prev,
        sessions: total,
        users: (prev.users as number) + (rec.users as number),
        engaged_sessions:
          (prev.engaged_sessions as number) + (rec.engaged_sessions as number),
        key_events: (prev.key_events as number) + (rec.key_events as number),
        // Rate is a ratio, so it must be re-weighted by sessions, not added.
        engagement_rate: Number(
          (total > 0
            ? ((prev.engagement_rate as number) * prevSessions +
                (rec.engagement_rate as number) * nextSessions) /
              total
            : 0
          ).toFixed(4),
        ),
      });
    }
    const landingFinal = [...collapsed.values()];

    for (let i = 0; i < landingFinal.length; i += 500) {
      const { error } = await supabase
        .from("analytics_landing_daily")
        .upsert(landingFinal.slice(i, i + 500), {
          onConflict: "date,landing_page_path,channel_group",
        });
      if (error) throw new Error(`Landing upsert failed: ${error.message}`);
    }

    // --- Report A: daily site totals ---------------------------------------
    const totals = await runReport(token, propertyId, {
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "screenPageViews" },
        { name: "engagedSessions" },
        { name: "engagementRate" },
        { name: "keyEvents" },
      ],
      limit: 1000,
    });

    const dailyRecords = totals.rows
      .filter((r) => r.dimensionValues?.[0]?.value)
      .map((r) => {
        const date = toIsoDate(r.dimensionValues![0].value);
        const m = r.metricValues ?? [];
        return {
          date,
          sessions: num(m[0]?.value),
          users: num(m[1]?.value),
          pageviews: num(m[2]?.value),
          engaged_sessions: num(m[3]?.value),
          engagement_rate: Number(num(m[4]?.value).toFixed(4)),
          key_events: num(m[5]?.value),
          organic_sessions: organicByDate.get(date) ?? 0,
          fetched_at: fetchedAt,
        };
      });

    if (dailyRecords.length > 0) {
      const { error } = await supabase
        .from("analytics_daily")
        .upsert(dailyRecords, { onConflict: "date" });
      if (error) throw new Error(`Daily upsert failed: ${error.message}`);
    }

    const summary = {
      status: "ok",
      mode,
      startedAt,
      finishedAt: new Date().toISOString(),
      propertyId,
      propertyTimeZone: totals.timeZone ?? landing.timeZone,
      dateRanges,
      dailyRowsWritten: dailyRecords.length,
      landingRowsWritten: landingFinal.length,
      landingRowsBeforeNormalization: landingRecords.length,
      metricsUsed: [
        "sessions",
        "totalUsers",
        "screenPageViews",
        "engagedSessions",
        "engagementRate",
        "keyEvents",
      ],
    };

    await logSyncRun(supabase, "ga4_sync", summary);
    console.log(
      `[ga4-sync] ${dailyRecords.length} daily rows, ${landingFinal.length} landing rows, ` +
        `property timezone ${summary.propertyTimeZone}`,
    );
    return respond(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ga4-sync] Failed:", message);
    await logSyncRun(supabase, "ga4_sync", {
      status: "error",
      startedAt,
      finishedAt: new Date().toISOString(),
      error: message,
    });
    return respond({ error: message }, 500);
  }
});
