# Improvement batches

## Owner constraints

The owner confirmed on 2026-09-06 that the restricted appointment navigation
and availability are intentional. Preserve the booking navigation, calendar
availability, and booking steps. Do not treat their restriction as a defect.
Do not add claims about how full the calendar is.

## Batch 1: contact analytics and prerender failure handling

- Keep the contact subject in the clinic notification, but remove it from the
  GA4 conversion payload: it is free text and can contain health information.
- Preserve existing conversion names and success timing.
- Fail the production build when its prerender input is missing, its SSR build
  or import fails, or its top-level prerender operation throws. Previously
  these errors returned exit code 0 and allowed a client shell to ship.
- Preserve the existing per-route gates and explicit gate override behavior.

Remaining work includes analytics URL/private-route filtering, image delivery,
hydration, and data-backed domain consolidation. This batch does not resolve
all analytics privacy risks. No production deployment is included.

Validation: missing prerender input exits with status 1; production build
renders 50/50 routes and generates 47 sitemap URLs; Contact ESLint and
git diff whitespace checks pass.

## Batch 2: responsive images

The existing five homepage/header images now have WebP derivatives in
`public/images/optimized`, with responsive selection and high fetch priority
for the hero portrait. Layout, alt text, URLs and booking availability are
preserved. Original assets remain available for other pages and rollback.

The five source files total 4,514,792 bytes. Even selecting the largest new
variant for each image totals 207,172 bytes (95.4% less). Actual transferred
bytes depend on viewport and pixel density; this is not a measured LCP gain.
The avatar is shared by header/footer and benefits every public page.

Derivatives were generated with Sharp WebP quality 85, effort 6, orientation
normalization and width-only resize without enlargement. The manifest records
each public source URL, SHA-256, sizes and output widths. No generation tool
or runtime dependency was added to the application.

Validation: production build and crawl check pass for 50/50 routes, with
50 unique titles and 47 sitemap URLs. All responsive image paths in the
generated homepage exist in dist, and the hero priority hint is present.
Header/Footer lint and whitespace checks pass. The optimized portrait and
consultation image were visually inspected. Live LCP remains to be measured
after deployment.

## Batch 3: explicit manual page views (pending GA4 configuration verification)

The route tracker previously repeated a config call after initial config set
send_page_view:false. It now sends an explicit page_view event, targeted to
the existing measurement ID. Query-only changes do not generate route views.
Manual views omit query strings, hashes, stored attribution URLs and private
staff/auth/token routes. Booking behavior and conversion names are unchanged.
This does not establish the cause of the historical session/page-view gap.

Deployment prerequisite: inspect GA4 web stream Enhanced Measurement page-view
settings and disable history-change page views when using this manual tracker.
Otherwise automatic history tracking may duplicate manual views. Verify one
view on initial landing, one per public navigation, and no manual view on
private routes in DebugView after deployment. Account settings were not changed.
Reference: https://developers.google.com/analytics/devguides/collection/ga4/views

Privacy limitation: the base Google tag and enhanced measurement still load
globally. This change filters only manually emitted page views; stored custom
conversion attribution and automatic collection require separate review.

Validation: node scripts/verify-analytics.mjs checks emitted events, URL
sanitization, private routes, public booking views, missing tag and SSR.
