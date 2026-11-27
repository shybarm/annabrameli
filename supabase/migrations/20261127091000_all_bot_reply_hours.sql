BEGIN;
CREATE TABLE clinic_private.reply_hours (
 conversation_id uuid PRIMARY KEY REFERENCES public.whatsapp_conversations(id),
 resume_at timestamptz NOT NULL, requested_at timestamptz NOT NULL,
 notice_id uuid REFERENCES public.whatsapp_messages(id)
);
ALTER TABLE clinic_private.reply_hours ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clinic_private.reply_hours FROM PUBLIC,anon,authenticated;
ALTER TABLE public.whatsapp_outbox ADD COLUMN bot_reply boolean NOT NULL DEFAULT false;
ALTER TABLE public.whatsapp_outbox ADD COLUMN not_before timestamptz NOT NULL DEFAULT now();

CREATE FUNCTION clinic_private.service_reply_time(at_time timestamptz, origin timestamptz)
RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE t timestamp:=at_time AT TIME ZONE 'Asia/Jerusalem'; o timestamp:=origin AT TIME ZONE 'Asia/Jerusalem';
BEGIN
 -- Friday is available only to resume a Thursday request. New Friday and
 -- Saturday requests wait until Sunday. Israel's DST is resolved by Postgres.
 IF extract(isodow FROM t)=5 AND extract(isodow FROM o)=4 AND t::date=o::date+1
 AND t::time<time '20:30' THEN
  RETURN greatest(t,date_trunc('day',t)+interval '8 hours 30 minutes') AT TIME ZONE 'Asia/Jerusalem';
 END IF;
 IF t::time>=time '20:30' THEN t:=date_trunc('day',t)+interval '1 day 8 hours 30 minutes';
 ELSIF t::time<time '08:30' THEN t:=date_trunc('day',t)+interval '8 hours 30 minutes'; END IF;
 IF extract(isodow FROM t)=5 AND extract(isodow FROM o)=4 AND t::date=o::date+1 THEN
  RETURN t AT TIME ZONE 'Asia/Jerusalem';
 END IF;
 WHILE extract(isodow FROM t) IN (5,6) LOOP t:=date_trunc('day',t)+interval '1 day 8 hours 30 minutes'; END LOOP;
 RETURN t AT TIME ZONE 'Asia/Jerusalem';
