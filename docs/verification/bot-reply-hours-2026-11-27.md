# First-contact routing and Israel reply hours

Status: both migrations applied to production from Git revision a4fce10 on 2026-11-27. Live function checks and owner-only closure delivery verified.

Read-only production inspection confirmed a new IVR flow was followed by a returning-busy reply. The incoming greeting then cancelled the scheduled flow. No patient messages were sent during this investigation.

Changes:
- Repeated IVR/form triggers preserve an active flow and its due time.
- An inbound greeting before the welcome does not cancel the scheduled flow.
- Automated replies are gated again at dispatch, using Asia/Jerusalem.
- One closed-clinic notice per deferred window; notices do not establish prior conversation history.
- Thursday evening requests resume Friday at 08:30; new Friday/Saturday requests resume Sunday at 08:30.
- Contact, IVR, inbound WhatsApp and waitlist paths share the policy. Manual staff replies and invoice delivery retain their separate behavior.
- No backfill or restart of previously cancelled patient conversations.

Local verification:
- PostgreSQL-compatible PGlite execution of the existing migration chain plus both new migrations.
- Duplicate IVR events, greeting before welcome, duplicate webhook and opt-out.
- Four entry paths, one night notice, no night automatic reply, Friday resumption without duplicates.
- New Friday/Saturday requests held until Sunday; late dispatch after 20:30 held until morning.
- Inbound AI text is stubbed locally; this verifies queue gating, not model output or provider delivery.
- npm run check:content-style and npm run build passed.

To reproduce: install @electric-sql/pglite without changing package manifests, then run node tests/integration/clinic-reply-hours.mjs. No external messaging calls are made.

Deployment requires applying 20261127090000_preserve_first_contact.sql and 20261127091000_all_bot_reply_hours.sql in order. Verify deployed function definitions and test delivery only to the authorized owner number. A Git push alone is not evidence that these database migrations ran.

## Production verification

Applied the exact two approved migration files through the existing Lovable database connection in one transaction. No editor changes, connection changes, key changes, patient test sends, or patient conversation restarts.

Live checks confirmed the active-flow guard and outbox hours gate. Thursday 22:53 resolves to Friday 08:30 Israel time; a new Friday request resolves to Sunday 08:30.

The owner-only closed-notice function was invoked twice; exactly one notice was created and the provider marked it delivered. A transaction-scoped IVR test using the owner number verified scheduling, repeat-event suppression, and preservation after an incoming greeting. The transaction was rolled back and zero temporary event records remained. The owner's previous completed waitlist flow was preserved.

Limits: morning continuation was verified with deterministic local database tests and production time calculations, not by waiting for a real morning delivery. No new real phone call or browser form submission was performed in this deployment check.
