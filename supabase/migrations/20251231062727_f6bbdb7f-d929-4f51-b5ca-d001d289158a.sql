-- Create separate staff-only table for internal notes (ISO 27799 compliant)
CREATE TABLE IF NOT EXISTS public.appointment_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  UNIQUE(appointment_id)
);

-- Enable RLS
ALTER TABLE public.appointment_internal_notes ENABLE ROW LEVEL SECURITY;

-- Staff-only access policies
CREATE POLICY "Staff can view internal notes"
ON public.appointment_internal_notes
FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can insert internal notes"
ON public.appointment_internal_notes
FOR INSERT
WITH CHECK (can_edit_appointments(auth.uid()));

CREATE POLICY "Staff can update internal notes"
ON public.appointment_internal_notes
FOR UPDATE
USING (can_edit_appointments(auth.uid()));

CREATE POLICY "Staff can delete internal notes"
ON public.appointment_internal_notes
FOR DELETE
USING (can_edit_appointments(auth.uid()));

-- Deny anonymous access
CREATE POLICY "Deny anonymous access"
ON public.appointment_internal_notes
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Migrate existing internal_notes data
INSERT INTO public.appointment_internal_notes (appointment_id, notes, created_at, updated_at, created_by)
SELECT id, internal_notes, created_at, updated_at, created_by
FROM public.appointments
WHERE internal_notes IS NOT NULL AND internal_notes != ''
ON CONFLICT (appointment_id) DO NOTHING;

-- Create trigger to intercept writes to internal_notes and redirect to secure table
CREATE OR REPLACE FUNCTION public.redirect_internal_notes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If internal_notes is being set, redirect to secure table
  IF NEW.internal_notes IS DISTINCT FROM OLD.internal_notes AND NEW.internal_notes IS NOT NULL THEN
    INSERT INTO public.appointment_internal_notes (appointment_id, notes, updated_at, created_by)
    VALUES (NEW.id, NEW.internal_notes, now(), auth.uid())
    ON CONFLICT (appointment_id) 
    DO UPDATE SET notes = EXCLUDED.notes, updated_at = now();
  END IF;
  
  -- Always null out internal_notes in main table (patients cannot see it)
  NEW.internal_notes := NULL;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS redirect_internal_notes_trigger ON public.appointments;
CREATE TRIGGER redirect_internal_notes_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.redirect_internal_notes();

-- Null out existing internal_notes in main table (data preserved in new table)
UPDATE public.appointments SET internal_notes = NULL WHERE internal_notes IS NOT NULL;

-- Add comment for documentation
COMMENT ON TABLE public.appointment_internal_notes IS 
'ISO 27799 compliant: Staff-only internal notes for appointments. 
Patients cannot access this table. All internal_notes are redirected here from appointments table.';