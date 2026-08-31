-- Stage 1B: windowing layer for the Organic Opportunities engine.
--
-- Additive and read-only: functions and nothing else. No table is created,
-- altered or dropped, no raw data is written, and every function reads through
-- the Stage 1A canonical views, so staff-only RLS applies unchanged
-- (SECURITY INVOKER is the default and is what we want here).
--
-- WHY SQL AND NOT THE CLIENT:
-- Windowing must be identical everywhere it is used, and it is cheap to do
-- next to the data. Signal detection and scoring deliberately live in one
-- TypeScript module instead (src/lib/geo/opportunity-engine.ts), because they
-- need to be unit-testable without a database and must not be duplicated.
--
-- DATA CONTRACT (see docs/growth/search-console-data-contract.md):
--   site traffic     -> search_console_totals_daily        (never summed from below)
--   page performance -> search_console_page_canonical      (never summed from queries)
--   query discovery  -> search_console_canonical           (suppressed; intent only)
-- Query-grain clicks and impressions must never be presented as page or site
-- traffic. These functions keep the grains in separate entry points so the two
-- cannot be confused by accident.
--
-- WHY THE OUTPUT COLUMN IS CALLED avg_position:
-- POSITION is a col_name_keyword in PostgreSQL. It is legal as a table column
-- name (ColId), which is why the Stage 1A raw column is still `position`, but
-- it is NOT legal as a function parameter name (type_function_name) - and a
-- RETURNS TABLE column IS a parameter name. `position numeric` inside RETURNS
-- TABLE is a hard syntax error (42601), so every windowing function exposes the
-- impression-weighted average as `avg_position` instead. The name is also more
-- honest: these are weighted averages over a window, not a rank.
-- The Stage 1A `position` column is deliberately untouched.
--
-- Unqualified column references are avoided throughout. RETURNS TABLE columns
-- are OUT parameters and are in scope inside the body, so a bare `clicks` or
-- `property` reads as a name that could resolve two ways. Qualifying every
-- reference keeps resolution unambiguous and independent of server version.

-- ── Helper: the last reporting day we actually hold ───────────────────────
-- Search Console days are whole days by construction, so "complete" simply
-- means "present". Never assume today exists: Google lags ~2 days.
CREATE OR REPLACE FUNCTION public.geo_latest_page_date(p_host text)
RETURNS date
LANGUAGE sql
STABLE
AS $$
  SELECT max(c.date)
  FROM public.search_console_page_canonical c
  WHERE c.page_host = p_host;
$$;

COMMENT ON FUNCTION public.geo_latest_page_date(text) IS
  'Most recent Search Console reporting day held for a host. Used as the default window end so partial or missing days are never compared. Returns NULL when the host has no rows at all, which makes every window empty rather than silently comparing against today.';

