BEGIN;
DO $patch$
DECLARE body text;
BEGIN
 body:=pg_get_functiondef('clinic_private.schedule_referral_offer(uuid)'::regprocedure);
 body:=replace(body,'כרגע הזמינות שלנו מצומצמת. אשלח לך בעוד כמה דקות את האפשרויות להמשך.','אין לנו ככ זמינות תורים אבל אני שנייה אני בודק אולי בכל זאת יש תור פנוי...');
 EXECUTE body;
END $patch$;
CREATE TABLE clinic_private.whatsapp_waitlist_intake(conversation_id uuid PRIMARY KEY REFERENCES public.whatsapp_conversations(id),awaiting_name boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE clinic_private.whatsapp_waitlist_intake ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clinic_private.whatsapp_waitlist_intake FROM PUBLIC,anon,authenticated;
ALTER FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) RENAME TO receive_clinic_whatsapp_before_waitlist;
CREATE FUNCTION public.receive_clinic_whatsapp(p_phone text,p_provider_id text,p_body text,p_type text,p_timestamp timestamptz,p_from_staff boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cid uuid; waiting boolean; txt text;
BEGIN
 IF EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE provider_id=p_provider_id) THEN RETURN; END IF;
 SELECT id INTO cid FROM public.whatsapp_conversations WHERE phone=p_phone FOR UPDATE;
 txt:=trim(p_body);
 SELECT awaiting_name INTO waiting FROM clinic_private.whatsapp_waitlist_intake WHERE conversation_id=cid;
 IF NOT p_from_staff AND p_type='text' AND (coalesce(waiting,false) OR (txt ~ 'רשימת המתנה|רשימה להמתנה' AND txt !~ 'לא רוצה|לא מעוניין|אל תכניס|להסיר|למחוק'))
 AND txt NOT IN ('הסר','עצור','ביטול','לא','לא תודה','נציג')
 AND NOT EXISTS(SELECT 1 FROM public.whatsapp_conversations WHERE id=cid AND opted_out)
 AND EXISTS(SELECT 1 FROM clinic_private.referral_settings WHERE singleton AND enabled AND (NOT test_mode OR test_phone=p_phone)) THEN
  PERFORM public.receive_clinic_whatsapp_before_referral(p_phone,p_provider_id,p_body,p_type,p_timestamp,false);
  SELECT id INTO cid FROM public.whatsapp_conversations WHERE phone=p_phone FOR UPDATE;
  IF cid IS NULL OR NOT EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE provider_id=p_provider_id AND conversation_id=cid) THEN RETURN; END IF;
  UPDATE clinic_private.referral_flows SET state='cancelled',ai_claim=NULL WHERE conversation_id=cid;
  UPDATE public.whatsapp_outbox o SET state='cancelled' FROM public.whatsapp_messages m WHERE m.id=o.message_id AND m.conversation_id=cid AND o.state='pending' AND m.id IN (SELECT unnest(ARRAY[welcome_id,question_id,ai_message_id,reply_id]) FROM clinic_private.referral_flows WHERE conversation_id=cid);
  UPDATE public.whatsapp_messages SET status='cancelled' WHERE conversation_id=cid AND status='pending' AND id IN (SELECT unnest(ARRAY[welcome_id,question_id,ai_message_id,reply_id]) FROM clinic_private.referral_flows WHERE conversation_id=cid);
  IF coalesce(waiting,false) AND length(txt) BETWEEN 4 AND 120 AND txt ~ '^[א-תA-Za-z]+([ ''-]+[א-תA-Za-z]+)+$' AND txt !~ 'רשימת|אפשר|למה|רוצה|תודה|תור|אלרגיה' THEN
   UPDATE public.whatsapp_conversations SET name=txt,source='waitlist',bot_stage='human',unread=true,updated_at=now(),whatsapp_consent_at=now(),whatsapp_consent_scope='requested_waitlist' WHERE id=cid;
   UPDATE clinic_private.whatsapp_waitlist_intake SET awaiting_name=false WHERE conversation_id=cid;
   PERFORM public.queue_whatsapp_text(cid,'הכנסתי אותך לרשימת ההמתנה.');
  ELSE
   INSERT INTO clinic_private.whatsapp_waitlist_intake(conversation_id) VALUES(cid) ON CONFLICT(conversation_id) DO UPDATE SET awaiting_name=true;
   PERFORM public.queue_whatsapp_text(cid,'מה השם המלא כדי שאוכל להוסיף אותך לרשימת ההמתנה?');
  END IF;
  RETURN;
 END IF;
 IF p_from_staff OR txt IN ('הסר','עצור','ביטול','לא','לא תודה','נציג') THEN
  UPDATE clinic_private.whatsapp_waitlist_intake SET awaiting_name=false WHERE conversation_id=cid;
 END IF;
 PERFORM public.receive_clinic_whatsapp_before_waitlist(p_phone,p_provider_id,p_body,p_type,p_timestamp,p_from_staff);
END $$;
REVOKE ALL ON FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) TO service_role;
COMMIT;
