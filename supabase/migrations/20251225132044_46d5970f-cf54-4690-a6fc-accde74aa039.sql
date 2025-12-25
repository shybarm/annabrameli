-- Create upload_tokens table for secure guest document uploads
CREATE TABLE public.upload_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '15 minutes'),
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upload_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to verify tokens (needed for edge function with service role)
CREATE POLICY "Service role can manage upload tokens"
ON public.upload_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for fast token lookups
CREATE INDEX idx_upload_tokens_token ON public.upload_tokens(token);
CREATE INDEX idx_upload_tokens_patient_expires ON public.upload_tokens(patient_id, expires_at);