-- ── Page performance windows ──────────────────────────────────────────────
-- Current window vs the immediately preceding window of equal length, so
-- trends compare like with like.
CREATE OR REPLACE FUNCTION public.geo_page_window(
  p_host        text DEFAULT 'ihaveallergy.com',
  p_window_days int  DEFAULT 28,
  p_end_date    date DEFAULT NULL
)
RETURNS TABLE (
  page_host        text,
  page_path        text,
  page_url         text,
  clicks           bigint,
  impressions      bigint,
  ctr              numeric,
  avg_position     numeric,
  days_with_data   bigint,
  prev_clicks      bigint,
  prev_impressions bigint,
  prev_ctr         numeric,
  prev_avg_position numeric,
  prev_days        bigint,
  first_seen       date,
  last_seen        date,
  source_property  text
)
LANGUAGE sql
STABLE
AS $$
  WITH bounds AS (
    SELECT
      COALESCE(p_end_date, public.geo_latest_page_date(p_host))                     AS end_d,
      COALESCE(p_end_date, public.geo_latest_page_date(p_host)) - (p_window_days-1) AS start_d,
      COALESCE(p_end_date, public.geo_latest_page_date(p_host)) - p_window_days     AS prev_end_d,
      COALESCE(p_end_date, public.geo_latest_page_date(p_host)) - (2*p_window_days-1) AS prev_start_d
  ),
  scoped AS (
    SELECT c.*
    FROM public.search_console_page_canonical c, bounds b
    WHERE c.page_host = p_host
      AND c.date BETWEEN b.prev_start_d AND b.end_d
  ),
  cur AS (
    SELECT
      s.page_path AS page_path,
      sum(s.clicks)::bigint      AS clicks,
      sum(s.impressions)::bigint AS impressions,
      -- Impression-weighted, never a mean of daily averages.
      CASE WHEN sum(s.impressions) > 0
           THEN round(sum(s.position * s.impressions) / sum(s.impressions), 2)
           ELSE round(avg(s.position), 2) END AS avg_position,
      count(DISTINCT s.date)::bigint AS days_with_data,
      max(s.page_url)  AS page_url,
      max(s.source_property) AS source_property
    FROM scoped s, bounds b
    WHERE s.date BETWEEN b.start_d AND b.end_d
    GROUP BY s.page_path
  ),
  prev AS (
    SELECT
      s.page_path AS page_path,
      sum(s.clicks)::bigint      AS clicks,
      sum(s.impressions)::bigint AS impressions,
      CASE WHEN sum(s.impressions) > 0
           THEN round(sum(s.position * s.impressions) / sum(s.impressions), 2)
           ELSE round(avg(s.position), 2) END AS avg_position,
      count(DISTINCT s.date)::bigint AS days
    FROM scoped s, bounds b
    WHERE s.date BETWEEN b.prev_start_d AND b.prev_end_d
    GROUP BY s.page_path
  ),
  seen AS (
    -- Lifetime bounds, not window bounds: "first ever seen" is what tells us a
    -- page is genuinely new rather than merely absent from the previous window.
    SELECT c.page_path AS page_path,
           min(c.date) AS first_seen,
           max(c.date) AS last_seen
    FROM public.search_console_page_canonical c
    WHERE c.page_host = p_host
    GROUP BY c.page_path
  )
  SELECT
    p_host,
    COALESCE(cur.page_path, prev.page_path),
    COALESCE(cur.page_url, ''),
    COALESCE(cur.clicks, 0::bigint),
    COALESCE(cur.impressions, 0::bigint),
    CASE WHEN COALESCE(cur.impressions, 0::bigint) > 0
         THEN round(cur.clicks::numeric / cur.impressions, 6) ELSE 0::numeric END,
    COALESCE(cur.avg_position, 0::numeric),
    COALESCE(cur.days_with_data, 0::bigint),
    COALESCE(prev.clicks, 0::bigint),
    COALESCE(prev.impressions, 0::bigint),
    CASE WHEN COALESCE(prev.impressions, 0::bigint) > 0
         THEN round(prev.clicks::numeric / prev.impressions, 6) ELSE 0::numeric END,
    COALESCE(prev.avg_position, 0::numeric),
    COALESCE(prev.days, 0::bigint),
    seen.first_seen,
    seen.last_seen,
    COALESCE(cur.source_property, '')
  FROM cur
  FULL OUTER JOIN prev ON prev.page_path = cur.page_path
  LEFT JOIN seen ON seen.page_path = COALESCE(cur.page_path, prev.page_path);
$$;

COMMENT ON FUNCTION public.geo_page_window(text, int, date) IS
  'Page-grain performance for a window and the preceding window of equal length. Reads search_console_page_canonical - the page-performance source of truth. avg_position and prev_avg_position are impression-weighted averages over the window, not ranks. Never derive these numbers from query-grain rows: Google suppresses anonymised queries and the query grain understates clicks by roughly 30x on this property.';

