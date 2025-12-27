-- Add family history columns with separate fields for father, mother, and other family members
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS family_history_father TEXT,
ADD COLUMN IF NOT EXISTS family_history_mother TEXT,
ADD COLUMN IF NOT EXISTS family_history_other TEXT;