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
  UPDATE public.whatsapp_outbox SET state='cancelled' WHERE message_id IN (f.welcome_id,f.reply_id) AND state='pending';
  UPDATE public.whatsapp_messages SET status='cancelled' WHERE id IN (f.welcome_id,f.reply_id) AND status='pending';
  RETURN;
 END IF;
 IF f.state NOT IN ('scheduled','awaiting_reply') THEN RETURN; END IF;
 normalized:=lower(trim(p_body));
 IF p_from_staff OR p_type<>'text' OR normalized IN ('עצור','הסר','הסרה','stop','unsubscribe','ביטול','נציג','נציג אנושי','מענה אנושי','בן אדם','human')
 OR f.state='scheduled' OR NOT coalesce((SELECT enabled AND (NOT test_mode OR test_phone=p_phone) FROM clinic_private.referral_settings WHERE singleton),false) THEN
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
