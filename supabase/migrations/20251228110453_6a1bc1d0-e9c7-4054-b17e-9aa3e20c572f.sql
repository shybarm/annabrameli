-- Add soft-delete columns to appointments table for Doctor Diary compliance
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Create index for efficient querying of non-deleted entries
CREATE INDEX IF NOT EXISTS idx_appointments_not_deleted ON public.appointments (is_deleted) WHERE is_deleted = FALSE;