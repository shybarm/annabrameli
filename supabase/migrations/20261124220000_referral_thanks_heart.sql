BEGIN;
ALTER TABLE clinic_private.referral_flows ADD COLUMN thanks_for_flow_at timestamptz;
DO $patch$
DECLARE body text; original text;
BEGIN
 original:=pg_get_functiondef('public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean)'::regprocedure);
 body:=replace(original,' existing:=cid IS NOT NULL', $new$
 -- A short closing thanks gets one heart per completed flow, without an AI call.
 IF NOT p_from_staff AND p_type='text'
 AND regexp_replace(trim(lower(p_body)), '[[:space:]!.,❤️🙏]+', '', 'g') IN ('תודה','תודהרבה','המוןתודה','תודהרבהלך','תודהמכלהלב','thanks','thankyou')
 AND EXISTS(SELECT 1 FROM clinic_private.referral_flows f
 JOIN public.whatsapp_messages m ON m.id=f.reply_id
 JOIN public.whatsapp_conversations c ON c.id=f.conversation_id
 JOIN clinic_private.referral_settings s ON s.singleton
 WHERE f.conversation_id=cid AND f.state='completed' AND s.enabled
 AND (NOT s.test_mode OR s.test_phone=p_phone)
 AND NOT c.opted_out AND c.whatsapp_consent_withdrawn_at IS NULL
 AND m.status IN ('accepted','sent','delivered','read') AND m.created_at>now()-interval '24 hours')
 AND NOT EXISTS(SELECT 1 FROM clinic_private.whatsapp_waitlist_intake WHERE conversation_id=cid AND awaiting_name) THEN
  PERFORM public.receive_clinic_whatsapp_before_referral(p_phone,p_provider_id,p_body,p_type,p_timestamp,false);
  UPDATE clinic_private.referral_flows SET thanks_for_flow_at=created_at
   WHERE conversation_id=cid AND thanks_for_flow_at IS DISTINCT FROM created_at;
  IF FOUND THEN PERFORM public.queue_whatsapp_text(cid,'❤️'); END IF;
  RETURN;
 END IF;
 existing:=cid IS NOT NULL$new$);
 IF body=original THEN RAISE EXCEPTION 'Expected returning guard not found'; END IF;
 EXECUTE body;
END $patch$;
COMMIT;
