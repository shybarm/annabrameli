# Delayed service replies, 24 November 2026

## Scope and status

Owner requested prospective contact-form replies after 20 minutes and IVR key 1 replies after 2 minutes, followed by alternatives when no clinic appointments are available. This is a deterministic service conversation, not a clinical assistant. Development tests use mocked providers. Live tests use only the explicitly authorized owner number.

Implemented and tested in Git. Deployed to the existing Lovable-managed Cloud project ftatmcyrmeyhghgckvbj under the owner's narrow deployment exception. Active only for the owner-designated test recipient; no patient rollout. Live frontend contains the opt-in at source 7fd60ca. Both deployed Edge Functions match 8f1a231. Database source hashes match the committed migrations, including the fail-closed follow-up fix at 55ceb4c. Real delayed delivery and incoming-response verification are recorded below as they complete. A normal Git push alone does not deploy the backend.

## Behavior

- Both contact forms have an optional, unchecked WhatsApp service-response checkbox. After successful email notification, opted-in submissions are scheduled. Email success is independent of scheduling success.
- Only authenticated IVR key 1 invokes the delayed flow; existing greetings, key 0, extension routing, provider credentials and legacy flow remain intact. The switch is initially disabled and preserves the old IVR greeting message until activation.
- Server-persisted due times: +20 minutes for contact, +2 minutes for IVR. Existing minute-based dispatch means actual delivery may be later, never earlier. No browser timer or long-running function sleep.
- Opening identifies the automated clinic response on behalf of Shy and asks whether the appointment is for a child or adult. After the first text reply following provider acceptance, a single message recommends checking the HMO and gives the two owner-supplied alternatives.
- No claims of guaranteed availability, priority or adult suitability. Names/links checked against https://drallergy.co.il/ and https://medspace.co.il/פרופ-אבי-ביגלמן/ on 24 November. Sharon and referral attribution supplied by owner. No transit proximity promise added.
- Existing conversations, previous flow enrollments, withdrawn consent and opt-outs are not automatically restarted. No retrospective enrollment.
- Replies before the opening, media, human-support requests, opt-outs and staff takeover suppress automation. Other messages remain in the existing staff conversation inbox. Provider webhooks are deduplicated. Uncertain sends are not retried blindly.
- No medical inference or patient data is sent to external AI or analytics. IVR scheduled events are not reported as sent messages.

## Deployment procedure under the explicit exception

1. Compare live receive_clinic_whatsapp, staff_whatsapp_action and tables with the checked-in baseline using a connection with read permission.
2. Apply only 20261124105427_delayed_clinic_referral.sql from the committed Git file through the existing Cloud database tool; default enabled=false. No existing cron or provider settings are overwritten.
3. Deploy notify-contact and clinic-call-whatsapp from the same Git revision; deploy frontend opt-in. Existing clinic-whatsapp-bot stays unchanged.
4. Check new cron presence, function grants, healthy existing queue dispatcher and webhook settings, using aggregate data only.
5. Set test_mode=true and the owner-designated test_phone in the protected settings, then enable. Do not enroll actual patients. The allowlist is checked in scheduling, due processing and follow-up. Enabling all future patients is distinct from this test-only rollout.
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

## Live contact-flow result

Verified 24 November at 12:00 UTC (14:00 Jerusalem):

- Live notify-contact accepted the marked owner-only inquiry at 11:12:03.642 UTC.
- Deadline persisted at 11:32:03.642 UTC (+20 minutes). Existing scheduler queued the welcome at 11:33:00.120 UTC. No accelerated deadline or manual dispatcher invocation was used.
- Provider accepted the welcome; its status progressed to read.
- A real incoming WhatsApp response triggered the single referral reply at 11:34:34.014 UTC. Provider accepted it and status progressed to read.
- Three incoming messages during the test did not create repeated referral replies. Flow completed. Zero non-test recipients were enrolled.
- The completed test-flow record was exported to a local verification artifact, then only that owner-specific completed flow row was removed to permit the independent IVR test. Existing conversation and all messages were preserved. No real patient records were changed.
- Asked owner to call from the authorized number and press 1. End-to-end IVR two-minute delivery remains pending that real call; isolated handler and SQL-delay tests have passed. Do not present that remaining check as completed.

