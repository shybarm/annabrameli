-- Drop the existing check constraint and add a new one with 'arrived' status
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'));