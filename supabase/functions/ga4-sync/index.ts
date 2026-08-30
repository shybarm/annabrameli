/**
 * ga4-sync — pull daily GA4 totals into analytics_daily.
 *
 * Read-only against Google. Writes only to analytics_daily and one audit_log
 * row per run. Touches no patient data.
 *
 * GA4 collection already runs client-side (gtag, G-671NNHCM9J). This function
 * reads the aggregated results back so the admin dashboard can show real
 * numbers instead of the invented ones it used to display.
 *
 * Auth: staff JWT or the internal cron token. Not public.
 *
 * Required secrets:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  service account key JSON (same one as gsc-sync)
 *   GA4_PROPERTY_ID              numeric property id, digits only
 *   REMINDER_INTERNAL_TOKEN      reused as the cron token (already configured)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken, logSyncRun } from "../_shared/google-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const DEFAULT_WINDOW_DAYS = 7;

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

/** GA4 returns dates as YYYYMMDD. */
function toIsoDate(compact: string): string {
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

async function runReport(
  token: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<Ga4Row[]> {
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
  return data.rows ?? [];
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

  // --- Authorisation (same rule as gsc-sync) -------------------------------
  const cronToken = Deno.env.get("REMINDER_INTERNAL_TOKEN");
  const providedToken = req.headers.get("x-internal-token");
  let authorised = Boolean(cronToken && providedToken && providedToken === cronToken);

  if (!authorised) {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
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

  const startedAt = new Date().toISOString();

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const windowDays = Number(body.windowDays) || DEFAULT_WINDOW_DAYS;
    const dateRanges = [{ startDate: `${windowDays}daysAgo`, endDate: "today" }];

    const token = await getGoogleAccessToken(SCOPE);

    // Totals per day.
    const totals = await runReport(token, propertyId, {
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "engagedSessions" },
        { name: "conversions" },
      ],
    });

    // Organic sessions per day, as a separate report filtered to organic search.
    const organic = await runReport(token, propertyId, {
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }],
      dimensionFilter: {
        filter: {
          fieldName: "sessionDefaultChannelGroup",
          stringFilter: { value: "Organic Search", matchType: "EXACT" },
        },
      },
    });

    const organicByDate = new Map<string, number>();
    for (const row of organic) {
      const date = row.dimensionValues?.[0]?.value;
      if (date) organicByDate.set(date, Number(row.metricValues?.[0]?.value ?? 0));
    }

    const records = totals
      .filter((row) => row.dimensionValues?.[0]?.value)
      .map((row) => {
        const compact = row.dimensionValues![0].value;
        const m = row.metricValues ?? [];
        return {
          date: toIsoDate(compact),
          sessions: Number(m[0]?.value ?? 0),
          pageviews: Number(m[1]?.value ?? 0),
          engaged_sessions: Number(m[2]?.value ?? 0),
          conversions: Number(m[3]?.value ?? 0),
          organic_sessions: organicByDate.get(compact) ?? 0,
          fetched_at: new Date().toISOString(),
        };
      });

    if (records.length > 0) {
      const { error } = await supabase
        .from("analytics_daily")
        .upsert(records, { onConflict: "date" });
      if (error) throw new Error(`Upsert failed: ${error.message}`);
    }

    const summary = {
      status: "ok",
      startedAt,
      finishedAt: new Date().toISOString(),
      propertyId,
      windowDays,
      rowsWritten: records.length,
    };
    await logSyncRun(supabase, "ga4_sync", summary);
    console.log(`[ga4-sync] Wrote ${records.length} rows`);

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
