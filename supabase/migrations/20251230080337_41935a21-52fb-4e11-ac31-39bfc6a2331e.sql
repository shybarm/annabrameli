-- Add category field to appointment_types for treatment categorization
ALTER TABLE public.appointment_types 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'other';

-- Add comment for documentation
COMMENT ON COLUMN public.appointment_types.category IS 'Treatment category: aesthetics, medical, consultation, other';