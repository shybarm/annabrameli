# Search Console + GA4 setup

Everything in this document is a step **you** must perform. The code is
written and type-checked; it cannot run until these credentials exist. Until
then both sync functions fail closed with a message naming the missing secret,
and the admin dashboard shows "אין נתונים זמינים" rather than a guess.

Nothing here should be done before the Stage 0 deploy is verified.

---

## 1. Google Cloud service account

One service account serves both integrations.

1. In [Google Cloud Console](https://console.cloud.google.com/), select or
   create a project (a new one named e.g. `ihaveallergy-growth` is fine).
2. **APIs & Services → Library**, enable both:
   - *Google Search Console API*
   - *Google Analytics Data API*
3. **APIs & Services → Credentials → Create credentials → Service account**.
   - Name: `growth-sync`
   - Grant it **no** project roles. It needs none; access is granted per
     property in steps 2 and 3.
4. Open the service account → **Keys → Add key → Create new key → JSON**.
   Download it. This file is a secret — it is the private key that lets the
   sync functions read your data. Do not commit it, email it, or paste it into
   a chat window.
5. Note the service account's email address, of the form
   `growth-sync@<project>.iam.gserviceaccount.com`.

## 2. Grant Search Console access

1. Open [Search Console](https://search.google.com/search-console) and select
   the ihaveallergy.com property.
2. **Settings → Users and permissions → Add user**.
3. Paste the service account email. Permission: **Full** — Search Console has
   no read-only role that also permits API queries; "Restricted" cannot call
   the API. The account still cannot change site content.
4. Note the property's exact identifier, which you need verbatim:
   - Domain property → `sc-domain:ihaveallergy.com`
   - URL-prefix property → `https://ihaveallergy.com/` (trailing slash included)

## 3. Grant GA4 access

1. In [GA4 Admin](https://analytics.google.com/) → **Property access
   management → Add users**.
2. Paste the same service account email, role **Viewer**, and untick
   "Notify new users by email" (service accounts have no inbox).
3. **Admin → Property Settings** → copy the **Property ID**. It is numeric,
   e.g. `412345678`. This is *not* the `G-671NNHCM9J` measurement id already
   in `index.html`.

## 4. Add the secrets to Supabase

Supabase dashboard → **Edge Functions → Secrets** (or
`supabase secrets set ...`). Three new secrets:

| Secret | Value | Classification |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | the entire contents of the downloaded JSON key file, braces included | **SECRET** |
| `GSC_SITE_URL` | the property identifier from step 2 | server only |
| `GA4_PROPERTY_ID` | the numeric property id from step 3 | server only |

`REMINDER_INTERNAL_TOKEN` is already configured and is reused as the cron
token — no change needed.

None of these may ever be given a `VITE_` prefix. Vite inlines `VITE_*` into
the client bundle, which would publish the private key to every visitor.

## 5. Apply the migration and deploy

```bash
supabase db push
```

```bash
supabase functions deploy gsc-sync ga4-sync
```

The migration is additive only — two `CREATE TABLE IF NOT EXISTS` statements,
their indexes and RLS policies. It alters and drops nothing, so re-running it
is safe and rolling it back is `DROP TABLE search_console_daily, analytics_daily`.

## 6. First run and verification

Both functions require staff authentication or the internal token, so trigger
them from an authenticated admin session or with the cron token:

```bash
curl -X POST "https://ftatmcyrmeyhghgckvbj.supabase.co/functions/v1/gsc-sync" -H "Authorization: Bearer $SUPABASE_ANON_KEY" -H "x-internal-token: $REMINDER_INTERNAL_TOKEN" -H "Content-Type: application/json" -d '{"windowDays":30}'
```

A successful response reports `rowsReturned` and `rowsWritten`. Then:

- `select count(*), min(date), max(date) from search_console_daily;` should
  return a non-zero count spanning the requested window.
- `select * from audit_log where action = 'gsc_sync' order by created_at desc limit 5;`
  shows the run history, including failures.
- The dashboard visitors card switches from "אין נתונים זמינים" to a real
  number once `ga4-sync` has written today's row.

Backfill Search Console history once, with `{"windowDays": 480}` — the API
retains roughly 16 months. Do this before anything starts scoring
opportunities, so trends have history to sit on.

## 7. Schedule

Once a manual run succeeds, schedule both nightly (pg_cron, or whatever
already drives `send-appointment-reminders`). Search Console finalises data
2–3 days late, so each run re-fetches a trailing 5-day window and upserts;
running twice in a day is harmless.

---

## What this does not do

- No landing-page grain in `analytics_daily` yet — daily totals only. The
  opportunity engine is the first thing that needs per-page GA4 data, and that
  is a later stage.
- No opportunity scoring, no content generation, no automated publishing.
  This stage only collects facts.
