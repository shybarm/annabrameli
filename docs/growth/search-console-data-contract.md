# Search Console data contract

**Stage 1B must respect this document.** Getting it wrong produces numbers that
look plausible and are wrong by an order of magnitude.

## The problem: Google suppresses anonymised queries

Google withholds rare queries to protect user privacy. The more dimensions a
request carries, the more rows fall below that threshold and disappear.
Measured directly against the API for `sc-domain:ihaveallergy.com`,
1–28 August 2026:

| Request | Clicks | Impressions |
| --- | ---: | ---: |
| `dimensions: []` | **29** | **526** |
| `dimensions: ["page"]` | **32** | **688** |
| `dimensions: ["page", "query"]` | **1** | **150** |

Query-grain data captures roughly **3% of clicks** and **28% of impressions**.

It is the right tool for learning *which* queries reach a page. It is the wrong
tool for measuring *how much* traffic anything gets — and because it is
plausible-looking and non-empty, the error is silent.

## The three grains

| Question | Use | Never use |
| --- | --- | --- |
| How much traffic does the site get? | `search_console_totals_daily` | Summing page or query rows |
| How is this page performing? | `search_console_page_canonical` | Summing that page's query rows |
| Which queries reach this page? What is the intent? | `search_console_canonical` | Its clicks/impressions as a total |

Each grain is fetched from Google independently. **None is derived from
another.** That redundancy is the point: the totals row is Google's own answer,
not our arithmetic.

### Rules

1. **Never sum query-grain rows to get page or site totals.** They are
   suppressed. This is the rule the whole document exists for.
2. **Never sum the two properties together.** `sc-domain:ihaveallergy.com`
   already includes `seo.ihaveallergy.com`, so adding them double-counts the
   subdomain.
   - Whole-domain reporting → `sc-domain:ihaveallergy.com`, authoritative and
     already complete on its own.
   - The subdomain in isolation → `sc-domain:seo.ihaveallergy.com`.
3. **Use the canonical views for cross-property page reporting.** They pick one
   property per key using the most-host-specific rule and preserve
   `source_property` for auditing. They never aggregate across properties.
4. **Query-grain impressions are still useful as a directional signal** — for
   striking-distance and intent work — as long as they are never presented as
   traffic.

### Reconciling the grains

Page-grain totals will slightly *exceed* undimensioned totals (688 vs 526
impressions in August). That is expected, not a bug: a single impression on a
results page that lists two of your URLs counts once for the site and once for
each page. Do not "fix" this by forcing them to match.

## Timezones

- Search Console reports in **America/Los_Angeles**.
- GA4 reports in the property timezone, **Asia/Jerusalem**.
- Both are stored verbatim and never converted, so the calendars can differ by
  up to a day. Compare like-for-like within a source; when joining across
  sources, account for the skew explicitly.

## Ingestion state

| Grain | Cursor |
| --- | --- |
| query | `gsc_sync_cursor` (property, date) |
| page, totals | `gsc_dataset_sync_cursor` (property, dataset, date) |

Separate deliberately: a failure at one grain must be visible on its own and
must never make another grain look current. The `gsc-sync` response reports
per-grain `status`, `rowsWritten`, `failureCount` and `remainingDays`, and the
overall status is the worst of the three.

Zero-data days are recorded as `ok` with `rows_written: 0`. No row is
fabricated for a day Google had no data for.
