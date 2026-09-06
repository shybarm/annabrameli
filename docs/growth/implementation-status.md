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
