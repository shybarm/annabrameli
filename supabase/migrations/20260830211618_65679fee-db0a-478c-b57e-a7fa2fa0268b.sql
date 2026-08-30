-- 1. Canonical, deduplicated Search Console view -----------------------------
-- WHY THIS EXISTS:
-- We ingest two Search Console properties: sc-domain:ihaveallergy.com (which
-- also reports rows for its subdomains) and sc-domain:seo.ihaveallergy.com.
-- The same (date, page_host, page_path, query) can therefore legitimately be
-- reported by BOTH properties. Raw rows are kept per-property in
-- search_console_daily (property is part of the primary key) and must never be
-- summed across properties: that would double-count clicks and impressions.
-- This view picks exactly ONE row per (date, page_host, page_path, query),
-- preferring the property whose domain most specifically matches page_host,
-- and exposes source_property so every number can be audited back to its raw row.
CREATE OR REPLACE VIEW public.search_console_canonical
WITH (security_invoker = on) AS
WITH normalised AS (
  SELECT
    d.*,
    rtrim(regexp_replace(d.property, '^(sc-domain:|https?://)', ''), '/') AS property_domain
  FROM public.search_console_daily d
), ranked AS (
  SELECT
    n.*,
    row_number() OVER (
      PARTITION BY n.date, n.page_host, n.page_path, n.query
      ORDER BY
        CASE
          WHEN n.page_host = n.property_domain THEN 0                    -- exact property for this host
          WHEN n.page_host LIKE '%.' || n.property_domain THEN 1         -- parent domain property
          ELSE 2                                                          -- unrelated (should not happen)
        END,
        length(n.property_domain) DESC,                                   -- more specific domain wins
        n.property                                                        -- final deterministic tiebreak
    ) AS pick_rank
  FROM normalised n
)
SELECT
  date,
  page_host,
  page_path,
  page_url,
  query,
  clicks,
  impressions,
  ctr,
  position,
  property        AS source_property,
  property_domain AS source_property_domain,
  fetched_at
FROM ranked
WHERE pick_rank = 1;

COMMENT ON VIEW public.search_console_canonical IS
  'Read-only deduplicated Search Console rows: exactly one row per (date, page_host, page_path, query). '
  'Needed because the main sc-domain:ihaveallergy.com property also reports subdomain rows that the '
  'dedicated sc-domain:seo.ihaveallergy.com property reports too. The most host-specific property wins; '
  'duplicate property rows are never summed. source_property preserves the winning property for auditing. '
  'Raw per-property data stays in public.search_console_daily. Inherits staff-only RLS via security_invoker.';

GRANT SELECT ON public.search_console_canonical TO authenticated;
GRANT SELECT ON public.search_console_canonical TO service_role;

-- 2. Daily incremental syncs ---------------------------------------------------
-- gsc-sync "recent" mode re-fetches the last few settled reporting days and
-- upserts on the full primary key, so re-runs are idempotent and no backfill is
-- repeated. ga4-sync re-reads the last 3 complete property-timezone days
-- (Asia/Jerusalem) so late attribution can settle.
SELECT cron.unschedule('gsc-sync-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gsc-sync-daily');
SELECT cron.unschedule('ga4-sync-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ga4-sync-daily');

SELECT cron.schedule(
  'gsc-sync-daily',
  '20 4 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://ftatmcyrmeyhghgckvbj.supabase.co/functions/v1/gsc-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key')
    ),
    body := '{"mode":"recent"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $cron$
);

SELECT cron.schedule(
  'ga4-sync-daily',
  '40 4 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://ftatmcyrmeyhghgckvbj.supabase.co/functions/v1/ga4-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key')
    ),
    body := '{"mode":"sync","startDate":"3daysAgo","endDate":"yesterday"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $cron$
);