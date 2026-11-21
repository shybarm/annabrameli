BEGIN;
CREATE TABLE public.whatsapp_conversations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), phone text NOT NULL UNIQUE,
 name text NOT NULL DEFAULT '', clinic_id uuid REFERENCES public.clinics(id),
 source text NOT NULL DEFAULT 'incoming', bot_stage text NOT NULL DEFAULT 'human',
 answers jsonb NOT NULL DEFAULT '{}'::jsonb, opted_out boolean NOT NULL DEFAULT false,
 bot_started_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(), unread boolean NOT NULL DEFAULT true
);
CREATE TABLE public.whatsapp_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id),
 provider_id text UNIQUE, direction text NOT NULL CHECK(direction IN ('incoming','outgoing')),
 body text NOT NULL, message_type text NOT NULL DEFAULT 'text', status text NOT NULL DEFAULT 'received',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.whatsapp_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ordinal bigint GENERATED ALWAYS AS IDENTITY, message_id uuid NOT NULL UNIQUE REFERENCES public.whatsapp_messages(id),
 state text NOT NULL DEFAULT 'pending', error_code text, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.whatsapp_bot_settings (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), dispatch_token uuid NOT NULL DEFAULT gen_random_uuid(),
 vault_id uuid NOT NULL, setup_state text NOT NULL DEFAULT 'pending', updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.whatsapp_bot_settings(vault_id)
 SELECT vault.create_secret(gen_random_uuid()::text||gen_random_uuid()::text,'clinic_green_webhook','Clinic incoming WhatsApp authentication');
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_bot_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_conversations,public.whatsapp_messages,public.whatsapp_outbox,public.whatsapp_bot_settings FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.whatsapp_conversations,public.whatsapp_messages,public.whatsapp_outbox,public.whatsapp_bot_settings TO service_role;
GRANT SELECT ON public.whatsapp_conversations,public.whatsapp_messages TO authenticated;
CREATE POLICY "Clinic staff read WhatsApp conversations" ON public.whatsapp_conversations FOR SELECT TO authenticated USING(public.can_edit_appointments(auth.uid()));
CREATE POLICY "Clinic staff read WhatsApp messages" ON public.whatsapp_messages FOR SELECT TO authenticated USING(public.can_edit_appointments(auth.uid()));

CREATE FUNCTION public.whatsapp_bot_config() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('dispatch_token',s.dispatch_token,'webhook_secret',v.decrypted_secret,'setup_state',s.setup_state)
 FROM public.whatsapp_bot_settings s JOIN vault.decrypted_secrets v ON v.id=s.vault_id
$$;
REVOKE ALL ON FUNCTION public.whatsapp_bot_config() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.whatsapp_bot_config() TO service_role;

