-- Stage 1A: real Search Console and GA4 data.
--
-- Additive only. Four new tables. No existing table, column, policy, function
-- or trigger is altered or dropped, and nothing touches clinic or patient data.
--
-- None of these tables holds patient data. All are staff-readable via RLS and
-- written only by edge functions holding the service role, which bypasses RLS -
-- so there is deliberately no INSERT/UPDATE/DELETE policy for any client role.
--
-- DATE SEMANTICS - read before writing any query that joins these tables:
--   * search_console_daily.date is Search Console's own reporting date, which
--     Google reports in America/Los_Angeles.
--   * analytics_daily.date and analytics_landing_daily.date are GA4's reporting
--     dates, in the GA4 property's configured timezone (Asia/Jerusalem).
--   Dates are stored verbatim from each source and are never converted. The two
--   calendars can therefore disagree by up to one day. Compare like-for-like
--   within a single source; when joining across sources, account for the skew
--   explicitly rather than assuming the dates line up.

-- ── Search Console ────────────────────────────────────────────────────────
-- One row per (property, date, normalized page path, query).
--
-- `property` is part of the key so the two Search Console properties -
-- ihaveallergy.com and seo.ihaveallergy.com - can never collide, and
-- `page_host` is stored separately so two hosts sharing a path stay distinct
-- records. `page_path` is the normalized form (decoded, NFC, no query string,
-- no trailing slash) so percent-encoded and decoded Hebrew URLs resolve to one
-- logical page instead of two.
--
-- `page_url` keeps a representative original URL exactly as Google returned it,
-- and `page_url_variants` counts how many distinct original forms collapsed
-- into the row, so encoding anomalies are auditable rather than invisible.

CREATE TABLE IF NOT EXISTS public.search_console_daily (
  property           text    NOT NULL,
  date               date    NOT NULL,
  page_path          text    NOT NULL,
  page_host          text    NOT NULL,
  page_url           text    NOT NULL,
  page_url_variants  smallint NOT NULL DEFAULT 1,
  query              text    NOT NULL,
  clicks             integer NOT NULL DEFAULT 0,
  impressions        integer NOT NULL DEFAULT 0,
  ctr                numeric(8,6) NOT NULL DEFAULT 0,
  position           numeric(6,2) NOT NULL DEFAULT 0,
  fetched_at         timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (property, date, page_path, query)
);

COMMENT ON TABLE public.search_console_daily IS
  'Daily Search Console rows per property, page and query. Written by the gsc-sync edge function. date is Search Console''s reporting date (America/Los_Angeles). Recent days are re-fetched because Search Console settles data late.';
COMMENT ON COLUMN public.search_console_daily.property IS
  'Verbatim Search Console property identifier, e.g. sc-domain:ihaveallergy.com.';
COMMENT ON COLUMN public.search_console_daily.page_path IS
  'Normalized path: percent-decoded, NFC, no query string or fragment, no trailing slash except root. Never lowercased.';
COMMENT ON COLUMN public.search_console_daily.page_url_variants IS
  'How many distinct original URL forms collapsed into this row. >1 means Google returned the same logical page under multiple encodings that day.';

CREATE INDEX IF NOT EXISTS idx_scd_property_path_date
  ON public.search_console_daily (property, page_path, date DESC);

CREATE INDEX IF NOT EXISTS idx_scd_property_query_date
  ON public.search_console_daily (property, query, date DESC);

-- Supports cross-host comparison of the same path (main vs seo subdomain).
CREATE INDEX IF NOT EXISTS idx_scd_path_host_date
  ON public.search_console_daily (page_path, page_host, date DESC);

-- Supports "high impressions" scans without a full table read.
CREATE INDEX IF NOT EXISTS idx_scd_date_impressions
  ON public.search_console_daily (date DESC, impressions DESC);

ALTER TABLE public.search_console_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view search console data"
  ON public.search_console_daily FOR SELECT
  USING (public.is_staff(auth.uid()));

-- ── Search Console ingestion cursor ───────────────────────────────────────
-- One row per (property, day). Makes a day-by-day backfill resumable: an
-- interrupted run restarts from the first day not marked 'ok' rather than
-- starting over, and any day can be reset to 'pending' to force a re-fetch.

