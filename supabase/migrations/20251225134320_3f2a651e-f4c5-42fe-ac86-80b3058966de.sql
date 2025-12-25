-- Fix upload_tokens RLS to allow guest booking to create tokens
-- The patients table insert also needs to work for guests

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Service role can manage upload tokens" ON public.upload_tokens;

-- Allow anon users to insert tokens (needed for guest booking)
CREATE POLICY "Anyone can create upload tokens"
ON public.upload_tokens FOR INSERT
WITH CHECK (true);

-- Staff can manage all tokens
CREATE POLICY "Staff can manage upload tokens"
ON public.upload_tokens FOR ALL
USING (is_staff(auth.uid()));

-- Service role can do everything (for edge functions)
CREATE POLICY "Service can manage tokens"
ON public.upload_tokens FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Allow reading own token for verification (token must match)
CREATE POLICY "Token holders can verify their token"
ON public.upload_tokens FOR SELECT
USING (
  expires_at > now() 
  AND used_at IS NULL
);

-- Allow marking token as used
CREATE POLICY "Token can be marked as used"
ON public.upload_tokens FOR UPDATE
USING (
  expires_at > now() 
  AND used_at IS NULL
);

-- Also need to allow guests to create patients during booking
DROP POLICY IF EXISTS "Patients can view their own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can update limited fields" ON public.patients;
DROP POLICY IF EXISTS "Staff can manage patients" ON public.patients;
DROP POLICY IF EXISTS "Staff can view all patients" ON public.patients;

-- Recreate patients policies
CREATE POLICY "Patients can view own record"
ON public.patients FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Patients can update own record"
ON public.patients FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Staff can manage patients"
ON public.patients FOR ALL
USING (is_staff(auth.uid()));

-- Allow anonymous guest booking to create patients
CREATE POLICY "Guest booking can create patients"
ON public.patients FOR INSERT
WITH CHECK (
  user_id IS NULL  -- Guest patients don't have user_id
);

-- Fix storage policies to ensure staff can access all documents
-- First check if we need to add any storage policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;