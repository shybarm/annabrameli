BEGIN;
DO $patch$
DECLARE body text;
BEGIN
 body:=pg_get_functiondef('public.queue_due_clinic_referrals()'::regprocedure);
 body:=replace(body,'היי, כאן המרפאה של ד״ר אנה ברמלי, במענה אוטומטי מטעם שי.','היי, זה שי מהמרפאה של ד״ר אנה ברמלי.');
 EXECUTE body;
 body:=pg_get_functiondef('public.receive_clinic_whatsapp(text,text,text,text,timestamp with time zone,boolean)'::regprocedure);
 body:=replace(body,'''לצערנו, כרגע אין במרפאה תורים פרטיים לכמה חודשים קדימה.''||chr(10)||chr(10)||','');
 EXECUTE body;
END $patch$;
COMMIT;
