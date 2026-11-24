BEGIN;
ALTER TABLE clinic_private.referral_flows DROP CONSTRAINT referral_flows_state_check;
ALTER TABLE clinic_private.referral_flows ADD CONSTRAINT referral_flows_state_check CHECK(state IN ('scheduled','awaiting_reply','awaiting_reason','ai_pending','awaiting_ai_reply','awaiting_consent','offer_scheduled','completed','cancelled'));
CREATE FUNCTION clinic_private.schedule_referral_offer(cid uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE mid uuid;
BEGIN
 mid:=public.queue_whatsapp_text(cid,'כרגע הזמינות שלנו מצומצמת. אשלח לך בעוד כמה דקות את האפשרויות להמשך.');
 UPDATE clinic_private.referral_flows SET state='offer_scheduled',ai_message_id=mid,ai_claim=NULL,due_at=clock_timestamp()+interval '3 minutes'+random()*interval '1 minute' WHERE conversation_id=cid;
 RETURN mid;
END $$;
REVOKE ALL ON FUNCTION clinic_private.schedule_referral_offer(uuid) FROM PUBLIC,anon,authenticated;
DO $patch$
DECLARE body text; sig text;
BEGIN
 FOREACH sig IN ARRAY ARRAY['public.finish_clinic_referral_ai(uuid,uuid,text,text)','public.receive_clinic_whatsapp_before_inbound(text,text,text,text,timestamptz,boolean)'] LOOP
 body:=pg_get_functiondef(sig::regprocedure);
 body:=replace(body,$old$mid:=public.queue_whatsapp_text(cid,'לצערנו, כרגע אין לנו תורים בפרטי לכמה חודשים קדימה.'||chr(10)||'אני יכול לשלוח לך פרטים של שני רופאים נוספים ולבדוק מולם זמינות?');$old$,$new$mid:=clinic_private.schedule_referral_offer(cid);$new$);
 body:=replace(body,'state=''awaiting_consent'',ai_message_id=mid','state=''offer_scheduled'',ai_message_id=mid');
 IF sig LIKE '%receive%' THEN
 body:=replace(body,'''ai_pending'',''awaiting_consent''','''ai_pending'',''awaiting_consent'',''offer_scheduled''');
 body:=replace(body,'IF f.state=''ai_pending'' OR normalized=''''', 'IF f.state IN (''ai_pending'',''offer_scheduled'') OR normalized=''''');
 END IF;
 EXECUTE body;
 END LOOP;
 body:=pg_get_functiondef('public.staff_whatsapp_action(uuid,text,text)'::regprocedure);
 body:=replace(body,'''awaiting_consent''','''awaiting_consent'',''offer_scheduled''');
 EXECUTE body;
END $patch$;
ALTER FUNCTION public.queue_due_clinic_referrals() RENAME TO queue_due_clinic_referrals_before_offer;
CREATE FUNCTION public.queue_due_clinic_referrals() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c record; mid uuid;
BEGIN
 PERFORM public.queue_due_clinic_referrals_before_offer();
 FOR c IN SELECT w.id FROM public.whatsapp_conversations w JOIN clinic_private.referral_flows f ON f.conversation_id=w.id
 JOIN clinic_private.referral_settings s ON s.singleton
 WHERE s.enabled AND (NOT s.test_mode OR s.test_phone=w.phone) AND NOT w.opted_out
 AND f.state='offer_scheduled' AND f.due_at<=clock_timestamp()
 AND EXISTS(SELECT 1 FROM public.whatsapp_messages m WHERE m.id=f.ai_message_id AND m.status IN ('accepted','sent','delivered','read'))
 FOR UPDATE OF w SKIP LOCKED LOOP
  mid:=public.queue_whatsapp_text(c.id,'לצערנו, כרגע אין לנו תורים בפרטי לכמה חודשים קדימה.'||chr(10)||'אני יכול לשלוח לך פרטים של שני רופאים נוספים ולבדוק מולם זמינות?');
  UPDATE clinic_private.referral_flows SET state='awaiting_consent',ai_message_id=mid WHERE conversation_id=c.id AND state='offer_scheduled';
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.queue_due_clinic_referrals() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.queue_due_clinic_referrals() TO service_role;
COMMIT;
