-- Create email verification tokens table for patient deduplication
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX idx_email_verifications_token ON public.email_verifications(token);

-- Index for checking existing verifications
CREATE INDEX idx_email_verifications_patient_email ON public.email_verifications(patient_id, email);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Only service role can access (edge functions)
-- No direct user access needed

-- Add comment for documentation
COMMENT ON TABLE public.email_verifications IS 'One-time email verification tokens for patient identity validation (ISO 27799 compliant - no PHI stored)';