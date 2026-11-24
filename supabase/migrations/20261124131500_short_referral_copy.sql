BEGIN;
-- Owner-approved shorter intake and service wording; transport and timing unchanged.
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
   'היי, כאן המרפאה של ד״ר אנה ברמלי, במענה אוטומטי מטעם שי.'
   ||chr(10)||'למי התור, לילד/ה או למבוגר/ת?');
  UPDATE clinic_private.referral_flows SET state='awaiting_reply',welcome_id=mid WHERE conversation_id=c.id;
 END LOOP;
END $$;
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
  UPDATE public.whatsapp_outbox SET state='cancelled' WHERE message_id IN (f.welcome_id,f.question_id,f.ai_message_id,f.reply_id) AND state='pending';
  UPDATE public.whatsapp_messages SET status='cancelled' WHERE id IN (f.welcome_id,f.question_id,f.ai_message_id,f.reply_id) AND status='pending';
  RETURN;
 END IF;
 IF f.state NOT IN ('scheduled','awaiting_reply','awaiting_reason','awaiting_ai_reply','ai_pending') THEN RETURN; END IF;
 normalized:=lower(trim(p_body));
 IF p_from_staff OR p_type<>'text' OR normalized IN ('עצור','הסר','הסרה','stop','unsubscribe','ביטול','נציג','נציג אנושי','מענה אנושי','בן אדם','human')
 OR f.state='scheduled' OR NOT coalesce((SELECT enabled AND (NOT test_mode OR test_phone=p_phone) FROM clinic_private.referral_settings WHERE singleton),false) THEN
  UPDATE clinic_private.referral_flows SET state='cancelled' WHERE conversation_id=cid;
  UPDATE public.whatsapp_outbox SET state='cancelled' WHERE message_id IN (f.welcome_id,f.question_id,f.ai_message_id) AND state='pending';
  UPDATE public.whatsapp_messages SET status='cancelled' WHERE id IN (f.welcome_id,f.question_id,f.ai_message_id) AND status='pending';
  RETURN;
 END IF;
 IF f.state='ai_pending' OR normalized='' OR p_timestamp<f.created_at THEN RETURN; END IF;
 -- Wait for provider acceptance; a failed/unconfirmed welcome never starts a reply loop.
 IF NOT EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE id=CASE WHEN f.state='awaiting_ai_reply' THEN f.ai_message_id WHEN f.state='awaiting_reason' THEN f.question_id ELSE f.welcome_id END AND status IN ('accepted','sent','delivered','read') AND p_timestamp>=created_at) THEN RETURN; END IF;
 IF f.state='awaiting_reply' THEN
  mid:=public.queue_whatsapp_text(cid,'באיזו אלרגיה או חשד לאלרגיה מדובר?');
  UPDATE clinic_private.referral_flows SET state='awaiting_reason',question_id=mid WHERE conversation_id=cid;
  RETURN;
 END IF;
 IF (SELECT ai_enabled FROM clinic_private.referral_settings WHERE singleton) THEN
  UPDATE clinic_private.referral_flows SET state='ai_pending',ai_input_id=(SELECT id FROM public.whatsapp_messages WHERE provider_id=p_provider_id),ai_claim=NULL,ai_claimed_at=NULL WHERE conversation_id=cid;
  RETURN;
 END IF;
 mid:=public.queue_whatsapp_text(cid,
 'לצערנו, כרגע אין במרפאה תורים פרטיים לכמה חודשים קדימה.'||chr(10)||chr(10)||
 'אפשר לבדוק זמינות אצל הרופאים הבאים, וגם בקופת החולים:'||chr(10)||
 'ד״ר יורם פייטלסון, תל אביב. אפשר לבקש את שרון, מנהלת המשרד.'||chr(10)||'https://drallergy.co.il/'||chr(10)||chr(10)||
 'פרופ׳ אבי ביגלמן, רעננה:'||chr(10)||'https://medspace.co.il/פרופ-אבי-ביגלמן/'||chr(10)||chr(10)||
 'אפשר לציין שהופניתם ממרפאת ד״ר אנה ברמלי ולשאול על תור מוקדם. הזמינות נקבעת מול המרפאות.'||chr(10)||
 'בריאות שלמה');
 UPDATE clinic_private.referral_flows SET state='completed',reply_id=mid WHERE conversation_id=cid;
END $$;
CREATE OR REPLACE FUNCTION public.finish_clinic_referral_ai(p_conversation uuid,p_claim uuid,p_action text,p_origin text DEFAULT 'fallback') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cid uuid; f clinic_private.referral_flows%ROWTYPE; mid uuid; action text; wording text;
BEGIN
 SELECT id INTO cid FROM public.whatsapp_conversations WHERE id=p_conversation FOR UPDATE;
 SELECT * INTO f FROM clinic_private.referral_flows WHERE conversation_id=cid;
 IF NOT FOUND OR f.state<>'ai_pending' OR f.ai_claim IS DISTINCT FROM p_claim OR p_claim IS NULL THEN RETURN; END IF;
 IF NOT EXISTS(SELECT 1 FROM clinic_private.referral_settings s JOIN public.whatsapp_conversations w ON w.id=cid WHERE s.singleton AND s.enabled AND s.ai_enabled AND NOT w.opted_out AND (NOT s.test_mode OR s.test_phone=w.phone)) THEN
  UPDATE clinic_private.referral_flows SET state='cancelled',ai_claim=NULL WHERE conversation_id=cid; RETURN;
 END IF;
 UPDATE clinic_private.referral_flows SET ai_last_origin=CASE WHEN p_origin IN ('model','limit','fallback') THEN p_origin ELSE 'fallback' END WHERE conversation_id=cid;
 -- Two intake questions only; AI may route to staff but cannot prolong the intake.
 action:=CASE WHEN p_action='human' THEN 'human' ELSE 'finish' END;
 IF action='human' THEN
  mid:=public.queue_whatsapp_text(cid,'אפשר להשאיר כאן הודעה לצוות המרפאה. המענה האוטומטי אינו נותן אבחון או הנחיות טיפול. במצב חירום רפואי יש לחייג 101 ולא להמתין למענה בוואטסאפ.');
  UPDATE clinic_private.referral_flows SET state='cancelled',ai_message_id=mid,ai_claim=NULL WHERE conversation_id=cid; RETURN;
 END IF;
 mid:=public.queue_whatsapp_text(cid,
 'לצערנו, כרגע אין במרפאה תורים פרטיים לכמה חודשים קדימה.'||chr(10)||chr(10)||
 'אפשר לבדוק זמינות אצל הרופאים הבאים, וגם בקופת החולים:'||chr(10)||
 'ד״ר יורם פייטלסון, תל אביב. אפשר לבקש את שרון, מנהלת המשרד.'||chr(10)||'https://drallergy.co.il/'||chr(10)||chr(10)||
 'פרופ׳ אבי ביגלמן, רעננה:'||chr(10)||'https://medspace.co.il/פרופ-אבי-ביגלמן/'||chr(10)||chr(10)||
 'אפשר לציין שהופניתם ממרפאת ד״ר אנה ברמלי ולשאול על תור מוקדם. הזמינות נקבעת מול המרפאות.'||chr(10)||
 'בריאות שלמה');
 UPDATE clinic_private.referral_flows SET state='completed',reply_id=mid,ai_claim=NULL WHERE conversation_id=cid;
END $$;
COMMIT;
