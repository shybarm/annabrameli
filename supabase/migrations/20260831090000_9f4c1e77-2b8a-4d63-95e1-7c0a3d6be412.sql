-- Stage 1A completeness fix: page-grain and property-totals Search Console data.
--
-- Additive only. Two new tables, one new cursor table, one new view. Nothing
-- existing is altered or dropped: search_console_daily, its primary key, its
-- historical query-grain rows, gsc_sync_cursor and search_console_canonical are
-- all untouched.
--
-- ══════════════════════════════════════════════════════════════════════════
-- WHY THIS EXISTS — Search Console query suppression
-- ══════════════════════════════════════════════════════════════════════════
-- Google anonymises rare queries. The more dimensions a request carries, the
-- more rows fall below that threshold and vanish. Measured directly against
-- the API for this property (1–28 August 2026):
--
--     dimensions []               29 clicks /  526 impressions   ← site truth
--     dimensions [page]           32 clicks /  688 impressions   ← page truth
--     dimensions [page, query]     1 click  /  150 impressions   ← discovery only
--
-- Query-grain data therefore captures roughly 3% of clicks and 28% of
-- impressions. It is excellent for learning WHICH queries reach a page, and
-- actively wrong as a measure of HOW MUCH traffic anything receives.
--
-- Hence three separate grains, each fetched from Google directly and never
-- derived from another:
--
--   search_console_totals_daily   traffic / site truth
--   search_console_page_daily     page performance truth
--   search_console_daily          query discovery and intent (existing)
--
-- ══════════════════════════════════════════════════════════════════════════
-- WHY WE NEVER SUM PROPERTIES
-- ══════════════════════════════════════════════════════════════════════════
-- sc-domain:ihaveallergy.com already includes traffic to its subdomains,
-- seo.ihaveallergy.com among them. Adding the two properties together
-- double-counts the subdomain. So:
--
--   * whole-domain reporting  → sc-domain:ihaveallergy.com is authoritative
--     and already complete on its own.
--   * seo subdomain in isolation → sc-domain:seo.ihaveallergy.com.
--
-- Per-property rows are stored raw and are never combined. The canonical views
-- pick ONE property per key rather than aggregating across them.

-- ── Page grain ────────────────────────────────────────────────────────────
-- Fetched with dimensions ["page"]. This is the correct source for
-- per-page clicks, impressions, CTR and position.

CREATE TABLE IF NOT EXISTS public.search_console_page_daily (
  property           text     NOT NULL,
  date               date     NOT NULL,
  page_host          text     NOT NULL,
  page_path          text     NOT NULL,
  page_url           text     NOT NULL,
  page_url_variants  smallint NOT NULL DEFAULT 1,
  clicks             integer  NOT NULL DEFAULT 0,
  impressions        integer  NOT NULL DEFAULT 0,
  ctr                numeric(8,6) NOT NULL DEFAULT 0,
  position           numeric(6,2) NOT NULL DEFAULT 0,
  fetched_at         timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (property, date, page_host, page_path)
);

COMMENT ON TABLE public.search_console_page_daily IS
  'Daily Search Console rows per property and page, fetched with dimensions ["page"]. '
  'THIS IS THE SOURCE OF TRUTH FOR PAGE PERFORMANCE. Do not compute page totals by '
  'summing search_console_daily: query-grain rows are heavily suppressed by Google''s '
  'anonymisation of rare queries and understate clicks by roughly 30x on this property. '
  'date is Search Console''s reporting date (America/Los_Angeles). Per-property rows are '
  'raw and must never be summed across properties - use search_console_page_canonical.';

CREATE INDEX IF NOT EXISTS idx_scpd_property_path_date
  ON public.search_console_page_daily (property, page_path, date DESC);
CREATE INDEX IF NOT EXISTS idx_scpd_path_host_date
  ON public.search_console_page_daily (page_path, page_host, date DESC);
CREATE INDEX IF NOT EXISTS idx_scpd_date_impressions
  ON public.search_console_page_daily (date DESC, impressions DESC);

GRANT SELECT ON public.search_console_page_daily TO authenticated;
GRANT ALL    ON public.search_console_page_daily TO service_role;

ALTER TABLE public.search_console_page_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view search console page data"
  ON public.search_console_page_daily FOR SELECT
  USING (public.is_staff(auth.uid()));

-- ── Property totals grain ─────────────────────────────────────────────────
-- Fetched with NO dimensions, so Google returns the property's own daily
-- totals with nothing suppressed.

CREATE TABLE IF NOT EXISTS public.search_console_totals_daily (
  property     text    NOT NULL,
  date         date    NOT NULL,
  clicks       integer NOT NULL DEFAULT 0,
  impressions  integer NOT NULL DEFAULT 0,
  ctr          numeric(8,6) NOT NULL DEFAULT 0,
  position     numeric(6,2) NOT NULL DEFAULT 0,
  fetched_at   timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (property, date)
);

