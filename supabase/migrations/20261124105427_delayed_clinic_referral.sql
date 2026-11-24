BEGIN;
-- Explicit activation after server verification. No historical inquiries are enrolled.
CREATE TABLE clinic_private.referral_settings(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), enabled boolean NOT NULL DEFAULT false, test_mode boolean NOT NULL DEFAULT true, test_phone text CHECK(test_phone ~ '^9725[0-9]{8}$'));
INSERT INTO clinic_private.referral_settings DEFAULT VALUES;
CREATE TABLE clinic_private.referral_flows (
 conversation_id uuid PRIMARY KEY REFERENCES public.whatsapp_conversations(id),
 source text NOT NULL CHECK(source IN ('contact_form','phone_ivr')),
 state text NOT NULL CHECK(state IN ('scheduled','awaiting_reply','completed','cancelled')),
 due_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 welcome_id uuid REFERENCES public.whatsapp_messages(id), reply_id uuid REFERENCES public.whatsapp_messages(id)
);
ALTER TABLE clinic_private.referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_private.referral_flows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clinic_private.referral_settings,clinic_private.referral_flows FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.schedule_clinic_referral(p_phone text,p_name text,p_source text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.whatsapp_conversations%ROWTYPE;
BEGIN
 IF NOT (SELECT enabled FROM clinic_private.referral_settings WHERE singleton) THEN RETURN 'disabled'; END IF;
 IF (SELECT test_mode AND p_phone IS DISTINCT FROM test_phone FROM clinic_private.referral_settings WHERE singleton) THEN RETURN 'disabled'; END IF;
 IF p_source NOT IN ('contact_form','phone_ivr') OR p_phone !~ '^9725[0-9]{8}$' THEN RETURN 'ineligible'; END IF;
 INSERT INTO public.whatsapp_conversations(phone,name,source) VALUES(p_phone,left(p_name,120),p_source) ON CONFLICT(phone) DO NOTHING;
 SELECT * INTO c FROM public.whatsapp_conversations WHERE phone=p_phone FOR UPDATE;
 -- Do not restart existing flows, withdrawn consent, staff conversations, or another active bot.
 IF c.opted_out OR c.whatsapp_consent_withdrawn_at IS NOT NULL THEN RETURN 'suppressed'; END IF;
 IF EXISTS(SELECT 1 FROM clinic_private.referral_flows WHERE conversation_id=c.id) THEN RETURN 'duplicate'; END IF;
 IF (c.bot_started_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE conversation_id=c.id))
 AND NOT (SELECT test_mode AND test_phone=p_phone FROM clinic_private.referral_settings WHERE singleton) THEN RETURN 'suppressed'; END IF;
 INSERT INTO clinic_private.referral_flows(conversation_id,source,state,due_at)
 VALUES(c.id,p_source,'scheduled',now()+CASE WHEN p_source='contact_form' THEN interval '20 minutes' ELSE interval '2 minutes' END);
 UPDATE public.whatsapp_conversations SET whatsapp_consent_at=now(),whatsapp_consent_scope=p_source||'_service_reply',bot_started_at=now() WHERE id=c.id;
 RETURN 'scheduled';
