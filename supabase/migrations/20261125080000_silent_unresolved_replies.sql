BEGIN;
DO $patch$
DECLARE body text; original text;
BEGIN
 original:=pg_get_functiondef('public.finish_clinic_referral_ai(uuid,uuid,text,text)'::regprocedure);
 body:=replace(original, ' IF p_action IN (''apology'',''human'',''medical_human'') THEN', $new$
 IF p_action='human' THEN
  UPDATE clinic_private.referral_flows SET state='cancelled',ai_claim=NULL WHERE conversation_id=cid;
  UPDATE public.whatsapp_conversations SET unread=true WHERE id=cid;
  RETURN;
 END IF;
 IF p_action IN ('apology','human','medical_human') THEN$new$);
 IF body=original THEN RAISE EXCEPTION 'Expected contextual response branch missing'; END IF;
 body:=replace(body,'סליחה, התשובה לא התאימה למה שכתבת. ההודעה נשארת כאן לצוות המרפאה.','סליחה, התשובה לא התאימה למה שכתבת.');
 EXECUTE body;
END $patch$;
COMMIT;
