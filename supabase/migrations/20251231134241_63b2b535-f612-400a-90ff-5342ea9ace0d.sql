-- Update get_available_slots to enforce break_between_appointments and max_appointments_per_day
CREATE OR REPLACE FUNCTION public.get_available_slots(p_clinic_id uuid, p_date date, p_duration_minutes integer DEFAULT 30)
RETURNS TABLE(slot_time time without time zone, slot_datetime timestamp with time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_working_hours jsonb;
  v_day_name text;
  v_open_time time;
  v_close_time time;
  v_current_slot time;
  v_slot_interval interval;
  v_blocking_statuses text[];
  v_break_minutes integer;
  v_max_daily integer;
  v_current_count integer;
BEGIN
  -- Get blocking statuses
  v_blocking_statuses := get_blocking_statuses();
  
  -- Get appointment settings from clinic_settings
  SELECT COALESCE((value)::integer, 0) INTO v_break_minutes
  FROM clinic_settings WHERE key = 'break_between_appointments';
  
  SELECT COALESCE((value)::integer, 999) INTO v_max_daily
  FROM clinic_settings WHERE key = 'max_appointments_per_day';
  
  -- Default if not set
  v_break_minutes := COALESCE(v_break_minutes, 0);
  v_max_daily := COALESCE(v_max_daily, 999);
  
  -- Check if max daily appointments already reached
  SELECT COUNT(*) INTO v_current_count
  FROM appointments
  WHERE clinic_id = p_clinic_id
    AND scheduled_at::date = p_date
    AND status = ANY(v_blocking_statuses)
    AND (is_deleted IS NULL OR is_deleted = false);
  
  IF v_current_count >= v_max_daily THEN
    RETURN; -- No slots available - max reached
  END IF;
  
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
    -- Check if this slot has no overlapping appointments (including break time)
    IF NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.clinic_id = p_clinic_id
        AND a.status = ANY(v_blocking_statuses)
        AND (a.is_deleted IS NULL OR a.is_deleted = false)
        AND a.scheduled_at::date = p_date
        -- Overlap check with break buffer: existing.start < new.end AND existing.end+break > new.start
        AND a.scheduled_at < (p_date + v_current_slot + (p_duration_minutes || ' minutes')::interval)
        AND (a.scheduled_at + (COALESCE(a.duration_minutes, 30) + v_break_minutes || ' minutes')::interval) > (p_date + v_current_slot)
    ) THEN
      slot_time := v_current_slot;
      slot_datetime := (p_date + v_current_slot) AT TIME ZONE 'Asia/Jerusalem';
      RETURN NEXT;
    END IF;
    
    v_current_slot := v_current_slot + v_slot_interval;
  END LOOP;
END;
$$;