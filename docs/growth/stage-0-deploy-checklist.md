# Stage 0 deploy checklist

The build now emits static HTML per route instead of one empty shell. That
changes what the host has to serve, so verify these in order. Nothing here has
been deployed.

## Before deploying

1. **Confirm the production build command runs `npm run build`** (or
   `bun run build`). The prerender and sitemap steps are chained inside the
   `build` script itself precisely so they cannot be skipped by a package
   manager that ignores pre/post hooks. If the host is configured to run
   `vite build` directly, change it to `npm run build` or nothing improves.

2. **Confirm the host's build environment supplies the `VITE_SUPABASE_*`
   variables.** `.env` is currently tracked in the repository and the build
   reads it from there. If the host injects its own values, `.env` can be
   untracked with `git rm --cached .env` — but only after confirming that,
   because untracking it while the host relies on it produces a build with an
   undefined Supabase URL.

## After deploying — verify in this order

3. **Directory-index resolution.** The build writes `dist/faq/index.html`, not
   `dist/faq.html`. The host must serve `/faq` from `/faq/index.html`. Check
   the byte size, not just a 200:

   ```bash
   curl -s https://ihaveallergy.com/faq | wc -c
   ```

   Roughly 74,000 bytes means the prerendered page is being served. About
   4,500 means the host fell back to the SPA shell and directory resolution is
   not working — the deploy has not achieved anything and the host's static
   routing needs configuring.

4. **Percent-encoded Hebrew paths.** Most content routes are Hebrew. The host
   must decode `%D7%98...` before looking up the file on disk. Verified
   working against a standard static host locally; confirm on production:

   ```bash
   curl -s "https://ihaveallergy.com/guides/%D7%98%D7%A2%D7%99%D7%9E%D7%95%D7%AA-%D7%A8%D7%90%D7%A9%D7%95%D7%A0%D7%95%D7%AA-%D7%90%D7%9C%D7%A8%D7%92%D7%A0%D7%99%D7%9D" | grep -c "<title"
   ```

5. **Run the acceptance check against production:**

   ```bash
   npm run verify:crawl -- --url https://ihaveallergy.com
   ```

   Expect every route to report a unique title, a canonical, JSON-LD present,
   and body text without JavaScript. Locally this reports 49/49.

6. **Private surfaces.** `/admin` and its subroutes should return
   `noindex, nofollow` in the raw HTML and no body text:

   ```bash
   npm run verify:crawl -- --url https://ihaveallergy.com /admin /admin/patients /auth
   ```

7. **Resubmit the sitemap** in Search Console once the deploy is verified, and
   request indexing for two or three representative pages to prompt a recrawl.

## Rollback

Every change is in the build pipeline, not the app. To revert entirely:

```bash
git revert f4994d6
```

That restores `build` to `vite build` alone, and production returns to serving
the SPA shell — the behaviour it has today. No data, schema, content or user
state is involved, so there is nothing else to undo.

## Known gaps, deliberately not addressed in Stage 0

- **Unknown URLs return 200, not 404.** The host serves the SPA shell for
  anything it does not recognise, so missing pages are soft-404s. Fixing it
  requires host configuration, not application code.
- **DB content overrides do not reach prerendered HTML.** Pages edited through
  the GEO live editor write to `page_content_overrides`, which is read at
  runtime. A crawler reading static HTML sees the version baked in at build
  time until the next deploy. Closing this is Stage 2's job, where publishing
  gains an approval gate and a rebuild trigger.
- **Six pages lack `og:title`/`twitter:card`** — `/dr-anna-brameli`,
  `/updates`, `/whois` and the three legal pages. Pre-existing gaps in those
  components' Helmet blocks, now visible because the output is inspectable.
  A small follow-up, not a blocker.
