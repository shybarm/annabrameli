-- Drop the existing check constraint
ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;

-- Add the updated check constraint with pending_verification status
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'arrived'::text, 'waiting_room'::text, 'in_treatment'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text, 'pending_verification'::text]));