END $$;
REVOKE ALL ON FUNCTION public.schedule_clinic_referral(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_clinic_referral(text,text,text) TO service_role;

CREATE FUNCTION public.queue_due_clinic_referrals() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c record; f clinic_private.referral_flows%ROWTYPE; mid uuid;
BEGIN
 IF NOT (SELECT enabled FROM clinic_private.referral_settings WHERE singleton) THEN RETURN; END IF;
 -- Lock conversations first, matching receive/staff paths and preventing double dispatch.
 FOR c IN SELECT w.id,w.opted_out FROM public.whatsapp_conversations w
 JOIN clinic_private.referral_flows r ON r.conversation_id=w.id
 WHERE r.state='scheduled' AND r.due_at<=now()
 AND EXISTS(SELECT 1 FROM clinic_private.referral_settings s WHERE s.singleton AND (NOT s.test_mode OR s.test_phone=w.phone)) FOR UPDATE OF w SKIP LOCKED LOOP
  SELECT * INTO f FROM clinic_private.referral_flows WHERE conversation_id=c.id;
  IF c.opted_out THEN UPDATE clinic_private.referral_flows SET state='cancelled' WHERE conversation_id=c.id; CONTINUE; END IF;
  mid:=public.queue_whatsapp_text(c.id,
   CASE WHEN f.source='phone_ivr' THEN 'היי, תודה שהתקשרתם למרפאת ד״ר אנה ברמלי.' ELSE 'היי, תודה שמילאתם את הטופס באתר של מרפאת ד״ר אנה ברמלי.' END
   ||chr(10)||'כאן המענה האוטומטי של המרפאה מטעם שי. למי התור, לילד/ה או למבוגר/ת?'
   ||chr(10)||'למענה מהצוות כתבו ״נציג״, ולהפסקת הודעות ״הסר״.');
  UPDATE clinic_private.referral_flows SET state='awaiting_reply',welcome_id=mid WHERE conversation_id=c.id;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.queue_due_clinic_referrals() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.queue_due_clinic_referrals() TO service_role;
SELECT cron.schedule('clinic-referral-welcome','* * * * *','select public.queue_due_clinic_referrals()');

-- Preserve the existing receiver and its message storage/opt-out logic unchanged.
ALTER FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) RENAME TO receive_clinic_whatsapp_before_referral;
REVOKE ALL ON FUNCTION public.receive_clinic_whatsapp_before_referral(text,text,text,text,timestamptz,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.receive_clinic_whatsapp(p_phone text,p_provider_id text,p_body text,p_type text,p_timestamp timestamptz,p_from_staff boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cid uuid; f clinic_private.referral_flows%ROWTYPE; normalized text; mid uuid;
BEGIN
 SELECT id INTO cid FROM public.whatsapp_conversations WHERE phone=p_phone FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE provider_id=p_provider_id) THEN RETURN; END IF;
 PERFORM public.receive_clinic_whatsapp_before_referral(p_phone,p_provider_id,p_body,p_type,p_timestamp,p_from_staff);
 IF cid IS NULL OR NOT EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE provider_id=p_provider_id AND conversation_id=cid) THEN RETURN; END IF;
 SELECT * INTO f FROM clinic_private.referral_flows WHERE conversation_id=cid;
 IF NOT FOUND THEN RETURN; END IF;
 IF p_from_staff THEN
  UPDATE clinic_private.referral_flows SET state='cancelled' WHERE conversation_id=cid;
  UPDATE public.whatsapp_outbox SET state='cancelled' WHERE message_id IN (f.welcome_id,f.reply_id) AND state='pending';
  UPDATE public.whatsapp_messages SET status='cancelled' WHERE id IN (f.welcome_id,f.reply_id) AND status='pending';
  RETURN;
 END IF;
 IF f.state NOT IN ('scheduled','awaiting_reply') THEN RETURN; END IF;
 normalized:=lower(trim(p_body));
 IF p_from_staff OR p_type<>'text' OR normalized IN ('עצור','הסר','הסרה','stop','unsubscribe','ביטול','נציג','נציג אנושי','מענה אנושי','בן אדם','human')
 OR f.state='scheduled' OR NOT (SELECT enabled AND (NOT test_mode OR test_phone=p_phone) FROM clinic_private.referral_settings WHERE singleton) THEN
  UPDATE clinic_private.referral_flows SET state='cancelled' WHERE conversation_id=cid;
  UPDATE public.whatsapp_outbox SET state='cancelled' WHERE message_id=f.welcome_id AND state='pending';
  UPDATE public.whatsapp_messages SET status='cancelled' WHERE id=f.welcome_id AND status='pending';
  RETURN;
 END IF;
 IF normalized='' OR p_timestamp<f.created_at THEN RETURN; END IF;
 -- Wait for provider acceptance; a failed/unconfirmed welcome never starts a reply loop.
 IF NOT EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE id=f.welcome_id AND status IN ('accepted','sent','delivered','read') AND p_timestamp>=created_at) THEN RETURN; END IF;
 mid:=public.queue_whatsapp_text(cid,
 'תודה. כרגע אין תורים פנויים אצל ד״ר אנה ברמלי. מומלץ לבדוק תור לאלרגולוג בקופת החולים.'||chr(10)||chr(10)||
 'אפשר גם לבדוק מול המרפאות הבאות:'||chr(10)||
 'ד״ר יורם פייטלסון, תל אביב. אפשר לבקש את שרון, מנהלת המשרד.'||chr(10)||'https://drallergy.co.il/'||chr(10)||chr(10)||
 'פרופ׳ אבי ביגלמן, רעננה:'||chr(10)||'https://medspace.co.il/פרופ-אבי-ביגלמן/'||chr(10)||chr(10)||
 'אפשר לציין שהופניתם ממרפאת ד״ר אנה ברמלי ולשאול על תור מוקדם. אין הבטחה לזמינות או להקדמה; יש לבדוק גם התאמה לגיל המטופל.'||chr(10)||
 'בריאות שלמה 🌷');
 UPDATE clinic_private.referral_flows SET state='completed',reply_id=mid WHERE conversation_id=cid;
END $$;
REVOKE ALL ON FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) TO service_role;

ALTER FUNCTION public.staff_whatsapp_action(uuid,text,text) RENAME TO staff_whatsapp_action_before_referral;
REVOKE ALL ON FUNCTION public.staff_whatsapp_action_before_referral(uuid,text,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.staff_whatsapp_action(p_conversation uuid,p_action text,p_text text DEFAULT '') RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.staff_whatsapp_action_before_referral(p_conversation,p_action,p_text);
 IF p_action IN ('pause','reply') THEN
 UPDATE clinic_private.referral_flows SET state='cancelled' WHERE conversation_id=p_conversation AND state IN ('scheduled','awaiting_reply');
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.staff_whatsapp_action(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.staff_whatsapp_action(uuid,text,text) TO authenticated;
COMMIT;