CREATE FUNCTION public.queue_whatsapp_text(p_conversation uuid,p_body text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE message uuid;
BEGIN
 INSERT INTO public.whatsapp_messages(conversation_id,direction,body,status) VALUES(p_conversation,'outgoing',p_body,'pending') RETURNING id INTO message;
 INSERT INTO public.whatsapp_outbox(message_id) VALUES(message);
 RETURN message;
END $$;
REVOKE ALL ON FUNCTION public.queue_whatsapp_text(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.queue_whatsapp_text(uuid,text) TO service_role;

CREATE FUNCTION public.register_whatsapp_waitlist(p_name text,p_phone text,p_clinic uuid,p_start boolean DEFAULT false) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.whatsapp_conversations%ROWTYPE;
BEGIN
 IF p_phone !~ '^9725[0-9]{8}$' OR length(trim(p_name))<2 THEN RAISE EXCEPTION 'Invalid contact'; END IF;
 INSERT INTO public.whatsapp_conversations(phone,name,clinic_id,source) VALUES(p_phone,left(p_name,120),p_clinic,'waitlist') ON CONFLICT(phone) DO NOTHING;
 SELECT * INTO c FROM public.whatsapp_conversations WHERE phone=p_phone FOR UPDATE;
 -- Never restart an active conversation or bypass an opt-out on repeated form submissions.
 IF NOT p_start OR c.opted_out OR c.bot_started_at IS NOT NULL THEN RETURN c.id; END IF;
 UPDATE public.whatsapp_conversations SET name=left(p_name,120),source='waitlist',bot_stage='reason',bot_started_at=now(),updated_at=now(),unread=true WHERE id=c.id;
 PERFORM public.queue_whatsapp_text(c.id,'שלום, כאן העוזר האוטומטי של מרפאת ד״ר אנה ברמלי. קיבלנו את בקשתך לרשימת ההמתנה. אשאל כמה שאלות קצרות כדי לעזור לצוות למצוא תור מתאים, והתשובות יישמרו במערכת המרפאה. אין כאן ייעוץ רפואי או הבטחה להקדמת תור. אפשר לכתוב ״נציג״ למענה אנושי או ״עצור״ להפסקת הבוט בכל שלב.'||chr(10)||chr(10)||'מה סיבת הפנייה בקצרה? אין צורך לשלוח תעודת זהות או מסמכים רפואיים כאן.');
 RETURN c.id;
END $$;
REVOKE ALL ON FUNCTION public.register_whatsapp_waitlist(text,text,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.register_whatsapp_waitlist(text,text,uuid,boolean) TO service_role;

CREATE FUNCTION public.receive_clinic_whatsapp(p_phone text,p_provider_id text,p_body text,p_type text,p_timestamp timestamptz,p_from_staff boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.whatsapp_conversations%ROWTYPE; mid uuid; reply text; next_stage text; normalized text;
BEGIN
 IF p_phone !~ '^[1-9][0-9]{7,14}$' OR length(p_provider_id)>200 OR p_provider_id='' THEN RETURN; END IF;
 INSERT INTO public.whatsapp_conversations(phone) VALUES(p_phone) ON CONFLICT(phone) DO NOTHING;
 SELECT * INTO c FROM public.whatsapp_conversations WHERE phone=p_phone FOR UPDATE;
 INSERT INTO public.whatsapp_messages(conversation_id,provider_id,direction,body,message_type,created_at)
 VALUES(c.id,p_provider_id,CASE WHEN p_from_staff THEN 'outgoing' ELSE 'incoming' END,left(p_body,4000),p_type,p_timestamp)
 ON CONFLICT(provider_id) DO NOTHING RETURNING id INTO mid;
 IF mid IS NULL THEN RETURN; END IF;
 UPDATE public.whatsapp_conversations SET updated_at=now(),unread=NOT p_from_staff WHERE id=c.id;
 IF p_from_staff THEN
   UPDATE public.whatsapp_conversations SET bot_stage='human' WHERE id=c.id;
   UPDATE public.whatsapp_outbox o SET state='cancelled' FROM public.whatsapp_messages m WHERE m.id=o.message_id AND m.conversation_id=c.id AND o.state='pending';
   RETURN;
 END IF;
 normalized := lower(trim(p_body));
 IF normalized IN ('עצור','הסר','הסרה','stop','unsubscribe','ביטול') THEN
   UPDATE public.whatsapp_conversations SET opted_out=true,bot_stage='stopped' WHERE id=c.id;
   UPDATE public.whatsapp_outbox o SET state='cancelled' FROM public.whatsapp_messages m WHERE m.id=o.message_id AND m.conversation_id=c.id AND o.state='pending';
   IF NOT c.opted_out THEN PERFORM public.queue_whatsapp_text(c.id,'הבוט נעצר. צוות המרפאה יוכל לעיין בפנייה שכבר התקבלה.'); END IF;
   RETURN;
 END IF;
 IF c.opted_out OR c.bot_stage IN ('human','completed','stopped') OR c.bot_started_at IS NULL OR p_timestamp<c.bot_started_at THEN RETURN; END IF;
 IF normalized IN ('נציג','נציג אנושי','מענה אנושי','בן אדם','human') OR p_type<>'text' THEN
   UPDATE public.whatsapp_conversations SET bot_stage='human' WHERE id=c.id;
   UPDATE public.whatsapp_outbox o SET state='cancelled' FROM public.whatsapp_messages m WHERE m.id=o.message_id AND m.conversation_id=c.id AND o.state='pending';
   PERFORM public.queue_whatsapp_text(c.id,'הפנייה הועברה להמשך טיפול של צוות המרפאה. ההודעות האוטומטיות נעצרו. הצוות ישיב בשעות הפעילות.');
   RETURN;
 END IF;
 IF length(normalized)<1 THEN RETURN; END IF;
 -- Answers remain verbatim for staff. No automated medical triage or priority scoring.
 UPDATE public.whatsapp_conversations SET answers=answers||jsonb_build_object(c.bot_stage,left(p_body,4000)) WHERE id=c.id;
 CASE c.bot_stage
 WHEN 'reason' THEN next_stage:='current_appointment'; reply:='האם כבר נקבע לך תור? אם כן, מה המועד? אם אין תור, אפשר לכתוב ״אין תור״.';
 WHEN 'current_appointment' THEN next_stage:='availability'; reply:='באילו ימים ושעות אפשר להגיע לתור מוקדם יותר? אפשר לציין גם ימים או שעות שלא מתאימים.';
 WHEN 'availability' THEN next_stage:='notice'; reply:='האם אפשר להגיע בהתראה קצרה, וכמה זמן מראש צריך לעדכן אותך? למשל: שעתיים, יום מראש, או שלא מתאים בהתראה קצרה.';
 WHEN 'notice' THEN next_stage:='format'; reply:='מה ההעדפה שלך: הגעה למרפאה בהוד השרון, תור טלפוני עם אפשרות לווידאו, או שתי האפשרויות? התאמת סוג הביקור תיבדק על ידי הצוות.';
 WHEN 'format' THEN next_stage:='completed'; reply:='תודה, התשובות נשמרו והועברו לצוות המרפאה לבדיקה מול התורים הפנויים. עדיין לא נקבע או הוקדם תור. אם יימצא מועד מתאים, הצוות ייצור איתך קשר. אפשר להשיב כאן עם פרטים נוספים.';
 ELSE RETURN;
 END CASE;
 UPDATE public.whatsapp_conversations SET bot_stage=next_stage WHERE id=c.id;
 PERFORM public.queue_whatsapp_text(c.id,reply);
END $$;
REVOKE ALL ON FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) TO service_role;

CREATE FUNCTION public.claim_clinic_whatsapp_outbox() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job record;
BEGIN
 SELECT o.id,m.id AS message_id,m.body,c.phone INTO job FROM public.whatsapp_outbox o
 JOIN public.whatsapp_messages m ON m.id=o.message_id JOIN public.whatsapp_conversations c ON c.id=m.conversation_id
 WHERE o.state='pending' AND NOT EXISTS(SELECT 1 FROM public.whatsapp_outbox earlier JOIN public.whatsapp_messages em ON em.id=earlier.message_id WHERE em.conversation_id=c.id AND earlier.ordinal<o.ordinal AND earlier.state IN ('pending','processing'))
 ORDER BY o.ordinal LIMIT 1 FOR UPDATE OF o SKIP LOCKED;
 IF NOT FOUND THEN RETURN NULL; END IF;
 UPDATE public.whatsapp_outbox SET state='processing',updated_at=now() WHERE id=job.id;
 UPDATE public.whatsapp_messages SET status='processing' WHERE id=job.message_id;
 RETURN to_jsonb(job);
END $$;
REVOKE ALL ON FUNCTION public.claim_clinic_whatsapp_outbox() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_clinic_whatsapp_outbox() TO service_role;

CREATE FUNCTION public.finish_clinic_whatsapp_outbox(p_id uuid,p_provider_id text,p_error text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE mid uuid;
BEGIN
 UPDATE public.whatsapp_outbox SET state=CASE WHEN p_provider_id IS NULL THEN 'failed' ELSE 'accepted' END,error_code=p_error,updated_at=now() WHERE id=p_id AND state='processing' RETURNING message_id INTO mid;
 IF mid IS NULL THEN RETURN; END IF;
 UPDATE public.whatsapp_messages SET provider_id=p_provider_id,status=CASE WHEN p_provider_id IS NULL THEN 'failed' ELSE 'accepted' END WHERE id=mid;
 IF p_provider_id IS NULL THEN
 UPDATE public.whatsapp_conversations SET bot_stage='human',unread=true WHERE id=(SELECT conversation_id FROM public.whatsapp_messages WHERE id=mid);
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.finish_clinic_whatsapp_outbox(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_clinic_whatsapp_outbox(uuid,text,text) TO service_role;

CREATE FUNCTION public.staff_whatsapp_action(p_conversation uuid,p_action text,p_text text DEFAULT '') RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT coalesce(public.can_edit_appointments(auth.uid()),false) THEN RAISE EXCEPTION 'Staff permission required'; END IF;
 IF p_action='read' THEN UPDATE public.whatsapp_conversations SET unread=false WHERE id=p_conversation; RETURN; END IF;
 IF p_action NOT IN ('pause','reply') THEN RAISE EXCEPTION 'Invalid action'; END IF;
 UPDATE public.whatsapp_conversations SET bot_stage='human',unread=false WHERE id=p_conversation;
 UPDATE public.whatsapp_outbox o SET state='cancelled' FROM public.whatsapp_messages m WHERE m.id=o.message_id AND m.conversation_id=p_conversation AND o.state='pending';
 IF p_action='reply' AND length(trim(p_text)) BETWEEN 1 AND 4000 THEN
   PERFORM public.queue_whatsapp_text(p_conversation,trim(p_text));
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.staff_whatsapp_action(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.staff_whatsapp_action(uuid,text,text) TO authenticated;

CREATE FUNCTION public.dispatch_clinic_whatsapp_bot() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE public.whatsapp_messages m SET status='failed' FROM public.whatsapp_outbox o WHERE o.message_id=m.id AND o.state='processing' AND o.updated_at<now()-interval '10 minutes';
 UPDATE public.whatsapp_outbox SET state='failed',error_code='delivery_uncertain',updated_at=now() WHERE state='processing' AND updated_at<now()-interval '10 minutes';
 PERFORM net.http_post(url:='https://ftatmcyrmeyhghgckvbj.supabase.co/functions/v1/clinic-whatsapp-bot',headers:='{"Content-Type":"application/json"}'::jsonb,body:=jsonb_build_object('action','tick','key',dispatch_token),timeout_milliseconds:=60000) FROM public.whatsapp_bot_settings;
END $$;
REVOKE ALL ON FUNCTION public.dispatch_clinic_whatsapp_bot() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_clinic_whatsapp_bot() TO service_role;
SELECT cron.schedule('clinic-whatsapp-bot','* * * * *','select public.dispatch_clinic_whatsapp_bot()');
COMMIT;