COMMENT ON TABLE public.search_console_totals_daily IS
  'Daily Search Console property totals, fetched with no dimensions. THIS IS THE SOURCE '
  'OF TRUTH FOR SITE TRAFFIC. Values come straight from Google and are never derived by '
  'summing page or query rows - both of those are suppressed and would understate totals. '
  'Never add the two properties together: sc-domain:ihaveallergy.com already includes '
  'seo.ihaveallergy.com, so summing double-counts the subdomain. Use the main property '
  'for whole-domain reporting and the seo property for the subdomain in isolation. '
  'date is Search Console''s reporting date (America/Los_Angeles).';

CREATE INDEX IF NOT EXISTS idx_sctd_date
  ON public.search_console_totals_daily (date DESC);

GRANT SELECT ON public.search_console_totals_daily TO authenticated;
GRANT ALL    ON public.search_console_totals_daily TO service_role;

ALTER TABLE public.search_console_totals_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view search console totals"
  ON public.search_console_totals_daily FOR SELECT
  USING (public.is_staff(auth.uid()));

-- ── Per-dataset ingestion cursor ──────────────────────────────────────────
-- The existing gsc_sync_cursor tracks the query grain and is deliberately left
-- alone. This table tracks the new grains independently, so a failure at one
-- grain is visible on its own and cannot make the others look current.

CREATE TABLE IF NOT EXISTS public.gsc_dataset_sync_cursor (
  property      text    NOT NULL,
  dataset       text    NOT NULL,
  date          date    NOT NULL,
  status        text    NOT NULL DEFAULT 'pending',
  rows_written  integer NOT NULL DEFAULT 0,
  attempts      integer NOT NULL DEFAULT 0,
  last_error    text,
  updated_at    timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (property, dataset, date),
  CONSTRAINT gsc_dataset_cursor_status_check
    CHECK (status IN ('pending', 'ok', 'error')),
  CONSTRAINT gsc_dataset_cursor_dataset_check
    CHECK (dataset IN ('page', 'totals'))
);

COMMENT ON TABLE public.gsc_dataset_sync_cursor IS
  'Per-property, per-dataset, per-day ingestion state for the page and totals grains. '
  'Separate from gsc_sync_cursor (query grain) so each grain''s completeness is tracked '
  'and observable independently - one grain failing must never make another appear current.';

CREATE INDEX IF NOT EXISTS idx_gsc_dataset_cursor_status
  ON public.gsc_dataset_sync_cursor (dataset, status, date DESC);

GRANT SELECT ON public.gsc_dataset_sync_cursor TO authenticated;
GRANT ALL    ON public.gsc_dataset_sync_cursor TO service_role;

ALTER TABLE public.gsc_dataset_sync_cursor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view gsc dataset sync cursor"
  ON public.gsc_dataset_sync_cursor FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_gsc_dataset_sync_cursor_updated_at
  BEFORE UPDATE ON public.gsc_dataset_sync_cursor
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ── Canonical page view ───────────────────────────────────────────────────
-- Exactly one row per (date, page_host, page_path), using the SAME property
-- preference logic as public.search_console_canonical: the property whose
-- domain most specifically matches page_host wins. Overlapping properties are
-- never summed; the losing row is dropped, not added.

CREATE OR REPLACE VIEW public.search_console_page_canonical
WITH (security_invoker = on) AS
WITH normalised AS (
  SELECT
    d.*,
    rtrim(regexp_replace(d.property, '^(sc-domain:|https?://)', ''), '/') AS property_domain
  FROM public.search_console_page_daily d
), ranked AS (
  SELECT
    n.*,
    row_number() OVER (
      PARTITION BY n.date, n.page_host, n.page_path
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
  page_url_variants,
  clicks,
  impressions,
  ctr,
  position,
  property        AS source_property,
  property_domain AS source_property_domain,
  fetched_at
FROM ranked
WHERE pick_rank = 1;

COMMENT ON VIEW public.search_console_page_canonical IS
  'Read-only deduplicated page-grain rows: exactly one row per (date, page_host, page_path). '
  'THIS IS THE SOURCE OF TRUTH FOR PAGE PERFORMANCE. Uses the same property preference logic as '
  'search_console_canonical - the most host-specific property wins and overlapping properties are '
  'never summed, because sc-domain:ihaveallergy.com already reports subdomain rows that '
  'sc-domain:seo.ihaveallergy.com also reports. source_property preserves the winning property for '
  'auditing. Inherits staff-only RLS via security_invoker.';

GRANT SELECT ON public.search_console_page_canonical TO authenticated;
GRANT SELECT ON public.search_console_page_canonical TO service_role;
