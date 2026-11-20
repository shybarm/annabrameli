ALTER TABLE public.appointments ADD COLUMN invitation_token uuid;
UPDATE public.appointments SET invitation_token=gen_random_uuid() WHERE modality='telephone';
CREATE UNIQUE INDEX appointment_invitation_token ON public.appointments(invitation_token) WHERE invitation_token IS NOT NULL;
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
  RETURN visit_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_telephone_appointment(uuid, uuid, uuid, timestamp, integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_telephone_appointment(uuid, uuid, uuid, timestamp, integer, text, text, text) TO authenticated;

-- A bearer invitation exposes only the logistics of its one active visit.
CREATE FUNCTION public.telephone_invitation(p_token uuid)
RETURNS TABLE (scheduled_at timestamptz, duration_minutes integer, meeting_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT a.scheduled_at, a.duration_minutes, a.meeting_url FROM public.appointments a
  WHERE a.invitation_token = p_token AND a.modality='telephone'
    AND NOT coalesce(a.is_deleted,false) AND a.cancelled_at IS NULL
    AND a.status IN ('scheduled','confirmed','מתוכנן')
    AND a.scheduled_at + make_interval(mins => a.duration_minutes + 60) > now()
$$;
REVOKE ALL ON FUNCTION public.telephone_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.telephone_invitation(uuid) TO anon, authenticated;

-- The clinic-owned Google script has a dedicated, revocable credential.
-- It can access only the time and duration of visits still missing a room.
CREATE TABLE public.clinic_meet_connections (
  clinic_id uuid PRIMARY KEY REFERENCES public.clinics(id),
  key_hash text NOT NULL UNIQUE CHECK (key_hash ~ '^[a-f0-9]{64}$')
);
ALTER TABLE public.clinic_meet_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.clinic_meet_connections FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.pending_meet_rooms(p_key text)
RETURNS TABLE (id uuid, scheduled_at timestamptz, duration_minutes integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT a.id, a.scheduled_at, a.duration_minutes
  FROM public.appointments a JOIN public.clinic_meet_connections c ON c.clinic_id=a.clinic_id
  WHERE c.key_hash=encode(sha256(convert_to(p_key,'UTF8')),'hex') AND a.modality='telephone'
    AND a.meeting_url IS NULL AND a.invitation_token IS NOT NULL
    AND NOT coalesce(a.is_deleted,false) AND a.cancelled_at IS NULL
    AND a.status IN ('scheduled','confirmed','מתוכנן')
    AND a.scheduled_at + make_interval(mins => a.duration_minutes) > now()
  ORDER BY a.scheduled_at LIMIT 12
$$;
CREATE FUNCTION public.attach_meet_room(p_key text,p_visit uuid,p_url text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_url IS NULL OR p_url !~ '^https://meet[.]google[.]com/[a-z]{3}-[a-z]{4}-[a-z]{3}$' THEN
    RAISE EXCEPTION 'Invalid meeting URL';
  END IF;
  UPDATE public.appointments a SET meeting_url=p_url FROM public.clinic_meet_connections c
  WHERE c.clinic_id=a.clinic_id AND c.key_hash=encode(sha256(convert_to(p_key,'UTF8')),'hex')
    AND a.id=p_visit AND a.modality='telephone' AND a.meeting_url IS NULL
    AND NOT coalesce(a.is_deleted,false) AND a.cancelled_at IS NULL;
END $$;
REVOKE ALL ON FUNCTION public.pending_meet_rooms(text), public.attach_meet_room(text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pending_meet_rooms(text), public.attach_meet_room(text,uuid,text) TO anon, authenticated;
