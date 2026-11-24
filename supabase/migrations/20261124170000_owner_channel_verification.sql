BEGIN;
CREATE TABLE clinic_private.referral_owner_test(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),source text NOT NULL CHECK(source IN ('contact_form','whatsapp_inbound')),prepared_at timestamptz NOT NULL DEFAULT clock_timestamp());
ALTER TABLE clinic_private.referral_owner_test ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clinic_private.referral_owner_test FROM PUBLIC,anon,authenticated;
DO $patch$
DECLARE body text;
BEGIN
 body:=pg_get_functiondef('public.schedule_clinic_referral(text,text,text,text)'::regprocedure);
 body:=replace(body,'AND NOT (SELECT test_mode AND test_phone=p_phone FROM clinic_private.referral_settings WHERE singleton)',
 'AND NOT ((SELECT test_mode AND test_phone=p_phone FROM clinic_private.referral_settings WHERE singleton) OR EXISTS(SELECT 1 FROM clinic_private.referral_owner_test t JOIN clinic_private.referral_settings s ON s.singleton WHERE t.singleton AND t.source=p_source AND s.test_phone=p_phone AND t.prepared_at>now()-interval ''30 minutes''))');
 EXECUTE body;
 body:=pg_get_functiondef('public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean)'::regprocedure);
 body:=replace(body,'DECLARE cid uuid; mid uuid;','DECLARE cid uuid; mid uuid; owner_test boolean;');
 body:=replace(body,' SELECT id INTO cid FROM public.whatsapp_conversations',
 ' SELECT EXISTS(SELECT 1 FROM clinic_private.referral_owner_test t JOIN clinic_private.referral_settings s ON s.singleton WHERE t.singleton AND t.source=''whatsapp_inbound'' AND s.test_phone=p_phone AND p_timestamp>=t.prepared_at AND t.prepared_at>now()-interval ''30 minutes'') INTO owner_test;
 SELECT id INTO cid FROM public.whatsapp_conversations');
 body:=replace(body,'AND bot_started_at IS NULL FOR UPDATE','AND (bot_started_at IS NULL OR owner_test) FOR UPDATE');
 body:=replace(body,'IF mid IS NULL OR EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE conversation_id=cid AND id<>mid) THEN RETURN; END IF;',
 'IF mid IS NULL OR (NOT owner_test AND EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE conversation_id=cid AND id<>mid)) THEN RETURN; END IF;');
 EXECUTE body;
END $patch$;
COMMIT;
