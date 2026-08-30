-- Stage 1: real search and analytics data.
--
-- Additive only. No existing table, column, policy or function is altered or
-- dropped. Two new tables; sync-run health is recorded in the existing
-- audit_log rather than in a third table.
--
-- Neither table holds patient data. Both are staff-readable and written only
-- by edge functions using the service role, which bypasses RLS - so there is
-- deliberately no INSERT/UPDATE policy for any client role.

-- ── Search Console ────────────────────────────────────────────────────────
-- One row per (date, page, query), which is the grain the Search Console API
-- returns and the grain opportunity detection needs: CTR against position for
-- a given query on a given page, tracked over time.

CREATE TABLE IF NOT EXISTS public.search_console_daily (
  date          date    NOT NULL,
  page          text    NOT NULL,
  query         text    NOT NULL,
  clicks        integer NOT NULL DEFAULT 0,
  impressions   integer NOT NULL DEFAULT 0,
  ctr           numeric(8,6) NOT NULL DEFAULT 0,
  position      numeric(6,2) NOT NULL DEFAULT 0,
  fetched_at    timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (date, page, query)
);

COMMENT ON TABLE public.search_console_daily IS
  'Daily Search Console rows, one per page+query. Written by the gsc-sync edge function. Search Console finalises data 2-3 days late, so recent dates are re-fetched and upserted.';

CREATE INDEX IF NOT EXISTS idx_search_console_daily_page_date
  ON public.search_console_daily (page, date DESC);

CREATE INDEX IF NOT EXISTS idx_search_console_daily_query_date
  ON public.search_console_daily (query, date DESC);

-- Supports "high impressions, low CTR" and "position 4-15" scans directly.
CREATE INDEX IF NOT EXISTS idx_search_console_daily_date_impressions
  ON public.search_console_daily (date DESC, impressions DESC);

ALTER TABLE public.search_console_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view search console data"
  ON public.search_console_daily FOR SELECT
  USING (public.is_staff(auth.uid()));

-- ── GA4 ───────────────────────────────────────────────────────────────────
-- Daily site totals only. Landing-page granularity is deliberately not added
-- here: nothing consumes it yet, and the opportunity engine that will consume
-- it is a later stage. One row per day keeps this honest and small.

CREATE TABLE IF NOT EXISTS public.analytics_daily (
  date              date PRIMARY KEY,
  sessions          integer NOT NULL DEFAULT 0,
  organic_sessions  integer NOT NULL DEFAULT 0,
  pageviews         integer NOT NULL DEFAULT 0,
  engaged_sessions  integer NOT NULL DEFAULT 0,
  conversions       integer NOT NULL DEFAULT 0,
  fetched_at        timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.analytics_daily IS
  'Daily GA4 totals. Written by the ga4-sync edge function. Read by the admin dashboard; when empty the dashboard shows "no data available" rather than an estimate.';

ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view analytics data"
  ON public.analytics_daily FOR SELECT
  USING (public.is_staff(auth.uid()));