-- ── Property totals windows ───────────────────────────────────────────────
-- Straight from Google's undimensioned response. One property at a time: the
-- main sc-domain property already includes its subdomains, so summing the two
-- properties would double-count seo.ihaveallergy.com.
CREATE OR REPLACE FUNCTION public.geo_totals_window(
  p_property    text DEFAULT 'sc-domain:ihaveallergy.com',
  p_window_days int  DEFAULT 28,
  p_end_date    date DEFAULT NULL
)
RETURNS TABLE (
  property         text,
  clicks           bigint,
  impressions      bigint,
  ctr              numeric,
  avg_position     numeric,
  days_with_data   bigint,
  prev_clicks      bigint,
  prev_impressions bigint,
  prev_days        bigint,
  window_start     date,
  window_end       date
)
LANGUAGE sql
STABLE
AS $$
  WITH bounds AS (
    SELECT
      COALESCE(
        p_end_date,
        (SELECT max(m.date)
         FROM public.search_console_totals_daily m
         WHERE m.property = p_property)
      ) AS end_d
  ),
  b2 AS (
    SELECT bounds.end_d                          AS end_d,
           bounds.end_d - (p_window_days-1)      AS start_d,
           bounds.end_d - p_window_days          AS prev_end_d,
           bounds.end_d - (2*p_window_days-1)    AS prev_start_d
    FROM bounds
  ),
  cur AS (
    SELECT sum(t.clicks)::bigint      AS c,
           sum(t.impressions)::bigint AS i,
           CASE WHEN sum(t.impressions) > 0
                THEN round(sum(t.position * t.impressions) / sum(t.impressions), 2)
                ELSE 0::numeric END   AS pos,
           count(*)::bigint           AS d
    FROM public.search_console_totals_daily t, b2
    WHERE t.property = p_property
      AND t.date BETWEEN b2.start_d AND b2.end_d
  ),
  prev AS (
    SELECT sum(t.clicks)::bigint      AS c,
           sum(t.impressions)::bigint AS i,
           count(*)::bigint           AS d
    FROM public.search_console_totals_daily t, b2
    WHERE t.property = p_property
      AND t.date BETWEEN b2.prev_start_d AND b2.prev_end_d
  )
  SELECT p_property,
         COALESCE(cur.c, 0::bigint),
         COALESCE(cur.i, 0::bigint),
         CASE WHEN COALESCE(cur.i, 0::bigint) > 0
              THEN round(cur.c::numeric / cur.i, 6) ELSE 0::numeric END,
         COALESCE(cur.pos, 0::numeric),
         COALESCE(cur.d, 0::bigint),
         COALESCE(prev.c, 0::bigint),
         COALESCE(prev.i, 0::bigint),
         COALESCE(prev.d, 0::bigint),
         b2.start_d,
         b2.end_d
  FROM cur, prev, b2;
$$;

COMMENT ON FUNCTION public.geo_totals_window(text, int, date) IS
  'Site traffic truth for one property over a window. Values come from Google''s undimensioned response and are never derived by summing page or query rows. avg_position is the impression-weighted average over the window. Never call this for two properties and add the results: sc-domain:ihaveallergy.com already includes seo.ihaveallergy.com.';

-- ── Query discovery windows ───────────────────────────────────────────────
-- INTENT ONLY. These clicks and impressions are suppressed and must never be
-- shown as page or site traffic.
CREATE OR REPLACE FUNCTION public.geo_query_window(
  p_host           text DEFAULT 'ihaveallergy.com',
  p_window_days    int  DEFAULT 28,
  p_end_date       date DEFAULT NULL,
  p_min_impressions int DEFAULT 1
)
RETURNS TABLE (
  page_path    text,
  query        text,
  clicks       bigint,
  impressions  bigint,
  avg_position numeric
)
LANGUAGE sql
STABLE
AS $$
  WITH b AS (
    SELECT
      COALESCE(p_end_date, public.geo_latest_page_date(p_host))                       AS end_d,
      COALESCE(p_end_date, public.geo_latest_page_date(p_host)) - (p_window_days-1)   AS start_d
  )
  SELECT
    c.page_path,
    c.query,
    sum(c.clicks)::bigint,
    sum(c.impressions)::bigint,
    CASE WHEN sum(c.impressions) > 0
         THEN round(sum(c.position * c.impressions) / sum(c.impressions), 2)
         ELSE round(avg(c.position), 2) END
  FROM public.search_console_canonical c, b
  WHERE c.page_host = p_host
    AND c.date BETWEEN b.start_d AND b.end_d
  GROUP BY c.page_path, c.query
  HAVING sum(c.impressions) >= p_min_impressions;
$$;

COMMENT ON FUNCTION public.geo_query_window(text, int, date, int) IS
  'Known queries per page for a window. DISCOVERY AND INTENT ONLY. Google anonymises rare queries, so these totals capture a fraction of real demand (~3% of clicks on this property) and must never be used as page or site traffic. avg_position is the impression-weighted average over the window.';

