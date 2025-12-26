-- Drop the existing check constraint
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add updated check constraint with all status values
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'confirmed', 'arrived', 'in_treatment', 'completed', 'cancelled', 'no_show'));