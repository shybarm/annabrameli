# Clinic conversation context and direct Google activation

Prepared 2026-11-24. Source changes must be published through Git. Never paste credentials in Git, chat, logs, or client-side environment variables.

## Scope

- Existing conversation messages remain the source of memory; no external memory service or clinical-record ingestion.
- Claimed AI jobs include the first eight and last twelve accepted/current text messages, plus at most eight prior messages from the same conversation within 90 days, in a separate history field.
- Historical context is not evidence of current patient identity or current consent. Consent classification never receives the prior-history field.
- Completed returning conversations remain protected from automatic restart; owner-only repeat testing remains unchanged.
- Contact-form answers use the same contextual routing as callers so a complete answer need not trigger another allergy question.
- Staff takeover, opt-out, queue deduplication, waitlist records and delays remain unchanged.

## Connection required

1. Google AI Studio / Google Cloud project with paid billing enabled. Do not use the unpaid tier with clinic messages.
2. Store that project's API key as the server secret `GEMINI_API_KEY` in the existing backend project `ftatmcyrmeyhghgckvbj`. Do not alter GREEN API, telephone, email, database or existing gateway keys.
3. Deploy the Git revision containing the migration `20261124210000_referral_conversation_memory.sql` and `clinic-whatsapp-bot` function. A Git push alone is not proof that the managed backend applied a migration or deployed a function.
4. After verifying the paid project and testing synthetic requests, set server configuration `CLINIC_AI_PROVIDER=google`. Without that explicit setting, the existing gateway stays active. With it set, missing/failed Google credentials use the reviewed safe action; there is no silent transfer to another AI provider.
5. The fixed direct model is `gemini-3.1-flash-lite`, endpoint `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, minimal reasoning. Verify availability before activation; do not silently substitute another model.
6. Test live only on `972525916393`. Do not drain all pending clinic jobs to run a test. Confirm call/form/new-message routes, no repeats, fresh consent, staff takeover and opt-out with owner-scoped checks.

The free-text redactor removes emails and numeric identifiers, but is not full anonymization. Names and allergy descriptions can remain; paid-service data handling is required. The model only chooses reviewed administrative actions, never medical advice.

## Verification

Local automated tests use synthetic in-memory records and mocked AI/network calls; they are not proof of Google access, live deployment or WhatsApp delivery. No patient test messages are authorized.

Run `node tests/integration/clinic-referral-ai.mjs`, the PGlite referral integration suite, `node tests/integration/clinic-referral-entrypoints.mjs`, `npm run check:content-style`, and `npm run build` before publishing.
