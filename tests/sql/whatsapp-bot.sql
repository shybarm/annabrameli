BEGIN;
DO $$
DECLARE c uuid; n integer;
BEGIN
 c:=public.register_whatsapp_waitlist('בדיקה','972500000000',NULL,false);
 IF EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE conversation_id=c) THEN RAISE EXCEPTION 'Message without consent'; END IF;
 IF (SELECT whatsapp_consent_at FROM public.whatsapp_conversations WHERE id=c) IS NOT NULL THEN RAISE EXCEPTION 'False consent'; END IF;
 PERFORM public.register_whatsapp_waitlist('בדיקה','972500000000',NULL,true);
 PERFORM public.register_whatsapp_waitlist('בדיקה','972500000000',NULL,true);
 IF (SELECT count(*) FROM public.whatsapp_messages WHERE conversation_id=c AND direction='outgoing')<>1 THEN RAISE EXCEPTION 'Duplicate confirmation'; END IF;
 IF (SELECT whatsapp_consent_at FROM public.whatsapp_conversations WHERE id=c) IS NULL THEN RAISE EXCEPTION 'Consent not recorded'; END IF;
 PERFORM public.receive_clinic_whatsapp('972500000000','confirmation-test-thanks','תודה','text',now());
 PERFORM public.receive_clinic_whatsapp('972500000000','confirmation-test-thanks','תודה','text',now());
 IF (SELECT count(*) FROM public.whatsapp_messages WHERE conversation_id=c AND direction='outgoing')<>1 THEN RAISE EXCEPTION 'Unwanted question'; END IF;
 IF (SELECT count(*) FROM public.whatsapp_messages WHERE conversation_id=c AND direction='incoming')<>1 THEN RAISE EXCEPTION 'Duplicate inbound'; END IF;
 PERFORM public.receive_clinic_whatsapp('972500000000','confirmation-test-stop','הסר','text',now());
 IF NOT (SELECT opted_out FROM public.whatsapp_conversations WHERE id=c) THEN RAISE EXCEPTION 'Opt-out ignored'; END IF;
 SELECT count(*) INTO n FROM public.whatsapp_messages WHERE conversation_id=c;
 PERFORM public.register_whatsapp_waitlist('בדיקה','972500000000',NULL,true);
 IF (SELECT count(*) FROM public.whatsapp_messages WHERE conversation_id=c)<>n THEN RAISE EXCEPTION 'Opt-out bypassed'; END IF;
 IF has_function_privilege('anon','public.whatsapp_bot_config()','execute') OR has_column_privilege('authenticated','public.whatsapp_bot_settings','dispatch_token','select') THEN RAISE EXCEPTION 'Credential exposed'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: consent, one confirmation, reply storage without questions, opt-out, permissions; rolled back' AS result;
