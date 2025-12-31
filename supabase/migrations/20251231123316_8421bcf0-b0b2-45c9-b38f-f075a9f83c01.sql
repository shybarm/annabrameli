-- =====================================================
-- ATOMIC APPOINTMENT BOOKING & UNIFIED SLOT AVAILABILITY
-- Prevents double-booking via database-level enforcement
-- =====================================================

-- Statuses that BLOCK a time slot (appointments in these statuses occupy time)
-- cancelled, no_show are excluded as they don't occupy slots
CREATE OR REPLACE FUNCTION public.get_blocking_statuses()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY['scheduled', 'confirmed', 'waiting_room', 'in_treatment', 'completed', 'pending_verification']::text[]
$$;

-- =====================================================
-- FUNCTION: get_available_slots
-- Returns available time slots for a given clinic and date
-- Used by BOTH public booking and admin calendar
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_clinic_id uuid,
  p_date date,
  p_duration_minutes integer DEFAULT 30
)
RETURNS TABLE(slot_time time, slot_datetime timestamp with time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_working_hours jsonb;
  v_day_name text;
  v_open_time time;
  v_close_time time;
  v_current_slot time;
  v_slot_interval interval;
  v_blocking_statuses text[];
BEGIN
  -- Get blocking statuses
  v_blocking_statuses := get_blocking_statuses();
  
  -- Get day name (Sunday = 0)
  v_day_name := CASE EXTRACT(DOW FROM p_date)
    WHEN 0 THEN 'sunday'
    WHEN 1 THEN 'monday'
    WHEN 2 THEN 'tuesday'
    WHEN 3 THEN 'wednesday'
    WHEN 4 THEN 'thursday'
    WHEN 5 THEN 'friday'
    WHEN 6 THEN 'saturday'
  END;
  
  -- Get clinic working hours
  SELECT working_hours INTO v_working_hours
  FROM clinics
  WHERE id = p_clinic_id AND is_active = true;
  
  IF v_working_hours IS NULL THEN
    RETURN;
  END IF;
  
  -- Extract open/close times for the day
  IF v_working_hours->v_day_name IS NULL OR v_working_hours->v_day_name = 'null'::jsonb THEN
    RETURN; -- Clinic closed on this day
  END IF;
  
  v_open_time := (v_working_hours->v_day_name->>'open')::time;
  v_close_time := (v_working_hours->v_day_name->>'close')::time;
  
  IF v_open_time IS NULL OR v_close_time IS NULL THEN
    RETURN;
  END IF;
  
  -- Generate slots at 30-minute intervals
  v_slot_interval := interval '30 minutes';
  v_current_slot := v_open_time;
  
  WHILE v_current_slot < v_close_time LOOP
    -- Check if this slot has no overlapping appointments
    IF NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.clinic_id = p_clinic_id
        AND a.status = ANY(v_blocking_statuses)
        AND (a.is_deleted IS NULL OR a.is_deleted = false)
        AND a.scheduled_at::date = p_date
        -- Overlap check: existing.start < new.end AND existing.end > new.start
        AND a.scheduled_at < (p_date + v_current_slot + (p_duration_minutes || ' minutes')::interval)
        AND (a.scheduled_at + (COALESCE(a.duration_minutes, 30) || ' minutes')::interval) > (p_date + v_current_slot)
    ) THEN
      slot_time := v_current_slot;
      slot_datetime := (p_date + v_current_slot) AT TIME ZONE 'Asia/Jerusalem';
      RETURN NEXT;
    END IF;
    
    v_current_slot := v_current_slot + v_slot_interval;
  END LOOP;
END;
$$;

-- =====================================================
-- FUNCTION: create_appointment_atomic
-- Atomically checks availability and creates appointment
-- Returns the new appointment ID or raises an error
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_appointment_atomic(
  p_patient_id uuid,
  p_clinic_id uuid,
  p_appointment_type_id uuid,
  p_scheduled_at timestamp with time zone,
  p_duration_minutes integer DEFAULT 30,
  p_notes text DEFAULT NULL,
  p_status text DEFAULT 'scheduled'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_appointment_id uuid;
  v_end_time timestamp with time zone;
  v_blocking_statuses text[];
  v_conflict_exists boolean;
BEGIN
  -- Get blocking statuses
  v_blocking_statuses := get_blocking_statuses();
  v_end_time := p_scheduled_at + (p_duration_minutes || ' minutes')::interval;
  
  -- Lock and check for conflicts in a single atomic operation
  -- FOR UPDATE SKIP LOCKED prevents deadlocks while ensuring serialization
  SELECT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.clinic_id = p_clinic_id
      AND a.status = ANY(v_blocking_statuses)
      AND (a.is_deleted IS NULL OR a.is_deleted = false)
      AND a.scheduled_at::date = p_scheduled_at::date
      -- Overlap check
      AND a.scheduled_at < v_end_time
      AND (a.scheduled_at + (COALESCE(a.duration_minutes, 30) || ' minutes')::interval) > p_scheduled_at
    FOR UPDATE SKIP LOCKED
  ) INTO v_conflict_exists;
  
  IF v_conflict_exists THEN
    RAISE EXCEPTION 'SLOT_TAKEN: השעה נתפסה זה עתה, בחר/י שעה אחרת';
  END IF;
  
  -- Create the appointment
  INSERT INTO appointments (
    patient_id,
    clinic_id,
    appointment_type_id,
    scheduled_at,
    duration_minutes,
    notes,
    status
  ) VALUES (
    p_patient_id,
    p_clinic_id,
    p_appointment_type_id,
    p_scheduled_at,
    p_duration_minutes,
    p_notes,
    p_status
  )
  RETURNING id INTO v_new_appointment_id;
  
  RETURN v_new_appointment_id;
END;
$$;

-- =====================================================
-- Grant execute permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION public.get_blocking_statuses() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_available_slots(uuid, date, integer) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_appointment_atomic(uuid, uuid, uuid, timestamp with time zone, integer, text, text) TO authenticated, service_role;