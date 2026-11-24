BEGIN;
DO $patch$
DECLARE body text; sig text; block_start integer; block_end integer; referral text;
BEGIN
 body:=pg_get_functiondef('public.receive_clinic_whatsapp_before_inbound(text,text,text,text,timestamptz,boolean)'::regprocedure);
 block_start:=strpos(body,' mid:=public.queue_whatsapp_text(cid,'||chr(10));
 block_end:=strpos(substr(body,block_start),'   UPDATE clinic_private.referral_flows SET state=''completed''');
 referral:=substr(body,block_start,block_end-1);
 body:=replace(body,' IF f.state=''awaiting_consent'' THEN',
 ' IF f.state=''awaiting_consent'' THEN
  UPDATE clinic_private.referral_flows SET state=''ai_pending'',ai_input_id=(SELECT id FROM public.whatsapp_messages WHERE provider_id=p_provider_id),ai_claim=NULL,ai_claimed_at=NULL,ai_questions=ARRAY[''consent_reply''] WHERE conversation_id=cid;
  RETURN;
 END IF;
 IF false THEN');
 EXECUTE body;
 body:=pg_get_functiondef('public.finish_clinic_referral_ai(uuid,uuid,text,text)'::regprocedure);
 body:=replace(body,' -- Two intake questions only;',
 ' IF ''consent_reply''=ANY(f.ai_questions) THEN
  IF p_action=''consent_yes'' THEN
 '||referral||'
   UPDATE clinic_private.referral_flows SET state=''completed'',reply_id=mid,ai_claim=NULL WHERE conversation_id=cid;
  ELSIF p_action=''consent_no'' THEN
   UPDATE clinic_private.referral_flows SET state=''completed'',ai_claim=NULL WHERE conversation_id=cid;
  ELSIF p_action=''human'' THEN
   mid:=public.queue_whatsapp_text(cid,''קיבלתי את השאלה. אשאיר אותה לצוות המרפאה כדי שיוכל להתייחס אליה.'');
   UPDATE clinic_private.referral_flows SET state=''cancelled'',ai_message_id=mid,ai_claim=NULL WHERE conversation_id=cid;
  ELSE
   mid:=public.queue_whatsapp_text(cid,''רק לוודא שהבנתי: לשלוח לך את פרטי הרופאים?'');
   UPDATE clinic_private.referral_flows SET state=''awaiting_consent'',ai_message_id=mid,ai_claim=NULL WHERE conversation_id=cid;
  END IF;
  RETURN;
 END IF;
 -- Two intake questions only;');
 EXECUTE body;
 body:=pg_get_functiondef('public.queue_due_clinic_referrals()'::regprocedure);
 body:=replace(body,'לצערנו, כרגע אין לנו תורים בפרטי לכמה חודשים קדימה.','לצערנו, כרגע אין לנו תורים בפרטי לכמה חודשים קדימה...');
 body:=replace(body,'אני יכול לשלוח לך פרטים של שני רופאים נוספים ולבדוק מולם זמינות?','אני יכול לשלוח לך פרטים של שני רופאי אלרגיה שלמיטב ידיעתי יש להם יותר זמינות כרגע.');
 EXECUTE body;
END $patch$;
COMMIT;
