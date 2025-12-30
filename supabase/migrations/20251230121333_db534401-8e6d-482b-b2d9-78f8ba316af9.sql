-- Create booking_verifications table for magic link verification
CREATE TABLE public.booking_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES public.clinics(id),
  email text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 minutes'),
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_resend_at timestamp with time zone
);

-- Create index for token lookups
CREATE INDEX idx_booking_verifications_token ON public.booking_verifications(token);
CREATE INDEX idx_booking_verifications_appointment ON public.booking_verifications(appointment_id);

-- Enable RLS
ALTER TABLE public.booking_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only service role can manage these (edge functions use service role)
CREATE POLICY "Service role can manage booking verifications"
ON public.booking_verifications
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Staff can view for debugging
CREATE POLICY "Staff can view booking verifications"
ON public.booking_verifications
FOR SELECT
USING (is_staff(auth.uid()));