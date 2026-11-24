BEGIN;
CREATE TABLE clinic_private.returning_reply_guard(conversation_id uuid PRIMARY KEY REFERENCES public.whatsapp_conversations(id),sent_at timestamptz NOT NULL);
ALTER TABLE clinic_private.returning_reply_guard ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clinic_private.returning_reply_guard FROM PUBLIC,anon,authenticated;
CREATE FUNCTION clinic_private.queue_returning_reply(cid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE eligible uuid;
BEGIN
 SELECT id INTO eligible FROM public.whatsapp_conversations WHERE id=cid AND NOT opted_out AND whatsapp_consent_withdrawn_at IS NULL FOR UPDATE;
 IF eligible IS NULL THEN RETURN; END IF;
 INSERT INTO clinic_private.returning_reply_guard(conversation_id,sent_at) VALUES(cid,now())
 ON CONFLICT(conversation_id) DO UPDATE SET sent_at=excluded.sent_at WHERE clinic_private.returning_reply_guard.sent_at<now()-interval '24 hours'
 RETURNING conversation_id INTO eligible;
 IF eligible IS NULL THEN RETURN; END IF;
 PERFORM public.queue_whatsapp_text(cid,'היי, אני באמצע עם מטופל אחר. מסיים וחוזר אלייך.');
 UPDATE public.whatsapp_conversations SET unread=true WHERE id=cid;
END $$;
REVOKE ALL ON FUNCTION clinic_private.queue_returning_reply(uuid) FROM PUBLIC,anon,authenticated;
DO $patch$
DECLARE body text;
BEGIN
 body:=pg_get_functiondef('public.schedule_clinic_referral(text,text,text,text)'::regprocedure);
 body:=replace(body,' IF FOUND THEN'||chr(10)||'  IF p_source=',
 ' IF FOUND THEN
  IF p_phone IS DISTINCT FROM (SELECT test_phone FROM clinic_private.referral_settings WHERE singleton) THEN
   PERFORM clinic_private.queue_returning_reply(c.id); RETURN ''suppressed'';
  END IF;
  IF p_source=');
 body:=replace(body,$old$THEN RETURN 'suppressed'; END IF;
 INSERT INTO clinic_private.referral_flows$old$,$new$THEN
  IF p_phone IS DISTINCT FROM (SELECT test_phone FROM clinic_private.referral_settings WHERE singleton) THEN PERFORM clinic_private.queue_returning_reply(c.id); END IF;
  RETURN 'suppressed'; END IF;
 INSERT INTO clinic_private.referral_flows$new$);
 EXECUTE body;
END $patch$;
ALTER FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) RENAME TO receive_clinic_whatsapp_before_returning;
CREATE FUNCTION public.receive_clinic_whatsapp(p_phone text,p_provider_id text,p_body text,p_type text,p_timestamp timestamptz,p_from_staff boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cid uuid; existing boolean; active boolean;
BEGIN
 IF EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE provider_id=p_provider_id) THEN RETURN; END IF;
 SELECT id INTO cid FROM public.whatsapp_conversations WHERE phone=p_phone FOR UPDATE;
 existing:=cid IS NOT NULL AND EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE conversation_id=cid);
 active:=EXISTS(SELECT 1 FROM clinic_private.referral_flows WHERE conversation_id=cid AND state NOT IN ('completed','cancelled'))
 OR EXISTS(SELECT 1 FROM clinic_private.whatsapp_waitlist_intake WHERE conversation_id=cid AND awaiting_name);
 IF existing AND NOT active AND NOT p_from_staff AND p_phone IS DISTINCT FROM (SELECT test_phone FROM clinic_private.referral_settings WHERE singleton) THEN
  PERFORM public.receive_clinic_whatsapp_before_referral(p_phone,p_provider_id,p_body,p_type,p_timestamp,false);
  IF trim(lower(p_body)) NOT IN ('הסר','עצור','הסרה','stop','unsubscribe','ביטול') THEN PERFORM clinic_private.queue_returning_reply(cid); END IF;
  RETURN;
 END IF;
 PERFORM public.receive_clinic_whatsapp_before_returning(p_phone,p_provider_id,p_body,p_type,p_timestamp,p_from_staff);
END $$;
REVOKE ALL ON FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) TO service_role;
COMMIT;
