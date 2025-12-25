-- Add visit documentation fields to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS visit_summary TEXT,
  ADD COLUMN IF NOT EXISTS treatment_plan TEXT,
  ADD COLUMN IF NOT EXISTS medications TEXT,
  ADD COLUMN IF NOT EXISTS visit_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visit_shared_whatsapp_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visit_shared_email_at TIMESTAMPTZ;

-- Optional: index to quickly find completed visits per patient
CREATE INDEX IF NOT EXISTS idx_appointments_patient_visit_completed
  ON public.appointments (patient_id, visit_completed_at DESC);
