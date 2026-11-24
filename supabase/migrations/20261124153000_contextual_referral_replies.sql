BEGIN;
DO $patch$
DECLARE body text;
BEGIN
 body:=pg_get_functiondef('public.receive_clinic_whatsapp(text,text,text,text,timestamp with time zone,boolean)'::regprocedure);
 body:=replace(body,'כן|כן בבקשה|אשמח|בשמחה|שלח|שלח לי|אפשר|yes','כן|כן תודה|כן בבקשה|כן תודה רבה|כן אשמח|אשמח|אשמח לקבל|בשמחה|שלח|שלח לי|אפשר|yes');
 body:=replace(body,'[!. ]*$','[!., ]*$');
 body:=replace(body,$old$
  ELSE
   mid:=public.queue_whatsapp_text(cid,'לשלוח את פרטי הרופאים? אפשר לענות כן או לא.');
$old$,$new$
  ELSIF normalized ~ '[?？]' OR normalized ~ '^(מה|למה|איך|איפה|כמה|האם|מתי|מי|אפשר לדעת|רציתי לשאול)' THEN
   mid:=public.queue_whatsapp_text(cid,'קיבלתי את השאלה. אשאיר אותה לצוות המרפאה כדי שיוכל להתייחס אליה.');
   UPDATE clinic_private.referral_flows SET state='cancelled',ai_message_id=mid WHERE conversation_id=cid;
  ELSE
   mid:=public.queue_whatsapp_text(cid,'רק לוודא שהבנתי: תרצה שאשלח את פרטי הרופאים?');
$new$);
 EXECUTE body;
END $patch$;
COMMIT;
