-- Allow reading patient data via valid intake token
-- This is needed for the intake form to pre-fill patient data
CREATE POLICY "Can view patient via valid intake token"
ON public.patients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.intake_tokens
    WHERE intake_tokens.patient_id = patients.id
    AND intake_tokens.expires_at > now()
    AND intake_tokens.completed_at IS NULL
  )
);

-- Also allow updating patient data via valid intake token
-- This is needed for the intake form submission
CREATE POLICY "Can update patient via valid intake token"
ON public.patients FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.intake_tokens
    WHERE intake_tokens.patient_id = patients.id
    AND intake_tokens.expires_at > now()
    AND intake_tokens.completed_at IS NULL
  )
);