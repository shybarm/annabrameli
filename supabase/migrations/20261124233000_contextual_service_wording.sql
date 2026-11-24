BEGIN;
DO $patch$
DECLARE body text; original text;
BEGIN
 original:=pg_get_functiondef('public.finish_clinic_referral_ai(uuid,uuid,text,text)'::regprocedure);
 body:=replace(original, ' IF ''consent_reply''=ANY(f.ai_questions) THEN', $new$
 -- Contextual service replies keep the same state machine and consent boundary.
 IF p_action IN ('apology','human','medical_human') THEN
  wording:=CASE p_action
   WHEN 'apology' THEN 'סליחה, התשובה לא התאימה למה שכתבת. ההודעה נשארת כאן לצוות המרפאה.'
   WHEN 'human' THEN 'אין לי מידע מספיק כדי לענות על זה. ההודעה נשארת כאן לצוות המרפאה.'
   ELSE 'לשאלה רפואית נדרש מענה של הצוות. במצב חירום רפואי יש לחייג 101 ולא להמתין למענה בוואטסאפ.' END;
  mid:=public.queue_whatsapp_text(cid,wording);
  UPDATE clinic_private.referral_flows SET state='cancelled',ai_message_id=mid,ai_claim=NULL WHERE conversation_id=cid;
  UPDATE public.whatsapp_conversations SET unread=true WHERE id=cid;
  RETURN;
 END IF;
 IF 'consent_reply'=ANY(f.ai_questions) AND p_action='availability' THEN
  mid:=public.queue_whatsapp_text(cid,'כרגע אין תורים פרטיים פנויים לכמה חודשים קדימה. אפשר לשלוח לך פרטים של שני רופאי אלרגיה נוספים?');
  UPDATE clinic_private.referral_flows SET state='awaiting_consent',ai_message_id=mid,ai_claim=NULL WHERE conversation_id=cid;
  RETURN;
 END IF;
 IF 'phone_opening'=ANY(f.ai_questions) AND p_action IN ('who_ack','reason_ack') THEN
  mid:=public.queue_whatsapp_text(cid,'סליחה על החזרה. '||CASE p_action WHEN 'who_ack' THEN 'למי התור, לילד/ה או למבוגר/ת?' ELSE 'באיזו אלרגיה או חשד לאלרגיה מדובר?' END);
  UPDATE clinic_private.referral_flows SET state='awaiting_ai_reply',ai_message_id=mid,ai_claim=NULL WHERE conversation_id=cid;
  RETURN;
 END IF;
 IF 'consent_reply'=ANY(f.ai_questions) THEN$new$);
 IF body=original THEN RAISE EXCEPTION 'Expected consent branch missing'; END IF;
 EXECUTE body;
END $patch$;
COMMIT;
