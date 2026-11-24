BEGIN;
DO $patch$
DECLARE body text;
BEGIN
 body:=pg_get_functiondef('public.queue_due_clinic_referrals()'::regprocedure);
 body:=replace(body,'''היי, זה שי מהמרפאה של ד״ר אנה ברמלי.''
   ||chr(10)||''למי התור, לילד/ה או למבוגר/ת?''',
 'CASE WHEN f.source=''phone_ivr'' THEN ''היי, זה שי מהמרפאה של ד״ר ברמלי. ראיתי שהתקשרת, איך אני יכול לעזור?'' ELSE ''היי, זה שי מהמרפאה של ד״ר אנה ברמלי.''||chr(10)||''למי התור, לילד/ה או למבוגר/ת?'' END');
 body:=replace(body,'state=''awaiting_reply'',welcome_id=mid','state=CASE WHEN f.source=''phone_ivr'' THEN ''awaiting_ai_reply'' ELSE ''awaiting_reply'' END,welcome_id=mid,ai_message_id=CASE WHEN f.source=''phone_ivr'' THEN mid ELSE NULL END,ai_questions=CASE WHEN f.source=''phone_ivr'' THEN ARRAY[''phone_opening''] ELSE ARRAY[]::text[] END');
 EXECUTE body;
 body:=pg_get_functiondef('public.finish_clinic_referral_ai(uuid,uuid,text,text)'::regprocedure);
 body:=replace(body,' action:=CASE WHEN p_action=''human'' THEN ''human'' ELSE ''finish'' END;',
 $replace$
 IF 'phone_opening'=ANY(f.ai_questions) AND p_action IN ('who','reason') THEN
  mid:=public.queue_whatsapp_text(cid,CASE WHEN p_action='who' THEN 'למי התור, לילד/ה או למבוגר/ת?' ELSE 'באיזו אלרגיה או חשד לאלרגיה מדובר?' END);
  UPDATE clinic_private.referral_flows SET state='awaiting_ai_reply',ai_message_id=mid,ai_claim=NULL WHERE conversation_id=cid;
  RETURN;
 END IF;
 action:=CASE WHEN p_action='human' THEN 'human' ELSE 'finish' END;
 $replace$);
 EXECUTE body;
END $patch$;
COMMIT;