-- ── Observed CTR by position ──────────────────────────────────────────────
-- Feeds the site-specific expected-CTR curve. Returning raw buckets rather
-- than a fitted curve keeps the assumption visible and auditable in one place.
CREATE OR REPLACE FUNCTION public.geo_ctr_curve(
  p_host        text DEFAULT 'ihaveallergy.com',
  p_window_days int  DEFAULT 90,
  p_end_date    date DEFAULT NULL
)
RETURNS TABLE (
  position_bucket int,
  clicks          bigint,
  impressions     bigint,
  observations    bigint
)
LANGUAGE sql
STABLE
AS $$
  WITH b AS (
    SELECT
      COALESCE(p_end_date, public.geo_latest_page_date(p_host))                     AS end_d,
      COALESCE(p_end_date, public.geo_latest_page_date(p_host)) - (p_window_days-1) AS start_d
  )
  SELECT
    LEAST(GREATEST(round(c.position)::int, 1), 21) AS position_bucket,
    sum(c.clicks)::bigint,
    sum(c.impressions)::bigint,
    count(*)::bigint
  FROM public.search_console_page_canonical c, b
  WHERE c.page_host = p_host
    AND c.date BETWEEN b.start_d AND b.end_d
    AND c.impressions > 0
  GROUP BY LEAST(GREATEST(round(c.position)::int, 1), 21);
$$;

COMMENT ON FUNCTION public.geo_ctr_curve(text, int, date) IS
  'Observed clicks and impressions bucketed by rounded average position, from page-grain data. The engine builds a site-specific expected-CTR curve from this where the sample is large enough and falls back to a documented conservative curve otherwise. Bucket 21 collects everything at position 21 or worse.';

-- ── GA4 landing-page windows ──────────────────────────────────────────────
-- Corroboration only. GA4 landing paths carry no host, so these can only be
-- attributed to the primary host - see the engine for how that is handled.
CREATE OR REPLACE FUNCTION public.geo_ga4_page_window(
  p_window_days int  DEFAULT 28,
  p_end_date    date DEFAULT NULL,
  p_channel     text DEFAULT 'Organic Search'
)
RETURNS TABLE (
  landing_page_path text,
  sessions          bigint,
  users             bigint,
  engaged_sessions  bigint,
  engagement_rate   numeric,
  key_events        bigint,
  days_with_data    bigint
)
LANGUAGE sql
STABLE
AS $$
  WITH b AS (
    SELECT
      COALESCE(p_end_date, (SELECT max(m.date) FROM public.analytics_landing_daily m))                     AS end_d,
      COALESCE(p_end_date, (SELECT max(m.date) FROM public.analytics_landing_daily m)) - (p_window_days-1) AS start_d
  )
  SELECT
    a.landing_page_path,
    sum(a.sessions)::bigint,
    sum(a.users)::bigint,
    sum(a.engaged_sessions)::bigint,
    -- Weighted by sessions: engagement rate is a ratio, so averaging the daily
    -- rates would let a one-session day count as much as a hundred-session day.
    CASE WHEN sum(a.sessions) > 0
         THEN round(sum(a.engagement_rate * a.sessions) / sum(a.sessions), 4)
         ELSE 0::numeric END,
    sum(a.key_events)::bigint,
    count(DISTINCT a.date)::bigint
  FROM public.analytics_landing_daily a, b
  WHERE a.date BETWEEN b.start_d AND b.end_d
    AND (p_channel IS NULL OR a.channel_group = p_channel)
  GROUP BY a.landing_page_path;
$$;

COMMENT ON FUNCTION public.geo_ga4_page_window(int, date, text) IS
  'GA4 landing-page behaviour for a window, organic by default. Corroboration only - GA4 dates are in the property timezone (Asia/Jerusalem) while Search Console dates are America/Los_Angeles, so the two calendars can differ by a day. Absence of GA4 data must never be treated as evidence against a Search Console signal.';

GRANT EXECUTE ON FUNCTION public.geo_latest_page_date(text)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.geo_page_window(text, int, date)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.geo_totals_window(text, int, date)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.geo_query_window(text, int, date, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.geo_ctr_curve(text, int, date)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.geo_ga4_page_window(int, date, text) TO authenticated;
