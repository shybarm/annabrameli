BEGIN;
ALTER TABLE clinic_private.referral_flows ADD COLUMN question_id uuid REFERENCES public.whatsapp_messages(id);
ALTER TABLE clinic_private.referral_flows DROP CONSTRAINT referral_flows_state_check;
ALTER TABLE clinic_private.referral_flows ADD CONSTRAINT referral_flows_state_check CHECK(state IN ('scheduled','awaiting_reply','awaiting_reason','completed','cancelled'));
CREATE OR REPLACE FUNCTION public.queue_due_clinic_referrals() RETURNS void
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
   ||chr(10)||'כאן המענה האוטומטי של המרפאה מטעם שי. למי התור, לילד/ה או למבוגר/ת?');
  UPDATE clinic_private.referral_flows SET state='awaiting_reply',welcome_id=mid WHERE conversation_id=c.id;
 END LOOP;
END $$;
-- A missing test recipient must stop a pending reply, never bypass the test gate.
CREATE OR REPLACE FUNCTION public.receive_clinic_whatsapp(p_phone text,p_provider_id text,p_body text,p_type text,p_timestamp timestamptz,p_from_staff boolean DEFAULT false)
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
  UPDATE public.whatsapp_outbox SET state='cancelled' WHERE message_id IN (f.welcome_id,f.question_id,f.reply_id) AND state='pending';
  UPDATE public.whatsapp_messages SET status='cancelled' WHERE id IN (f.welcome_id,f.question_id,f.reply_id) AND status='pending';
  RETURN;
 END IF;
 IF f.state NOT IN ('scheduled','awaiting_reply','awaiting_reason') THEN RETURN; END IF;
 normalized:=lower(trim(p_body));
 IF p_from_staff OR p_type<>'text' OR normalized IN ('עצור','הסר','הסרה','stop','unsubscribe','ביטול','נציג','נציג אנושי','מענה אנושי','בן אדם','human')
 OR f.state='scheduled' OR NOT coalesce((SELECT enabled AND (NOT test_mode OR test_phone=p_phone) FROM clinic_private.referral_settings WHERE singleton),false) THEN
  UPDATE clinic_private.referral_flows SET state='cancelled' WHERE conversation_id=cid;
  UPDATE public.whatsapp_outbox SET state='cancelled' WHERE message_id IN (f.welcome_id,f.question_id) AND state='pending';
  UPDATE public.whatsapp_messages SET status='cancelled' WHERE id IN (f.welcome_id,f.question_id) AND status='pending';
  RETURN;
 END IF;
 IF normalized='' OR p_timestamp<f.created_at THEN RETURN; END IF;
 -- Wait for provider acceptance; a failed/unconfirmed welcome never starts a reply loop.
 IF NOT EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE id=CASE WHEN f.state='awaiting_reason' THEN f.question_id ELSE f.welcome_id END AND status IN ('accepted','sent','delivered','read') AND p_timestamp>=created_at) THEN RETURN; END IF;
 IF f.state='awaiting_reply' THEN
  mid:=public.queue_whatsapp_text(cid,'תודה. מה הסיבה לפנייה? למשל חשד לאלרגיה למזון, נזלת או פריחה. אפשר לכתוב בקצרה.');
  UPDATE clinic_private.referral_flows SET state='awaiting_reason',question_id=mid WHERE conversation_id=cid;
  RETURN;
 END IF;
 mid:=public.queue_whatsapp_text(cid,
 'תודה. כרגע אין תורים פנויים אצל ד״ר אנה ברמלי. מומלץ לבדוק תור לאלרגולוג בקופת החולים.'||chr(10)||chr(10)||
 'אפשר גם לבדוק מול המרפאות הבאות:'||chr(10)||
 'ד״ר יורם פייטלסון, תל אביב. אפשר לבקש את שרון, מנהלת המשרד.'||chr(10)||'https://drallergy.co.il/'||chr(10)||chr(10)||
 'פרופ׳ אבי ביגלמן, רעננה:'||chr(10)||'https://medspace.co.il/פרופ-אבי-ביגלמן/'||chr(10)||chr(10)||
 'אפשר לציין שהופניתם ממרפאת ד״ר אנה ברמלי ולשאול על תור מוקדם. אין הבטחה לזמינות או להקדמה; יש לבדוק גם התאמה לגיל המטופל.'||chr(10)||
 'בריאות שלמה 🌷');
 UPDATE clinic_private.referral_flows SET state='completed',reply_id=mid WHERE conversation_id=cid;
END $$;
CREATE OR REPLACE FUNCTION public.staff_whatsapp_action(p_conversation uuid,p_action text,p_text text DEFAULT '') RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.staff_whatsapp_action_before_referral(p_conversation,p_action,p_text);
 IF p_action IN ('pause','reply') THEN
 UPDATE clinic_private.referral_flows SET state='cancelled' WHERE conversation_id=p_conversation AND state IN ('scheduled','awaiting_reply','awaiting_reason');
 END IF;
END $$;
COMMIT;