CREATE TABLE IF NOT EXISTS public.gsc_sync_cursor (
  property      text    NOT NULL,
  date          date    NOT NULL,
  status        text    NOT NULL DEFAULT 'pending',
  rows_written  integer NOT NULL DEFAULT 0,
  attempts      integer NOT NULL DEFAULT 0,
  last_error    text,
  updated_at    timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (property, date),
  CONSTRAINT gsc_sync_cursor_status_check
    CHECK (status IN ('pending', 'ok', 'error'))
);

COMMENT ON TABLE public.gsc_sync_cursor IS
  'Per-property, per-day ingestion state for gsc-sync. Enables resumable backfill and forced re-fetch of days that settled late.';

CREATE INDEX IF NOT EXISTS idx_gsc_cursor_status
  ON public.gsc_sync_cursor (status, date DESC);

ALTER TABLE public.gsc_sync_cursor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view gsc sync cursor"
  ON public.gsc_sync_cursor FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_gsc_sync_cursor_updated_at
  BEFORE UPDATE ON public.gsc_sync_cursor
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ── GA4: daily site totals ────────────────────────────────────────────────
-- key_events, not the deprecated `conversions` metric.

CREATE TABLE IF NOT EXISTS public.analytics_daily (
  date              date PRIMARY KEY,
  sessions          integer NOT NULL DEFAULT 0,
  organic_sessions  integer NOT NULL DEFAULT 0,
  users             integer NOT NULL DEFAULT 0,
  pageviews         integer NOT NULL DEFAULT 0,
  engaged_sessions  integer NOT NULL DEFAULT 0,
  engagement_rate   numeric(6,4) NOT NULL DEFAULT 0,
  key_events        integer NOT NULL DEFAULT 0,
  fetched_at        timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.analytics_daily IS
  'Daily GA4 site totals. Written by the ga4-sync edge function. date is in the GA4 property timezone (Asia/Jerusalem), which may differ by a day from Search Console dates. Read by the admin dashboard; when empty the dashboard shows "no data available" rather than an estimate.';
COMMENT ON COLUMN public.analytics_daily.organic_sessions IS
  'Sessions whose sessionDefaultChannelGroup is Organic Search, summed from the landing-page report.';

ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view analytics data"
  ON public.analytics_daily FOR SELECT
  USING (public.is_staff(auth.uid()));

-- ── GA4: landing page × channel ───────────────────────────────────────────
-- Channel group is part of the key rather than a separate organic column, so
-- organic is a filter (channel_group = 'Organic Search') and every other
-- channel stays available for context at no extra storage cost.

CREATE TABLE IF NOT EXISTS public.analytics_landing_daily (
  date               date    NOT NULL,
  landing_page_path  text    NOT NULL,
  landing_page_url   text    NOT NULL DEFAULT '',
  channel_group      text    NOT NULL,
  sessions           integer NOT NULL DEFAULT 0,
  users              integer NOT NULL DEFAULT 0,
  engaged_sessions   integer NOT NULL DEFAULT 0,
  engagement_rate    numeric(6,4) NOT NULL DEFAULT 0,
  key_events         integer NOT NULL DEFAULT 0,
  fetched_at         timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (date, landing_page_path, channel_group)
);

COMMENT ON TABLE public.analytics_landing_daily IS
  'Daily GA4 sessions by landing page and default channel group. landing_page_path is normalized with the same rules as search_console_daily.page_path so the two can be joined on path.';
COMMENT ON COLUMN public.analytics_landing_daily.landing_page_url IS
  'Landing page exactly as GA4 returned it, including any query string. Empty when GA4 reports (not set).';

CREATE INDEX IF NOT EXISTS idx_ald_path_date
  ON public.analytics_landing_daily (landing_page_path, date DESC);

CREATE INDEX IF NOT EXISTS idx_ald_channel_date
  ON public.analytics_landing_daily (channel_group, date DESC);

ALTER TABLE public.analytics_landing_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view landing page analytics"
  ON public.analytics_landing_daily FOR SELECT
  USING (public.is_staff(auth.uid()));
