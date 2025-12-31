-- ISSUE 2: Fix PHI Access Log INSERT Policy - restrict to service_role only
-- Drop the existing overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert logs" ON public.phi_access_log;

-- Create new restrictive INSERT policy for service_role only
CREATE POLICY "Service role can insert logs"
ON public.phi_access_log
FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ISSUE 4: Fix mutable search_path in SECURITY DEFINER functions
-- Note: Most functions already have SET search_path TO 'public', but we need to ensure all do

-- Recreate get_blocking_statuses with explicit search_path (it's IMMUTABLE, not SECURITY DEFINER, but for completeness)
CREATE OR REPLACE FUNCTION public.get_blocking_statuses()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT ARRAY['scheduled', 'confirmed', 'waiting_room', 'in_treatment', 'completed', 'pending_verification']::text[]
$$;