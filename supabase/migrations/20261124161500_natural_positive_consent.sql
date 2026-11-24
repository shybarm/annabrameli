BEGIN;
DO $patch$
DECLARE body text;
BEGIN
 body:=pg_get_functiondef('public.receive_clinic_whatsapp_before_inbound(text,text,text,text,timestamptz,boolean)'::regprocedure);
 body:=replace(body,'כן|כן תודה|','בטח|בטח תודה|בוודאי|בוודאי תודה|כמובן|כן|כן תודה|');
 EXECUTE body;
END $patch$;
COMMIT;
