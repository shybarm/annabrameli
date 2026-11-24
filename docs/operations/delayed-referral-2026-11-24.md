# Delayed service replies, 24 November 2026

## Scope and status

Owner requested prospective contact-form replies after 20 minutes and IVR key 1 replies after 2 minutes, followed by alternatives when no clinic appointments are available. This is a deterministic service conversation, not a clinical assistant. No messages have been sent during development.

Prepared in Git, integration-tested locally. NOT activated or verified in production. Live frontend reports source 32b3591. Supabase connector refused read access to project ftatmcyrmeyhghgckvbj. Do not replace live receiver definitions without comparing them to this migration's preserved baseline. There is no verified Git-to-backend deployment pipeline in this checkout.

## Behavior

- Both contact forms have an optional, unchecked WhatsApp service-response checkbox. After successful email notification, opted-in submissions are scheduled. Email success is independent of scheduling success.
- Only authenticated IVR key 1 invokes the delayed flow; existing greetings, key 0, extension routing, provider credentials and legacy flow remain intact. The switch is initially disabled and preserves the old IVR greeting message until activation.
- Server-persisted due times: +20 minutes for contact, +2 minutes for IVR. Existing minute-based dispatch means actual delivery may be later, never earlier. No browser timer or long-running function sleep.
- Opening identifies the automated clinic response on behalf of Shy and asks whether the appointment is for a child or adult. After the first text reply following provider acceptance, a single message recommends checking the HMO and gives the two owner-supplied alternatives.
- No claims of guaranteed availability, priority or adult suitability. Names/links checked against https://drallergy.co.il/ and https://medspace.co.il/פרופ-אבי-ביגלמן/ on 24 November. Sharon and referral attribution supplied by owner. No transit proximity promise added.
- Existing conversations, previous flow enrollments, withdrawn consent and opt-outs are not automatically restarted. No retrospective enrollment.
- Replies before the opening, media, human-support requests, opt-outs and staff takeover suppress automation. Other messages remain in the existing staff conversation inbox. Provider webhooks are deduplicated. Uncertain sends are not retried blindly.
- No medical inference or patient data is sent to external AI or analytics. IVR scheduled events are not reported as sent messages.

## Deployment prerequisites, via Git pipeline only

1. Compare live receive_clinic_whatsapp, staff_whatsapp_action and tables with the checked-in baseline using a connection with read permission.
2. Apply only 20261124105427_delayed_clinic_referral.sql through the repository's verified deployment process; default enabled=false. No existing cron or provider settings are overwritten.
3. Deploy notify-contact and clinic-call-whatsapp from the same Git revision; deploy frontend opt-in. Existing clinic-whatsapp-bot stays unchanged.
4. Check new cron presence, function grants, healthy existing queue dispatcher and webhook settings, using aggregate data only.
5. Verify against an explicitly designated test number before activation. Do not use an actual patient inquiry as a test. Then activate the referral_settings singleton in a reviewed Git-managed deployment.
6. Verify accepted/delivered status separately; do not describe pending/accepted as delivered. Update release evidence only after these checks.

Rollback: disable referral_settings; cancel pending outbox entries referencing referral_flows.welcome_id or reply_id and mark corresponding pending messages cancelled. Do not cancel invoices or staff messages. Existing contact email and phone routing remain functional. Do not blindly re-enable old conversations.

## Validation

Integration test runs actual SQL functions in isolated PostgreSQL-compatible PGlite, with minimal existing-table and scheduler fixtures, without network/provider access:
`PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node tests/integration/clinic-referral.mjs`

Checks: disabled rollout, phone eligibility, 20/2 minute persisted delay, no early dispatch, duplicate submissions/ticks/webhooks, one referral response, missing provider acceptance, opt-out, human request, staff takeover before/after welcome, pending referral cancellation, existing conversation suppression, public-function grants. This does not replace live schema, provider or end-to-end deployment checks.

Production build and content-style checks also required before Git push.

## Narrow deployment authorization and test isolation

Owner approved on 24 November deployment of the committed migration and only notify-contact / clinic-call-whatsapp through the existing Lovable Cloud deployment path. No source edits in Lovable, no integration or secret changes. Cloud is owned by Eipok workspace in the existing account. Live receiver and staff-action definitions were compared to the preserved baseline.

Rollout defaults disabled and test_mode=true. Activation requires a protected test_phone value; no personal test number is committed. Scheduling, due dispatch and follow-up all enforce this recipient gate. Only this explicit test recipient may reuse an existing conversation; opt-outs still suppress. Production enablement is a separate deliberate setting change after verification. Existing IVR behavior outside the test gate stays unchanged.

## Deployment evidence

- Git source `8f1a2310b2b87c45e0912e672ed04b8448a3a335` pushed to connected main. Applied exact committed migration through the explicitly authorized Cloud database operation and recorded migration version 20261124105427.
- Lovable deployment request `umsg_01m86m0mr1e0d83gea4sp2e3ap` deployed only notify-contact and clinic-call-whatsapp. Agent verified source equality to 8f1a231. Automatic database type generation produced 48ac9fa; reviewed diff consists solely of 20 generated type lines. No integration/secret changes.
- Live notify-contact GET reports `2026-11-24-delayed-referral-v1`. Live /contact reports frontend source 7fd60ca and contains the optional WhatsApp consent. No additional frontend publication needed for this change.
- Protected rollout enabled with test_mode=true and only owner's designated test number. Database checks: one test flow, zero non-test flows, public RPC execution denied, original WhatsApp setup remains configured, new minute job succeeds.
- One marked contact test accepted by live notify-contact at 11:12:03 UTC; persisted deadline 11:32:03 UTC, exactly +20 minutes. Delivery/follow-up verification still pending at this entry. No actual patient was used.
- Added handler tests running the actual TypeScript with mocked providers: authenticated key 1, rejected signature, key 0 unchanged, other DID ignored, phone normalization, no immediate send in delayed mode, errors, existing fallback, optional form consent and failed email behavior.
- Additional negative test found a nullable test-recipient edge case in the follow-up gate. Separate forward migration 20261124111700 makes missing recipient settings fail closed. No editing of the already-applied migration or rewriting history.
