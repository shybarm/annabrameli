
-- Fix: Allow patient deletion by setting patient_id to NULL in guest_booking_requests
-- This preserves booking request audit history while allowing patient record management
-- ISO 27799: maintains audit trail, does not expose PHI, least privilege preserved

-- Drop the existing constraint
ALTER TABLE public.guest_booking_requests
DROP CONSTRAINT IF EXISTS guest_booking_requests_patient_id_fkey;

-- Re-add with ON DELETE SET NULL for safe patient deletion
ALTER TABLE public.guest_booking_requests
ADD CONSTRAINT guest_booking_requests_patient_id_fkey
FOREIGN KEY (patient_id) 
REFERENCES public.patients(id) 
ON DELETE SET NULL;
