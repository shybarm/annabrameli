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
