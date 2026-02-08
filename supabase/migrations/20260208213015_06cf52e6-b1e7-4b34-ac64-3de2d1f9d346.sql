
-- Drop the overly permissive service role policy and replace with a more specific one
DROP POLICY IF EXISTS "Service role can insert medical updates" ON public.medical_updates;

-- The service role bypasses RLS entirely, so no special policy needed.
-- The staff insert policy is sufficient for authenticated staff users.
