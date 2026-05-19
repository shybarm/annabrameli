
-- Fix 1: appointment_internal_notes - replace permissive ALL policy with restrictive staff-only policy
DROP POLICY IF EXISTS "Deny anonymous access" ON public.appointment_internal_notes;

CREATE POLICY "Restrict all access to staff"
ON public.appointment_internal_notes
AS RESTRICTIVE
FOR ALL
TO public
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- Fix 2: upload_tokens - remove public SELECT/UPDATE policies (edge function uses service role)
DROP POLICY IF EXISTS "Token holders can verify their token" ON public.upload_tokens;
DROP POLICY IF EXISTS "Token can be marked as used" ON public.upload_tokens;
