BEGIN;
ALTER TABLE public.whatsapp_conversations ADD COLUMN whatsapp_consent_at timestamptz, ADD COLUMN whatsapp_consent_scope text, ADD COLUMN whatsapp_consent_withdrawn_at timestamptz;
-- Stop outstanding questionnaires without deleting earlier messages or answers.
UPDATE public.whatsapp_outbox o SET state='cancelled' FROM public.whatsapp_messages m,public.whatsapp_conversations c WHERE m.id=o.message_id AND c.id=m.conversation_id AND c.source='waitlist' AND o.state='pending';
UPDATE public.whatsapp_messages m SET status='cancelled' FROM public.whatsapp_outbox o WHERE o.message_id=m.id AND o.state='cancelled';
UPDATE public.whatsapp_conversations SET bot_stage='human' WHERE source='waitlist' AND bot_stage IN ('reason','current_appointment','availability','notice','format');
CREATE OR REPLACE FUNCTION public.register_whatsapp_waitlist(p_name text,p_phone text,p_clinic uuid,p_start boolean DEFAULT false) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.whatsapp_conversations%ROWTYPE;
BEGIN
 IF p_phone !~ '^9725[0-9]{8}$' OR length(trim(p_name))<2 THEN RAISE EXCEPTION 'Invalid contact'; END IF;
 INSERT INTO public.whatsapp_conversations(phone,name,clinic_id,source) VALUES(p_phone,left(p_name,120),p_clinic,'waitlist') ON CONFLICT(phone) DO NOTHING;
 SELECT * INTO c FROM public.whatsapp_conversations WHERE phone=p_phone FOR UPDATE;
 IF NOT p_start OR c.opted_out THEN RETURN c.id; END IF;
 UPDATE public.whatsapp_conversations SET whatsapp_consent_at=coalesce(whatsapp_consent_at,now()),whatsapp_consent_scope='website_waitlist_updates' WHERE id=c.id;
 IF c.bot_started_at IS NOT NULL THEN RETURN c.id; END IF;
 UPDATE public.whatsapp_conversations SET name=left(p_name,120),source='waitlist',bot_stage='human',bot_started_at=now(),updated_at=now(),unread=true WHERE id=c.id;
 PERFORM public.queue_whatsapp_text(c.id,'שלום, כאן מרפאת ד״ר אנה ברמלי. קיבלנו את הפרטים שלך והכנסנו אותך לרשימת ההמתנה. נעדכן אותך כאן בוואטסאפ אם יתפנה תור מתאים או אם יהיה שינוי בנוגע לפנייה שלך.'||chr(10)||chr(10)||'אין צורך לעשות דבר נוסף כרגע. אם נוח לך, אפשר להשיב ״תודה״ כדי שנדע שההודעה הגיעה. התגובה אינה תנאי לרישום או לקבלת עדכונים.'||chr(10)||chr(10)||'להפסקת עדכונים בוואטסאפ אפשר להשיב ״הסר״.');
 RETURN c.id;
END $$;
CREATE OR REPLACE FUNCTION public.receive_clinic_whatsapp(p_phone text,p_provider_id text,p_body text,p_type text,p_timestamp timestamptz,p_from_staff boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.whatsapp_conversations%ROWTYPE; mid uuid; normalized text;
BEGIN
 IF p_phone !~ '^[1-9][0-9]{7,14}$' OR length(p_provider_id)>200 OR p_provider_id='' THEN RETURN; END IF;
 INSERT INTO public.whatsapp_conversations(phone) VALUES(p_phone) ON CONFLICT(phone) DO NOTHING;
 SELECT * INTO c FROM public.whatsapp_conversations WHERE phone=p_phone FOR UPDATE;
 INSERT INTO public.whatsapp_messages(conversation_id,provider_id,direction,body,message_type,created_at)
 VALUES(c.id,p_provider_id,CASE WHEN p_from_staff THEN 'outgoing' ELSE 'incoming' END,left(p_body,4000),p_type,p_timestamp)
 ON CONFLICT(provider_id) DO NOTHING RETURNING id INTO mid;
 IF mid IS NULL THEN RETURN; END IF;
 UPDATE public.whatsapp_conversations SET updated_at=now(),unread=NOT p_from_staff,bot_stage=CASE WHEN opted_out THEN 'stopped' ELSE 'human' END WHERE id=c.id;
 IF p_from_staff THEN RETURN; END IF;
 normalized:=lower(trim(p_body));
 IF normalized IN ('עצור','הסר','הסרה','stop','unsubscribe','ביטול') THEN
  UPDATE public.whatsapp_conversations SET opted_out=true,bot_stage='stopped',whatsapp_consent_withdrawn_at=now() WHERE id=c.id;
  UPDATE public.whatsapp_outbox o SET state='cancelled' FROM public.whatsapp_messages m WHERE m.id=o.message_id AND m.conversation_id=c.id AND o.state='pending';
  UPDATE public.whatsapp_messages m SET status='cancelled' FROM public.whatsapp_outbox o WHERE o.message_id=m.id AND m.conversation_id=c.id AND o.state='cancelled';
  IF NOT c.opted_out THEN PERFORM public.queue_whatsapp_text(c.id,'קיבלנו את בקשתך להפסיק עדכונים בוואטסאפ. ההעדפה נשמרה במערכת המרפאה.'); END IF;
 END IF;
 -- All other replies are saved for staff. No questionnaire and no auto-reply loop.
END $$;
COMMIT;
