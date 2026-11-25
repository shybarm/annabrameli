BEGIN;
CREATE FUNCTION clinic_private.next_service_reply(at_time timestamptz) RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE local_time timestamp:=at_time AT TIME ZONE 'Asia/Jerusalem';
BEGIN
 IF local_time::time>time '20:30' THEN local_time:=date_trunc('day',local_time)+interval '1 day 8 hours 30 minutes';
 ELSIF local_time::time<time '08:30' THEN local_time:=date_trunc('day',local_time)+interval '8 hours 30 minutes'; END IF;
 WHILE extract(isodow FROM local_time) IN (5,6) LOOP
  local_time:=date_trunc('day',local_time)+interval '1 day 8 hours 30 minutes';
 END LOOP;
 RETURN local_time AT TIME ZONE 'Asia/Jerusalem';
END $$;
REVOKE ALL ON FUNCTION clinic_private.next_service_reply(timestamptz) FROM PUBLIC,anon,authenticated;
ALTER TABLE clinic_private.referral_flows DROP CONSTRAINT referral_flows_source_check;
ALTER TABLE clinic_private.referral_flows ADD CONSTRAINT referral_flows_source_check CHECK(source IN ('contact_form','phone_ivr','whatsapp_inbound','waitlist_form'));
-- Schedule only new requests; do not revive existing conversations or backfill patients.
CREATE OR REPLACE FUNCTION public.register_whatsapp_waitlist(p_name text,p_phone text,p_clinic uuid,p_start boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.whatsapp_conversations%ROWTYPE;
BEGIN
 IF p_phone !~ '^9725[0-9]{8}$' OR length(trim(p_name))<2 THEN RAISE EXCEPTION 'Invalid contact'; END IF;
 INSERT INTO public.whatsapp_conversations(phone,name,clinic_id,source) VALUES(p_phone,left(p_name,120),p_clinic,'waitlist') ON CONFLICT(phone) DO NOTHING;
 SELECT * INTO c FROM public.whatsapp_conversations WHERE phone=p_phone FOR UPDATE;
 IF NOT p_start OR c.opted_out OR c.whatsapp_consent_withdrawn_at IS NOT NULL THEN RETURN c.id; END IF;
 UPDATE public.whatsapp_conversations SET whatsapp_consent_at=coalesce(whatsapp_consent_at,now()),whatsapp_consent_scope='website_waitlist_updates' WHERE id=c.id;
 IF c.bot_started_at IS NOT NULL OR EXISTS(SELECT 1 FROM clinic_private.referral_flows WHERE conversation_id=c.id) OR EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE conversation_id=c.id) THEN RETURN c.id; END IF;
 UPDATE public.whatsapp_conversations SET name=left(p_name,120),source='waitlist',bot_stage='human',bot_started_at=now(),updated_at=now(),unread=true WHERE id=c.id;
 INSERT INTO clinic_private.referral_flows(conversation_id,source,state,due_at)
 VALUES(c.id,'waitlist_form','scheduled',clinic_private.next_service_reply(now()+interval '20 minutes'));
 RETURN c.id;
END $$;
-- Apply the same initial-message service hours to form and IVR requests.
ALTER FUNCTION public.schedule_clinic_referral(text,text,text,text) RENAME TO schedule_clinic_referral_before_hours;
REVOKE ALL ON FUNCTION public.schedule_clinic_referral_before_hours(text,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.schedule_clinic_referral(p_phone text,p_name text,p_source text,p_request_id text DEFAULT NULL) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result text;
BEGIN
 result:=public.schedule_clinic_referral_before_hours(p_phone,p_name,p_source,p_request_id);
 IF result='scheduled' THEN
  UPDATE clinic_private.referral_flows r SET due_at=clinic_private.next_service_reply(r.due_at)
  FROM public.whatsapp_conversations c WHERE c.id=r.conversation_id AND c.phone=p_phone AND r.state='scheduled';
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.schedule_clinic_referral(text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_clinic_referral(text,text,text,text) TO service_role;
ALTER FUNCTION public.queue_due_clinic_referrals() RENAME TO queue_due_clinic_referrals_before_waitlist;
REVOKE ALL ON FUNCTION public.queue_due_clinic_referrals_before_waitlist() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.queue_due_clinic_referrals() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c record; mid uuid;
BEGIN
 -- Re-evaluate dispatch time too: delayed workers must not send during quiet hours.
 UPDATE clinic_private.referral_flows SET due_at=clinic_private.next_service_reply(clock_timestamp())
 WHERE state='scheduled' AND due_at<=clock_timestamp() AND clinic_private.next_service_reply(clock_timestamp())>clock_timestamp();
 UPDATE clinic_private.referral_flows r SET state='cancelled' FROM public.whatsapp_conversations w WHERE w.id=r.conversation_id AND r.source='waitlist_form' AND r.state='scheduled' AND (w.opted_out OR w.whatsapp_consent_withdrawn_at IS NOT NULL);
 FOR c IN SELECT w.id FROM public.whatsapp_conversations w JOIN clinic_private.referral_flows r ON r.conversation_id=w.id
 JOIN clinic_private.referral_settings s ON s.singleton
 WHERE s.enabled AND (NOT s.test_mode OR s.test_phone=w.phone) AND NOT w.opted_out AND w.whatsapp_consent_withdrawn_at IS NULL
 AND r.source='waitlist_form' AND r.state='scheduled' AND r.due_at<=clock_timestamp()
 FOR UPDATE OF w SKIP LOCKED LOOP
  mid:=public.queue_whatsapp_text(c.id,'שלום, כאן מרפאת ד״ר אנה ברמלי. קיבלנו את הפרטים שלך והכנסנו אותך לרשימת ההמתנה. נעדכן אותך כאן בוואטסאפ אם יתפנה תור מתאים או אם יהיה שינוי בנוגע לפנייה שלך.'||chr(10)||chr(10)||
  'אין צורך לעשות דבר נוסף כרגע. אם נוח לך, אפשר להשיב ״תודה״ כדי שנדע שההודעה הגיעה. התגובה אינה תנאי לרישום או לקבלת עדכונים.'||chr(10)||chr(10)||
  'אפשר לשלוח לך גם פרטים של שני רופאי אלרגיה מומלצים שלמיטב ידיעתנו יש להם יותר זמינות כרגע?'||chr(10)||chr(10)||'להפסקת עדכונים בוואטסאפ אפשר להשיב ״הסר״.');
  UPDATE clinic_private.referral_flows SET state='awaiting_consent',welcome_id=mid,ai_message_id=mid WHERE conversation_id=c.id;
 END LOOP;
 PERFORM public.queue_due_clinic_referrals_before_waitlist();
END $$;
REVOKE ALL ON FUNCTION public.queue_due_clinic_referrals() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.queue_due_clinic_referrals() TO service_role;
COMMIT;
