-- Add allergy details columns to patients table
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS allergy_reaction_type text,
ADD COLUMN IF NOT EXISTS allergy_severity text;