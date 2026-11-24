BEGIN;
DO $patch$
DECLARE body text;
BEGIN
 body:=pg_get_functiondef('public.schedule_clinic_referral(text,text,text,text)'::regprocedure);
 body:=replace(body,'prior.state=''completed''','prior.state IN (''completed'',''scheduled'',''awaiting_reply'',''awaiting_reason'',''awaiting_ai_reply'',''awaiting_consent'',''ai_pending'',''offer_scheduled'')');
 body:=replace(body,'   INSERT INTO clinic_private.referral_flow_history(snapshot)',
 '   UPDATE public.whatsapp_outbox SET state=''cancelled'' WHERE message_id IN (prior.welcome_id,prior.question_id,prior.ai_message_id,prior.reply_id) AND state=''pending'';
   UPDATE public.whatsapp_messages SET status=''cancelled'' WHERE id IN (prior.welcome_id,prior.question_id,prior.ai_message_id,prior.reply_id) AND status=''pending'';
   INSERT INTO clinic_private.referral_flow_history(snapshot)');
 EXECUTE body;
END $patch$;
COMMIT;
