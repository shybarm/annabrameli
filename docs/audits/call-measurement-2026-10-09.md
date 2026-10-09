# Call measurement audit — 2026-10-09

Owner confirmed clinic 052-5916393 routes directly to mobile; regards every inbound call as a qualified lead, including unanswered calls. This is an owner qualification rule, not proof of an appointment. Never infer actual calls from tel-link clicks.

## Verified external settings
Account 664-227-1731, campaign 23876627444.
- Calls from ads: conversion 7826673482, call length 0 seconds, Primary; renamed to "Calls from ads — no duration threshold".
- GA4 phone_click 7742224797: Secondary, retained as a click metric.
- Campaign phone-call goal: both Website and Call from Ads selected, saved and reopened to verify both checked, alongside existing Contact and Book appointment goals. Budget unchanged (2 ILS/day).
- Call asset: reporting on, recording off, clinic number unchanged, conversion 7826673482.
- New actual website calls conversion 7832099908: "Calls from website after ad — no duration threshold", Primary, One, no value, 30-day window, 0 seconds. Read back from Details; status Awaiting conversions.
- UI-generated snippet AW-18186381713/CyUZCMS40ZYdEJHT-N9D, phone_conversion_number 052-5916393.

## Code
Public-route-only Google Ads configuration; sanitized URL/referrer, only Google click identifiers retained. Google forwarding callback updates number text and tel links; SPA observer updates new nodes; cleanup restores originals. WhatsApp and booking destination unchanged. No fabricated qualified-call event.
Validation: verify-website-calls.mjs, verify-analytics.mjs, typecheck, production build; 52/52 prerender routes.

## Not yet proven / remaining
- A real unanswered call appearing in Google reporting and conversion columns. A 0-second threshold does not establish that proof.
- End-to-end website number replacement on an eligible paid-ad visit and inbound call. No paid test ad clicks or artificial leads generated.
- Organic website/GBP calls to the original mobile: no actual inbound call log is available through current integrations. GBP discontinued call history; Windsor cannot create missing telephony records. These require a tracked number/provider forwarding to the mobile (possibly paid), explicit provider/cost approval before activation. Never publish Google's temporary forwarding number as permanent GBP phone.
- Google call reports count actual calls; One conversion intentionally deduplicates lead conversions per ad interaction.

Sources: https://support.google.com/google-ads/answer/6095883 ; https://support.google.com/google-ads/answer/2454052 ; https://support.google.com/business/answer/14919056

## Delivery
Commit 448aee26f7bea66cbda1741ddd72b83bed8e833c pushed to origin/main. Lovable accepted the commit. Publish changes triggered explicitly; verify live asset before claiming deployed. Previous live bundle index-BIvPsPOe.js did not contain the new call tag.
