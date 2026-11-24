BEGIN;
ALTER TABLE clinic_private.referral_flows ADD COLUMN request_id text;
CREATE TABLE clinic_private.referral_flow_history(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),archived_at timestamptz NOT NULL DEFAULT now(),snapshot jsonb NOT NULL);
ALTER TABLE clinic_private.referral_flow_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clinic_private.referral_flow_history FROM PUBLIC,anon,authenticated;
CREATE TABLE clinic_private.referral_phone_events(request_id text PRIMARY KEY,conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id),created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE clinic_private.referral_phone_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clinic_private.referral_phone_events FROM PUBLIC,anon,authenticated;
DROP FUNCTION public.schedule_clinic_referral(text,text,text);
CREATE FUNCTION public.schedule_clinic_referral(p_phone text,p_name text,p_source text,p_request_id text DEFAULT NULL) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.whatsapp_conversations%ROWTYPE; prior clinic_private.referral_flows%ROWTYPE;
BEGIN
 IF NOT (SELECT enabled FROM clinic_private.referral_settings WHERE singleton) THEN RETURN 'disabled'; END IF;
 IF (SELECT test_mode AND p_phone IS DISTINCT FROM test_phone FROM clinic_private.referral_settings WHERE singleton) THEN RETURN 'disabled'; END IF;
 IF p_source NOT IN ('contact_form','phone_ivr') OR p_phone !~ '^9725[0-9]{8}$' THEN RETURN 'ineligible'; END IF;
 INSERT INTO public.whatsapp_conversations(phone,name,source) VALUES(p_phone,left(p_name,120),p_source) ON CONFLICT(phone) DO NOTHING;
 SELECT * INTO c FROM public.whatsapp_conversations WHERE phone=p_phone FOR UPDATE;
 -- Do not restart existing flows, withdrawn consent, staff conversations, or another active bot.
 IF c.opted_out OR c.whatsapp_consent_withdrawn_at IS NOT NULL THEN RETURN 'suppressed'; END IF;
 IF p_source='phone_ivr' AND p_request_id ~ '^[a-f0-9]{64}$' THEN
  INSERT INTO clinic_private.referral_phone_events(request_id,conversation_id) VALUES(p_request_id,c.id) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 'duplicate'; END IF;
 END IF;
 SELECT * INTO prior FROM clinic_private.referral_flows WHERE conversation_id=c.id;
 IF FOUND THEN
  IF p_source='phone_ivr' AND p_request_id ~ '^[a-f0-9]{64}$' AND prior.state='completed' AND prior.request_id IS DISTINCT FROM p_request_id THEN
   INSERT INTO clinic_private.referral_flow_history(snapshot) VALUES(to_jsonb(prior));
   UPDATE clinic_private.referral_flows SET source=p_source,state='scheduled',created_at=now(),due_at=now()+interval '2 minutes',welcome_id=NULL,question_id=NULL,reply_id=NULL,ai_input_id=NULL,ai_claim=NULL,ai_claimed_at=NULL,ai_message_id=NULL,ai_questions='{}',ai_last_origin=NULL,request_id=p_request_id WHERE conversation_id=c.id;
   RETURN 'scheduled';
  END IF;
  RETURN 'duplicate';
 END IF;
 IF (c.bot_started_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE conversation_id=c.id))
 AND NOT (SELECT test_mode AND test_phone=p_phone FROM clinic_private.referral_settings WHERE singleton) THEN RETURN 'suppressed'; END IF;
 INSERT INTO clinic_private.referral_flows(conversation_id,source,state,due_at,request_id)
 VALUES(c.id,p_source,'scheduled',now()+CASE WHEN p_source='contact_form' THEN interval '20 minutes' ELSE interval '2 minutes' END,p_request_id);
 UPDATE public.whatsapp_conversations SET whatsapp_consent_at=now(),whatsapp_consent_scope=p_source||'_service_reply',bot_started_at=now() WHERE id=c.id;
 RETURN 'scheduled';
END $$;
REVOKE ALL ON FUNCTION public.schedule_clinic_referral(text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_clinic_referral(text,text,text,text) TO service_role;

COMMIT;
