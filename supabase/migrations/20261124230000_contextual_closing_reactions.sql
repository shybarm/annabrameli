BEGIN;
ALTER TABLE public.whatsapp_messages ADD COLUMN reaction_target text;
CREATE OR REPLACE FUNCTION public.receive_clinic_whatsapp(p_phone text,p_provider_id text,p_body text,p_type text,p_timestamp timestamptz,p_from_staff boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cid uuid; existing boolean; active boolean;
BEGIN
 SELECT id INTO cid FROM public.whatsapp_conversations WHERE phone=p_phone FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE provider_id=p_provider_id) THEN RETURN; END IF;
 existing:=cid IS NOT NULL AND EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE conversation_id=cid);
 active:=EXISTS(SELECT 1 FROM clinic_private.referral_flows WHERE conversation_id=cid AND state NOT IN ('completed','cancelled'))
 OR EXISTS(SELECT 1 FROM clinic_private.whatsapp_waitlist_intake WHERE conversation_id=cid AND awaiting_name);
 IF existing AND NOT active AND NOT p_from_staff THEN
  PERFORM public.receive_clinic_whatsapp_before_referral(p_phone,p_provider_id,p_body,p_type,p_timestamp,false);
  -- Closing replies are interpreted in context, never as an automatic new intake.
  IF p_type='text' AND trim(lower(p_body)) NOT IN ('הסר','עצור','הסרה','stop','unsubscribe','ביטול')
  AND EXISTS(SELECT 1 FROM public.whatsapp_conversations c JOIN clinic_private.referral_settings s ON s.singleton
   WHERE c.id=cid AND NOT c.opted_out AND c.whatsapp_consent_withdrawn_at IS NULL
   AND s.enabled AND s.ai_enabled AND (NOT s.test_mode OR s.test_phone=p_phone)) THEN
   UPDATE clinic_private.referral_flows SET state='ai_pending',ai_input_id=(SELECT id FROM public.whatsapp_messages WHERE provider_id=p_provider_id AND conversation_id=cid),ai_claim=NULL,ai_claimed_at=NULL,ai_questions=ARRAY['closing_reply']
   WHERE conversation_id=cid AND state='completed' AND p_timestamp>=created_at;
  END IF;
  RETURN;
 END IF;
 PERFORM public.receive_clinic_whatsapp_before_returning(p_phone,p_provider_id,p_body,p_type,p_timestamp,p_from_staff);
END $$;
DO $patch$
DECLARE body text; original text;
BEGIN
 original:=pg_get_functiondef('public.finish_clinic_referral_ai(uuid,uuid,text,text)'::regprocedure);
 body:=replace(original,' -- Two intake questions only;', $new$
 IF 'closing_reply'=ANY(f.ai_questions) THEN
  IF p_action='closing_thanks' AND f.thanks_for_flow_at IS DISTINCT FROM f.created_at THEN
   IF EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE id=f.ai_input_id AND direction='incoming' AND provider_id IS NOT NULL) THEN
    mid:=public.queue_whatsapp_text(cid,'🙏');
    UPDATE public.whatsapp_messages SET reaction_target=(SELECT provider_id FROM public.whatsapp_messages WHERE id=f.ai_input_id) WHERE id=mid;
    UPDATE clinic_private.referral_flows SET thanks_for_flow_at=created_at WHERE conversation_id=cid;
   END IF;
  END IF;
  UPDATE clinic_private.referral_flows SET state=CASE WHEN p_action IN ('closing_thanks','closing_ack') THEN 'completed' ELSE 'cancelled' END,ai_claim=NULL WHERE conversation_id=cid;
  -- Questions/complaints stay unread for staff, without invented busy/callback claims.
  IF p_action NOT IN ('closing_thanks','closing_ack') THEN UPDATE public.whatsapp_conversations SET unread=true WHERE id=cid; END IF;
  RETURN;
 END IF;
 -- Two intake questions only;$new$);
 IF body=original THEN RAISE EXCEPTION 'Expected AI completion branch missing'; END IF;
 EXECUTE body;
END $patch$;
ALTER FUNCTION public.claim_clinic_whatsapp_outbox() RENAME TO claim_clinic_whatsapp_outbox_before_reactions;
REVOKE ALL ON FUNCTION public.claim_clinic_whatsapp_outbox_before_reactions() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.claim_clinic_whatsapp_outbox() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job jsonb; target text;
BEGIN
 job:=public.claim_clinic_whatsapp_outbox_before_reactions();
 IF job IS NOT NULL THEN
  SELECT reaction_target INTO target FROM public.whatsapp_messages WHERE id=(job->>'message_id')::uuid;
  IF target IS NOT NULL THEN job:=job||jsonb_build_object('reaction_target',target); END IF;
 END IF;
 RETURN job;
END $$;
REVOKE ALL ON FUNCTION public.claim_clinic_whatsapp_outbox() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_clinic_whatsapp_outbox() TO service_role;
COMMIT;
