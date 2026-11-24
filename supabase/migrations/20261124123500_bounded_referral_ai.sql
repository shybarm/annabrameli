BEGIN;
ALTER TABLE clinic_private.referral_settings ADD COLUMN ai_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE clinic_private.referral_flows ADD COLUMN ai_input_id uuid REFERENCES public.whatsapp_messages(id), ADD COLUMN ai_claim uuid, ADD COLUMN ai_claimed_at timestamptz, ADD COLUMN ai_message_id uuid REFERENCES public.whatsapp_messages(id), ADD COLUMN ai_questions text[] NOT NULL DEFAULT '{}', ADD COLUMN ai_last_origin text;
ALTER TABLE clinic_private.referral_flows DROP CONSTRAINT referral_flows_state_check;
ALTER TABLE clinic_private.referral_flows ADD CONSTRAINT referral_flows_state_check CHECK(state IN ('scheduled','awaiting_reply','awaiting_reason','ai_pending','awaiting_ai_reply','completed','cancelled'));
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
  mid:=public.queue_whatsapp_text(cid,'תודה. באיזו אלרגיה מדובר, או מה החשד לאלרגיה?');
  UPDATE clinic_private.referral_flows SET state='awaiting_reason',question_id=mid WHERE conversation_id=cid;
  RETURN;
 END IF;
 IF (SELECT ai_enabled FROM clinic_private.referral_settings WHERE singleton) THEN
  UPDATE clinic_private.referral_flows SET state='ai_pending',ai_input_id=(SELECT id FROM public.whatsapp_messages WHERE provider_id=p_provider_id),ai_claim=NULL,ai_claimed_at=NULL WHERE conversation_id=cid;
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
 UPDATE clinic_private.referral_flows SET state='cancelled' WHERE conversation_id=p_conversation AND state IN ('scheduled','awaiting_reply','awaiting_reason','ai_pending','awaiting_ai_reply');
 END IF;
END $$;

CREATE FUNCTION public.claim_clinic_referral_ai() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cid uuid; f clinic_private.referral_flows%ROWTYPE; ticket uuid; context jsonb;
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
 SELECT jsonb_agg(jsonb_build_object('role',CASE WHEN direction='incoming' THEN 'user' ELSE 'assistant' END,'content',left(body,1000)) ORDER BY created_at) INTO context
 FROM (SELECT direction,body,created_at FROM public.whatsapp_messages WHERE conversation_id=cid AND created_at>=f.created_at
 AND created_at<=(SELECT created_at FROM public.whatsapp_messages WHERE id=f.ai_input_id) AND message_type='text'
 ORDER BY created_at DESC LIMIT 8) m;
 RETURN jsonb_build_object('conversation_id',cid,'claim',ticket,'asked',f.ai_questions,'messages',coalesce(context,'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.claim_clinic_referral_ai() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_clinic_referral_ai() TO service_role;

CREATE FUNCTION public.finish_clinic_referral_ai(p_conversation uuid,p_claim uuid,p_action text,p_origin text DEFAULT 'fallback') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cid uuid; f clinic_private.referral_flows%ROWTYPE; mid uuid; action text; wording text;
BEGIN
 SELECT id INTO cid FROM public.whatsapp_conversations WHERE id=p_conversation FOR UPDATE;
 SELECT * INTO f FROM clinic_private.referral_flows WHERE conversation_id=cid;
 IF NOT FOUND OR f.state<>'ai_pending' OR f.ai_claim IS DISTINCT FROM p_claim OR p_claim IS NULL THEN RETURN; END IF;
 IF NOT EXISTS(SELECT 1 FROM clinic_private.referral_settings s JOIN public.whatsapp_conversations w ON w.id=cid WHERE s.singleton AND s.enabled AND s.ai_enabled AND NOT w.opted_out AND (NOT s.test_mode OR s.test_phone=w.phone)) THEN
  UPDATE clinic_private.referral_flows SET state='cancelled',ai_claim=NULL WHERE conversation_id=cid; RETURN;
 END IF;
 UPDATE clinic_private.referral_flows SET ai_last_origin=CASE WHEN p_origin IN ('model','limit','fallback') THEN p_origin ELSE 'fallback' END WHERE conversation_id=cid;
 action:=CASE WHEN p_action IN ('age','known','goal','finish','human') THEN p_action ELSE 'finish' END;
 -- At most two adaptive follow-up questions; the third response is always the fixed referral.
 IF action IN ('age','known','goal') AND (cardinality(f.ai_questions)>=2 OR action=ANY(f.ai_questions)) THEN action:='finish'; END IF;
 IF action IN ('age','known','goal') THEN
  wording:=CASE action WHEN 'age' THEN 'בן או בת כמה הילד/ה?' WHEN 'known' THEN 'האם זו אלרגיה שכבר אובחנה, או חשד שעדיין לא נבדק?' ELSE 'הפנייה היא לבירור ראשון או למעקב אחרי אבחון קיים?' END;
  mid:=public.queue_whatsapp_text(cid,wording);
  UPDATE clinic_private.referral_flows SET state='awaiting_ai_reply',ai_message_id=mid,ai_questions=array_append(ai_questions,action),ai_claim=NULL WHERE conversation_id=cid;
  RETURN;
 END IF;
 IF action='human' THEN
  mid:=public.queue_whatsapp_text(cid,'אפשר להשאיר כאן הודעה לצוות המרפאה. המענה האוטומטי אינו נותן אבחון או הנחיות טיפול. במצב חירום רפואי יש לחייג 101 ולא להמתין למענה בוואטסאפ.');
  UPDATE clinic_private.referral_flows SET state='cancelled',ai_message_id=mid,ai_claim=NULL WHERE conversation_id=cid; RETURN;
 END IF;
 mid:=public.queue_whatsapp_text(cid,
 'תודה. כרגע אין תורים פנויים אצל ד״ר אנה ברמלי. מומלץ לבדוק תור לאלרגולוג בקופת החולים.'||chr(10)||chr(10)||
 'אפשר גם לבדוק מול המרפאות הבאות:'||chr(10)||
 'ד״ר יורם פייטלסון, תל אביב. אפשר לבקש את שרון, מנהלת המשרד.'||chr(10)||'https://drallergy.co.il/'||chr(10)||chr(10)||
 'פרופ׳ אבי ביגלמן, רעננה:'||chr(10)||'https://medspace.co.il/פרופ-אבי-ביגלמן/'||chr(10)||chr(10)||
 'אפשר לציין שהופניתם ממרפאת ד״ר אנה ברמלי ולשאול על תור מוקדם. אין הבטחה לזמינות או להקדמה; יש לבדוק גם התאמה לגיל המטופל.'||chr(10)||
 'בריאות שלמה 🌷');
 UPDATE clinic_private.referral_flows SET state='completed',reply_id=mid,ai_claim=NULL WHERE conversation_id=cid;
END $$;
REVOKE ALL ON FUNCTION public.finish_clinic_referral_ai(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_clinic_referral_ai(uuid,uuid,text,text) TO service_role;
COMMIT;
