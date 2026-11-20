BEGIN;
-- Existing jobs remain disabled: enabling automatic delivery must not message old appointments.
ALTER TABLE public.telephone_whatsapp_deliveries
  ADD COLUMN auto_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN dispatch_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN accepted_at timestamptz,
  ADD COLUMN error_code text,
  ADD COLUMN intake_token_id uuid REFERENCES public.intake_tokens(id);
ALTER TABLE public.telephone_whatsapp_deliveries ALTER COLUMN auto_enabled SET DEFAULT true;

CREATE FUNCTION public.claim_telephone_whatsapp(p_visit uuid, p_dispatch_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  job public.telephone_whatsapp_deliveries%ROWTYPE;
  visit public.appointments%ROWTYPE;
  recipient text;
  intake public.intake_tokens%ROWTYPE;
BEGIN
  SELECT * INTO job FROM public.telephone_whatsapp_deliveries
    WHERE appointment_id=p_visit AND dispatch_token=p_dispatch_token
      AND auto_enabled AND state='pending' FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO visit FROM public.appointments WHERE id=p_visit FOR UPDATE;
  IF NOT FOUND OR visit.modality IS DISTINCT FROM 'telephone'
     OR visit.status NOT IN ('scheduled','confirmed') OR visit.cancelled_at IS NOT NULL
     OR coalesce(visit.is_deleted,false) OR visit.scheduled_at <= now() THEN
    UPDATE public.telephone_whatsapp_deliveries SET state='cancelled',updated_at=now() WHERE appointment_id=p_visit;
    RETURN NULL;
  END IF;
  IF visit.invitation_token IS NULL OR visit.meeting_url IS NULL
     OR visit.meeting_url !~ '^https://meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}$' THEN
    RETURN NULL;
  END IF;
  SELECT phone INTO recipient FROM public.patients WHERE id=visit.patient_id;
  PERFORM pg_advisory_xact_lock(hashtextextended('telephone-intake:' || visit.patient_id::text,0));
  SELECT * INTO intake FROM public.intake_tokens WHERE patient_id=visit.patient_id
    AND completed_at IS NULL AND expires_at > greatest(now()+interval '1 day',visit.scheduled_at+interval '1 day')
    ORDER BY expires_at DESC LIMIT 1;
  IF NOT FOUND THEN
    INSERT INTO public.intake_tokens(patient_id,expires_at)
      VALUES(visit.patient_id,greatest(now()+interval '7 days',visit.scheduled_at+interval '1 day'))
      RETURNING * INTO intake;
  END IF;
  UPDATE public.telephone_whatsapp_deliveries SET state='processing',updated_at=now(),
    intake_token_id=intake.id,error_code=NULL WHERE appointment_id=p_visit;
  RETURN jsonb_build_object('id',visit.id,'phone',recipient,'scheduled_at',visit.scheduled_at,
    'duration_minutes',visit.duration_minutes,'modality','telephone','meeting_url',visit.meeting_url,
    'invitation_token',visit.invitation_token,'intake_token',intake.token);
END $$;
REVOKE ALL ON FUNCTION public.claim_telephone_whatsapp(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_telephone_whatsapp(uuid,uuid) TO service_role;

CREATE FUNCTION public.finish_telephone_whatsapp(p_visit uuid,p_dispatch_token uuid,p_state text,p_error_code text,p_message_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE intake_id uuid;
BEGIN
  IF p_state NOT IN ('accepted','failed') OR (p_state='accepted' AND coalesce(p_message_id,'')='') THEN
    RAISE EXCEPTION 'Invalid delivery outcome';
  END IF;
  UPDATE public.telephone_whatsapp_deliveries SET state=p_state,provider_message_id=p_message_id,
    error_code=p_error_code,updated_at=now(),accepted_at=CASE WHEN p_state='accepted' THEN now() ELSE NULL END
    WHERE appointment_id=p_visit AND dispatch_token=p_dispatch_token AND state='processing'
    RETURNING intake_token_id INTO intake_id;
  IF FOUND AND p_state='accepted' THEN
    UPDATE public.appointments SET visit_shared_whatsapp_at=now() WHERE id=p_visit;
    UPDATE public.intake_tokens SET sent_via='whatsapp',sent_at=now() WHERE id=intake_id;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.finish_telephone_whatsapp(uuid,uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_telephone_whatsapp(uuid,uuid,text,text,text) TO service_role;

-- Safe staff status only. Capability and recipient data never leave the private queue.
GRANT SELECT(appointment_id,state,auto_enabled,updated_at,accepted_at,error_code)
  ON public.telephone_whatsapp_deliveries TO authenticated;
CREATE POLICY "Staff can see telephone delivery status" ON public.telephone_whatsapp_deliveries
  FOR SELECT TO authenticated USING (
    public.can_edit_appointments(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.appointments a WHERE a.id=appointment_id
    )
  );

CREATE FUNCTION public.dispatch_telephone_whatsapp()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job record;
BEGIN
  -- A crashed worker may have sent the message. Flag for review, never retry it blindly.
  UPDATE public.telephone_whatsapp_deliveries SET state='failed',error_code='delivery_uncertain',updated_at=now()
    WHERE state='processing' AND updated_at < now()-interval '10 minutes';
  UPDATE public.telephone_whatsapp_deliveries d SET state='cancelled',updated_at=now()
    FROM public.appointments a WHERE a.id=d.appointment_id AND d.auto_enabled AND d.state='pending'
      AND (a.modality IS DISTINCT FROM 'telephone' OR a.status NOT IN ('scheduled','confirmed')
        OR a.cancelled_at IS NOT NULL OR coalesce(a.is_deleted,false) OR a.scheduled_at <= now());
  FOR job IN SELECT d.appointment_id,d.dispatch_token FROM public.telephone_whatsapp_deliveries d
    JOIN public.appointments a ON a.id=d.appointment_id
    WHERE d.auto_enabled AND d.state='pending' AND a.modality='telephone'
      AND a.status IN ('scheduled','confirmed') AND a.cancelled_at IS NULL AND NOT coalesce(a.is_deleted,false)
      AND a.scheduled_at>now() AND a.invitation_token IS NOT NULL
      AND a.meeting_url ~ '^https://meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}$'
    ORDER BY d.created_at LIMIT 20
  LOOP
    PERFORM net.http_post(
      url := 'https://ftatmcyrmeyhghgckvbj.supabase.co/functions/v1/send-telephone-invitation',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('appointment_id',job.appointment_id,'dispatch_token',job.dispatch_token),
      timeout_milliseconds := 25000
    );
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.dispatch_telephone_whatsapp() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_telephone_whatsapp() TO service_role;
SELECT cron.schedule('send-telephone-invitations','* * * * *','select public.dispatch_telephone_whatsapp()');
COMMIT;
