# Diagnostic report: clinic-call-whatsapp (read-only, nothing changed)

## What the logs show
- Edge Function logs for clinic-call-whatsapp: none returned (no boot, no console lines, no errors).
- Edge HTTP request log (function_edge_logs) for this path: 0 rows. No HTTP status counts exist to report (0 x 200 / 403 / 503).
- `clinic_ivr menu pressed_1` (NOTIFY_IVR clinic_menu with digit 1): not seen. No `clinic_whatsapp queued/review` lines and no `dispatch_failed` either.
- Conclusion from logs: since the latest deployment, the telephony provider's webhook calls are not reaching the function at all, or have not happened in the log retention window. This is not a runtime or RPC error inside the function.

## Database evidence (counts only, no patient data)
- clinic_call_messages: 11 `queued` (Green-API accepted), 1 `review`. Last accepted send: 2026-11-24 10:58 UTC. Earlier sends 23 Nov and 21 Nov. So the old direct-send path worked until 10:58 today.
- Referral rollout settings: enabled = true, test_mode = true, test phone = the owner number 0525916393.
- clinic_private.referral_flows: empty. The owner test number has never been scheduled through the new delayed flow.
- RPC schedule_clinic_referral(p_phone, p_name, p_source) exists and is valid.

## How the deployed code behaves now (from source at HEAD fe7d533)
- Caller presses 1 -> RPC schedule_clinic_referral.
  - Owner test number: returns `scheduled` -> plays thank-you, NO immediate WhatsApp. Message is sent later (~2 min) by the WhatsApp bot worker. If that worker never runs, the owner gets nothing.
  - Any other caller (test_mode on): returns `disabled` -> falls back to the old direct Green-API send, which should still work.
- Any non-matching signature returns 403; missing secrets return 503 - neither appears in the logs.

## Likely causes, ranked
1. Provider webhook not reaching the function (zero requests logged). Check the PBX notification URL / IVR assignment for 055-5070399 still points at this function, and that the call actually triggers NOTIFY_START/NOTIFY_IVR.
2. If a call did arrive for the owner number but logs are lagging: it would be `scheduled` and wait for the bot dispatcher; but referral_flows is empty, so this has not happened yet.
3. Deployment source: deployed from commit 8f1a231 sources (identical to HEAD for this file). The platform does not expose a version id in logs.

## Suggested next steps (not done)
- Make one owner test call from 0525916393, press 1, then re-read logs and referral_flows within 2 minutes.
- If still zero requests: inspect the telephony provider webhook settings (outside the app).
- If a flow row appears but no message: inspect clinic-whatsapp-bot dispatcher (its recent logs show only boot/shutdown, no sends).
