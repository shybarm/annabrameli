CREATE FUNCTION public.telephone_intake_token(p_visit uuid)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  patient uuid;
  result text;
BEGIN
  IF NOT coalesce(public.can_edit_appointments(auth.uid()),false) THEN
    RAISE EXCEPTION 'Staff appointment permission required';
  END IF;
  SELECT patient_id INTO STRICT patient FROM public.appointments
    WHERE id=p_visit AND modality='telephone' AND status IN ('scheduled','confirmed')
      AND cancelled_at IS NULL AND NOT coalesce(is_deleted,false)
      AND scheduled_at + make_interval(mins => duration_minutes + 60) > now();
  PERFORM pg_advisory_xact_lock(hashtextextended('telephone-intake:' || patient::text,0));
  SELECT token INTO result FROM public.intake_tokens WHERE patient_id=patient
    AND completed_at IS NULL AND expires_at > now() + interval '1 hour'
    ORDER BY expires_at DESC LIMIT 1;
  IF result IS NULL THEN
    INSERT INTO public.intake_tokens(patient_id) VALUES (patient) RETURNING token INTO result;
  END IF;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.telephone_intake_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.telephone_intake_token(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_telephone_appointment(
  p_patient_id uuid, p_clinic_id uuid, p_appointment_type_id uuid,
  p_scheduled_at timestamp, p_duration_minutes integer, p_notes text,
  p_meeting_url text, p_status text DEFAULT 'scheduled'
) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO public AS $$
DECLARE
  visit_id uuid;
BEGIN
  IF NOT coalesce(public.can_edit_appointments(auth.uid()), false) OR p_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Staff appointment permission and clinic required';
  END IF;
  IF p_meeting_url IS NOT NULL AND p_meeting_url !~ '^https://meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}$' THEN
    RAISE EXCEPTION 'Invalid meeting URL';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_clinic_id::text, 0));
  visit_id := public.create_appointment_atomic(
    p_patient_id, p_clinic_id, p_appointment_type_id,
    p_scheduled_at AT TIME ZONE 'Asia/Jerusalem', p_duration_minutes, p_notes, p_status
  );
  UPDATE public.appointments SET modality = 'telephone', meeting_url = p_meeting_url, invitation_token = gen_random_uuid() WHERE id = visit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Appointment update denied'; END IF;
  IF p_status IN ('scheduled','confirmed') AND (p_scheduled_at AT TIME ZONE 'Asia/Jerusalem') + make_interval(mins => p_duration_minutes + 60) > now() THEN
    PERFORM public.telephone_intake_token(visit_id);
  END IF;
  RETURN visit_id;
END;
$$;
