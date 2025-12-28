-- Add a column to track if staff has reviewed the new patient
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add a column to track who reviewed the patient
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS reviewed_by UUID DEFAULT NULL;