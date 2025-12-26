-- Drop the old constraint and add a new one with waiting_room included
ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'arrived'::text, 'waiting_room'::text, 'in_treatment'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text]));