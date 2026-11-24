BEGIN;
CREATE OR REPLACE FUNCTION public.claim_clinic_referral_ai() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cid uuid; f clinic_private.referral_flows%ROWTYPE; ticket uuid; context jsonb; history jsonb;
BEGIN
 SELECT w.id INTO cid FROM public.whatsapp_conversations w JOIN clinic_private.referral_flows r ON r.conversation_id=w.id
 JOIN clinic_private.referral_settings s ON s.singleton
 WHERE s.enabled AND s.ai_enabled AND (NOT s.test_mode OR s.test_phone=w.phone) AND NOT w.opted_out
 AND r.state='ai_pending' AND (r.ai_claim IS NULL OR r.ai_claimed_at<now()-interval '90 seconds')
 ORDER BY r.created_at FOR UPDATE OF w SKIP LOCKED LIMIT 1;
 IF cid IS NULL THEN RETURN NULL; END IF;
 SELECT * INTO f FROM clinic_private.referral_flows WHERE conversation_id=cid;
 ticket:=gen_random_uuid();
 UPDATE clinic_private.referral_flows SET ai_claim=ticket,ai_claimed_at=now() WHERE conversation_id=cid;
 -- Keep the opening answers even after many messages, plus the latest replies.
 WITH eligible AS (
  SELECT id,direction,body,created_at FROM public.whatsapp_messages
  WHERE conversation_id=cid AND created_at>=f.created_at
   AND created_at<=(SELECT created_at FROM public.whatsapp_messages WHERE id=f.ai_input_id)
   AND message_type='text' AND (direction='incoming' OR status IN ('accepted','sent','delivered','read'))
 ), selected AS (
  (SELECT * FROM eligible ORDER BY created_at,id LIMIT 8)
  UNION
  (SELECT * FROM eligible ORDER BY created_at DESC,id DESC LIMIT 12)
 )
 SELECT jsonb_agg(jsonb_build_object('role',CASE WHEN direction='incoming' THEN 'user' ELSE 'assistant' END,
 'content',left(body,1000)) ORDER BY created_at,id) INTO context FROM selected;
 -- Previous requests are explicitly separated; they must not imply current consent or patient identity.
 SELECT jsonb_agg(jsonb_build_object('role',CASE WHEN direction='incoming' THEN 'user' ELSE 'assistant' END,
 'content',left(body,1000)) ORDER BY created_at,id) INTO history
 FROM (SELECT id,direction,body,created_at FROM public.whatsapp_messages
 WHERE conversation_id=cid AND created_at<f.created_at AND created_at>f.created_at-interval '90 days'
 AND message_type='text' AND (direction='incoming' OR status IN ('accepted','sent','delivered','read'))
 ORDER BY created_at DESC,id DESC LIMIT 8) prior;
 RETURN jsonb_build_object('conversation_id',cid,'claim',ticket,'asked',f.ai_questions,'messages',coalesce(context,'[]'::jsonb),'history',coalesce(history,'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.claim_clinic_referral_ai() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_clinic_referral_ai() TO service_role;

-- Form replies may already contain both the patient group and the allergy.
-- Let the same contextual router decide instead of always repeating the reason question.
DO $patch$
DECLARE body text; original text;
BEGIN
 original:=pg_get_functiondef('public.receive_clinic_whatsapp_before_inbound(text,text,text,text,timestamptz,boolean)'::regprocedure);
 body:=replace(original, ' IF f.state=''awaiting_reply'' THEN',
 ' IF f.state IN (''awaiting_reply'',''awaiting_reason'') AND (SELECT ai_enabled FROM clinic_private.referral_settings WHERE singleton) THEN
  UPDATE clinic_private.referral_flows SET state=''ai_pending'',ai_input_id=(SELECT id FROM public.whatsapp_messages WHERE provider_id=p_provider_id),ai_claim=NULL,ai_claimed_at=NULL,ai_questions=ARRAY[''phone_opening''] WHERE conversation_id=cid;
  RETURN;
 END IF;
 IF f.state=''awaiting_reply'' THEN');
 IF body=original THEN RAISE EXCEPTION 'Expected intake branch not found'; END IF;
 EXECUTE body;
END $patch$;
COMMIT;
