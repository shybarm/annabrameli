BEGIN;
-- A scheduled first greeting is not a returning conversation. Repeated IVR
-- notifications must leave the existing flow and its original deadline intact.
DO $patch$
DECLARE original text; body text;
BEGIN
 original:=pg_get_functiondef('public.schedule_clinic_referral_before_hours(text,text,text,text)'::regprocedure);
 body:=replace(original, ' IF FOUND THEN'||chr(10)||'  IF p_phone IS DISTINCT FROM',
 ' IF FOUND THEN'||chr(10)||'  IF prior.state NOT IN (''completed'',''cancelled'') THEN RETURN ''duplicate''; END IF;'||chr(10)||'  IF p_phone IS DISTINCT FROM');
 IF body=original THEN RAISE EXCEPTION 'Expected existing-flow guard missing'; END IF;
 EXECUTE body;

 -- A normal reply before the welcome must be retained, not cancel the flow.
 -- Opt-outs, staff takeover, unsupported input and disabled service retain
 -- their existing cancellation behavior.
 original:=pg_get_functiondef('public.receive_clinic_whatsapp_before_inbound(text,text,text,text,timestamptz,boolean)'::regprocedure);
 body:=replace(original, ' OR f.state=''scheduled'' OR NOT coalesce', ' OR NOT coalesce');
 IF body=original THEN RAISE EXCEPTION 'Expected premature cancellation guard missing'; END IF;
 body:=replace(body, ' IF f.state IN (''ai_pending'',''offer_scheduled'')',
 ' IF f.state=''scheduled'' THEN RETURN; END IF;'||chr(10)||' IF f.state IN (''ai_pending'',''offer_scheduled'')');
 EXECUTE body;
END $patch$;
COMMIT;
