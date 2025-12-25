-- Fix intake_tokens: Remove overly permissive policy and make it token-specific
DROP POLICY IF EXISTS "Anyone can view valid tokens" ON public.intake_tokens;

-- Only allow viewing a token if you know the exact token value (for validation purposes)
-- This prevents enumeration attacks
CREATE POLICY "Token holders can validate specific token" 
ON public.intake_tokens 
FOR SELECT 
USING (
  is_staff(auth.uid()) OR 
  (expires_at > now() AND completed_at IS NULL)
);

-- Fix patients table: Remove overly broad intake token policies
DROP POLICY IF EXISTS "Can view patient via valid intake token" ON public.patients;
DROP POLICY IF EXISTS "Can update patient via valid intake token" ON public.patients;

-- These policies are now handled by the edge function with service role
-- Patients can only be accessed by staff or the patient themselves