END $$;
CREATE FUNCTION clinic_private.conversation_reply_time(cid uuid, at_time timestamptz)
RETURNS timestamptz LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT clinic_private.service_reply_time(at_time,coalesce((SELECT requested_at FROM clinic_private.reply_hours WHERE conversation_id=cid AND (resume_at AT TIME ZONE 'Asia/Jerusalem')::date >= (at_time AT TIME ZONE 'Asia/Jerusalem')::date),at_time));
$$;
REVOKE ALL ON FUNCTION clinic_private.service_reply_time(timestamptz,timestamptz),clinic_private.conversation_reply_time(uuid,timestamptz) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION clinic_private.queue_closed_notice(cid uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE due timestamptz; mid uuid; existing_due timestamptz;
BEGIN
 PERFORM 1 FROM public.whatsapp_conversations c JOIN clinic_private.referral_settings s ON s.singleton
 WHERE c.id=cid AND NOT c.opted_out AND c.whatsapp_consent_withdrawn_at IS NULL
 AND s.enabled AND (NOT s.test_mode OR s.test_phone=c.phone) FOR UPDATE OF c;
 IF NOT FOUND THEN RETURN; END IF;
 due:=clinic_private.conversation_reply_time(cid,now());
 IF due<=now() THEN RETURN; END IF;
 SELECT resume_at INTO existing_due FROM clinic_private.reply_hours WHERE conversation_id=cid;
 IF existing_due=due THEN RETURN; END IF;
 INSERT INTO public.whatsapp_messages(conversation_id,direction,body,message_type,status)
 VALUES(cid,'outgoing','המרפאה סגורה כרגע. נחזור אלייך בהקדם.','service_notice','pending') RETURNING id INTO mid;
 INSERT INTO public.whatsapp_outbox(message_id) VALUES(mid);
 INSERT INTO clinic_private.reply_hours(conversation_id,resume_at,requested_at,notice_id) VALUES(cid,due,now(),mid)
 ON CONFLICT(conversation_id) DO UPDATE SET resume_at=excluded.resume_at,requested_at=excluded.requested_at,notice_id=excluded.notice_id;
END $$;
REVOKE ALL ON FUNCTION clinic_private.queue_closed_notice(uuid) FROM PUBLIC,anon,authenticated;

ALTER FUNCTION public.queue_whatsapp_text(uuid,text) RENAME TO queue_whatsapp_text_before_hours;
REVOKE ALL ON FUNCTION public.queue_whatsapp_text_before_hours(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.queue_whatsapp_text(p_conversation uuid,p_body text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE mid uuid;
BEGIN
 mid:=public.queue_whatsapp_text_before_hours(p_conversation,p_body);
 IF coalesce(current_setting('clinic.manual_reply',true),'')<>'true' THEN
  UPDATE public.whatsapp_outbox SET bot_reply=true,not_before=clinic_private.conversation_reply_time(p_conversation,now()) WHERE message_id=mid;
  PERFORM clinic_private.queue_closed_notice(p_conversation);
 END IF;
 RETURN mid;
END $$;
REVOKE ALL ON FUNCTION public.queue_whatsapp_text(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.queue_whatsapp_text(uuid,text) TO service_role;
-- Preserve manual staff messages and the separate invoice-delivery path.
ALTER FUNCTION public.staff_whatsapp_action(uuid,text,text) RENAME TO staff_whatsapp_action_before_hours;
CREATE FUNCTION public.staff_whatsapp_action(p_conversation uuid,p_action text,p_text text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM set_config('clinic.manual_reply','true',true);
 PERFORM public.staff_whatsapp_action_before_hours(p_conversation,p_action,p_text);
 PERFORM set_config('clinic.manual_reply','false',true);
END $$;
REVOKE ALL ON FUNCTION public.staff_whatsapp_action_before_hours(uuid,text,text),public.staff_whatsapp_action(uuid,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.staff_whatsapp_action_before_hours(uuid,text,text) FROM authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.staff_whatsapp_action(uuid,text,text) TO authenticated;

DO $patch$
DECLARE original text; body text;
BEGIN
 original:=pg_get_functiondef('public.claim_clinic_whatsapp_outbox_before_typing()'::regprocedure);
 body:=replace(original,'DECLARE job record;', 'DECLARE job record; pending_cid uuid;');
 body:=replace(body,'BEGIN'||chr(10),'BEGIN'||chr(10)||$gate$
 FOR pending_cid IN SELECT DISTINCT m.conversation_id FROM public.whatsapp_outbox o JOIN public.whatsapp_messages m ON m.id=o.message_id
 WHERE o.state='pending' AND o.bot_reply AND clinic_private.conversation_reply_time(m.conversation_id,now())>now() LOOP
  PERFORM clinic_private.queue_closed_notice(pending_cid);
 END LOOP;
$gate$);
 body:=replace(body,'WHERE o.state=''pending'' AND NOT EXISTS',
 'WHERE o.state=''pending'' AND o.not_before<=now() AND (NOT o.bot_reply OR clinic_private.conversation_reply_time(c.id,now())<=now()) AND (m.message_type=''service_notice'' OR NOT EXISTS');
 body:=replace(body,'earlier.state IN (''pending'',''processing''))','earlier.state IN (''pending'',''processing'')))');
 IF body=original THEN RAISE EXCEPTION 'Expected outbox claim missing'; END IF;
 EXECUTE body;
END $patch$;

ALTER FUNCTION public.schedule_clinic_referral(text,text,text,text) RENAME TO schedule_clinic_referral_before_closed_notice;
CREATE FUNCTION public.schedule_clinic_referral(p_phone text,p_name text,p_source text,p_request_id text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result text; cid uuid;
BEGIN
 result:=public.schedule_clinic_referral_before_closed_notice(p_phone,p_name,p_source,p_request_id);
 SELECT id INTO cid FROM public.whatsapp_conversations WHERE phone=p_phone;
 IF result='scheduled' THEN
  UPDATE clinic_private.referral_flows SET due_at=clinic_private.service_reply_time(now()+CASE WHEN p_source='phone_ivr' THEN interval '2 minutes' ELSE interval '20 minutes' END,now()) WHERE conversation_id=cid AND state='scheduled';
 END IF;
 IF result IN ('scheduled','duplicate') THEN PERFORM clinic_private.queue_closed_notice(cid); END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.schedule_clinic_referral_before_closed_notice(text,text,text,text),public.schedule_clinic_referral(text,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.schedule_clinic_referral_before_closed_notice(text,text,text,text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.schedule_clinic_referral(text,text,text,text) TO service_role;

ALTER FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) RENAME TO receive_clinic_whatsapp_before_closed_notice;
CREATE FUNCTION public.receive_clinic_whatsapp(p_phone text,p_provider_id text,p_body text,p_type text,p_timestamp timestamptz,p_from_staff boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cid uuid;
BEGIN
 IF EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE provider_id=p_provider_id) THEN RETURN; END IF;
 PERFORM public.receive_clinic_whatsapp_before_closed_notice(p_phone,p_provider_id,p_body,p_type,p_timestamp,p_from_staff);
 IF NOT p_from_staff AND p_type='text' AND trim(lower(p_body)) NOT IN ('הסר','עצור','הסרה','stop','unsubscribe','ביטול') THEN
  SELECT id INTO cid FROM public.whatsapp_conversations WHERE phone=p_phone;
  PERFORM clinic_private.queue_closed_notice(cid);
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.receive_clinic_whatsapp_before_closed_notice(text,text,text,text,timestamptz,boolean),public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.receive_clinic_whatsapp_before_closed_notice(text,text,text,text,timestamptz,boolean) FROM service_role;
GRANT EXECUTE ON FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) TO service_role;
-- Service notices must never make a first inbound greeting look like a prior conversation.
DO $patch$
DECLARE name text; original text; body text;
BEGIN
 FOREACH name IN ARRAY ARRAY['receive_clinic_whatsapp_before_closed_notice','receive_clinic_whatsapp_before_returning'] LOOP
  original:=pg_get_functiondef(('public.'||name||'(text,text,text,text,timestamptz,boolean)')::regprocedure);
  body:=replace(original,'EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE conversation_id=cid)', 'EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE conversation_id=cid AND message_type<>''service_notice'')');
  EXECUTE body;
 END LOOP;
 -- The old dispatcher used a global Fri/Sat block. Use each conversation's
 -- original request so Thursday carry-over can run on Friday morning.
 original:=pg_get_functiondef('public.queue_due_clinic_referrals()'::regprocedure);
 body:=replace(original,'clinic_private.next_service_reply(clock_timestamp())','clinic_private.conversation_reply_time(conversation_id,now())');
 EXECUTE body;
END $patch$;
DO $patch$
DECLARE original text; body text;
BEGIN
 original:=pg_get_functiondef('public.register_whatsapp_waitlist(text,text,uuid,boolean)'::regprocedure);
 body:=replace(original,'clinic_private.next_service_reply(now()+interval ''20 minutes'')','clinic_private.service_reply_time(now()+interval ''20 minutes'',now())');
 body:=replace(body,' RETURN c.id;'||chr(10)||'END',' PERFORM clinic_private.queue_closed_notice(c.id);'||chr(10)||' RETURN c.id;'||chr(10)||'END');
 IF body=original THEN RAISE EXCEPTION 'Expected waitlist scheduling missing'; END IF;
 EXECUTE body;
END $patch$;
COMMIT;
