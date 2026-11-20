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
  IF p_meeting_url IS NULL OR p_meeting_url !~ '^https://meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}$' THEN
    RAISE EXCEPTION 'Invalid meeting URL';
  END IF;
  visit_id := public.create_appointment_atomic(
    p_patient_id, p_clinic_id, p_appointment_type_id,
    p_scheduled_at AT TIME ZONE 'Asia/Jerusalem', p_duration_minutes, p_notes, p_status
  );
  UPDATE public.appointments SET modality = 'telephone', meeting_url = p_meeting_url WHERE id = visit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Appointment update denied'; END IF;
  RETURN visit_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_telephone_appointment(uuid, uuid, uuid, timestamp, integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_telephone_appointment(uuid, uuid, uuid, timestamp, integer, text, text, text) TO authenticated;