## Owner-requested conversation refinement and phone investigation

24 November: after the live test, owner requested a short conversation before alternatives and removal of the explicit agent/stop footer. Forward migration 20261124122500 adds an awaiting_reason step and a tracked question message. Welcome still identifies the automated clinic response, asks child/adult, then the next message asks the reason for the inquiry. Only after an additional response is the alternatives message queued. This is a bounded service flow, not medical diagnosis or an AI clinical assessment. No health details are copied into analytics. Opt-out and staff takeover continue working without the footer. Retries and replies before provider acceptance cannot skip stages or duplicate questions/referrals.

Phone issue is still under investigation: live endpoint answered the harmless zd_echo challenge with HTTP 200. Read-only function-log and edge-request queries returned no entries; this does not establish that no requests happened because log availability/filtering is not confirmed. No owner phone_ivr flow exists. Provider login at my.zadarma.com is required to inspect routing read-only. Do not claim the phone issue is repaired based on endpoint availability or local tests alone. No keys, webhook configuration or routing changed.

The read-only Lovable diagnostic unexpectedly created .lovable/plan.md. Removed that diagnostic-only artifact through Git; no application source changes were introduced by it.


## Bounded AI and fresh phone calls

Owner requested adaptive AI intake after the fixed allergy question. The implementation reuses the existing AI gateway and credential in clinic-whatsapp-bot; no new provider, secret or webhook is introduced. It selects reviewed service questions (child age, diagnosed/suspected allergy, first visit/follow-up) from conversation context. It never sends free-form clinical advice. After at most two adaptive follow-ups, the third response is the fixed alternatives message; it may finish sooner. Model failure also falls back to the fixed alternatives. Staff requests stop the bot. Emergency wording references MDA's general emergency contact https://www.mdais.org/101, not a diagnosis or treatment recommendation. AI history is restricted to this flow; no phone/name fields are included and phone/email-like strings are masked. Service-role-only claims have leases; late or duplicate completions cannot publish after takeover. Rollout stays owner-only.

Read-only Zadarma inspection in the owner-provided shy@createit.tv account confirmed the clinic number active, the existing webhook URL correct and NOTIFY_IVR enabled. The owner's voice-menu calls appear at 12:58:31 and 13:38:03 Jerusalem. The latter occurred after the earlier website test completed but before its test-flow reset. Code treated any existing flow, including completed, as duplicate; this explains a fresh call getting no new message and is reproducible locally. The provider's detailed webhook response log was not available, so don't claim exclusive root cause until a new real call succeeds.

The forward phone migration records each call's existing stable hash. A new call may restart a completed flow with a fresh two-minute delay and archived prior metadata. A replay of the same or an older call stays deduplicated. Active/staff-cancelled flows and opt-outs are not restarted. Existing phone greeting, routing, signatures, provider endpoints and keys are unchanged. Deploy the committed clinic-call-whatsapp plus clinic-whatsapp-bot for this expanded user-requested feature; notify-contact needs no further deployment.

## Deployment and verification at 14:36 Jerusalem

- Committed implementation e00a158 is pushed to connected main. Exact SQL migrations 20261124123500 and 20261124124000 applied and registered. Database has its existing automatic PostgREST schema-refresh triggers.
- Lovable deployment request umsg_01m86rmbgfec3a1ta8h3yt6cw3 verified exact e00a158 source and deployed clinic-call-whatsapp plus clinic-whatsapp-bot/referral-ai.ts only. Git comparison after deployment found no added changes. No provider integration changes.
- AI enabled only within the existing owner-number allowlist. No patient rollout.
- Local PostgreSQL integration, actual-handler mocks and AI-worker mocks passed. Deno check passed for both deployed Edge Functions. Production build passed 54 routes with zero failures and content-style checks passed.
- Independent server-side phone-source test (not a real IVR event) scheduled at 12:22:38 UTC for 12:24:38 UTC. Welcome, allergy question and fixed referral all reached read status. This verified the server queue and revised deterministic question flow before AI activation.
- At 12:35:51 UTC no new real phone request hash had been recorded after deployment, and no live AI decision had occurred. Owner has been asked to call again and reply using test details. End-to-end real-call and AI verification remain pending; do not mark them completed based on local tests or the earlier synthetic scheduling.
