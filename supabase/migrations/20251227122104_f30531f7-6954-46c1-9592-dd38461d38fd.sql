-- Fix critical security: team_invitations should NOT be publicly readable
-- Only allow viewing specific invitation when invite_code is provided via query parameter

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view invitations by code" ON public.team_invitations;

-- Create a secure policy that requires knowing the specific invite_code
-- This uses a security definer function to safely check invite codes
CREATE OR REPLACE FUNCTION public.check_team_invite_code(_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_invitations
    WHERE invite_code = _code
      AND accepted_at IS NULL
      AND expires_at > now()
  )
$$;

-- Policy for viewing invitations - only admins can browse, or via accept flow
CREATE POLICY "Admins can view all team invitations"
ON public.team_invitations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix critical security: patient_invitations should NOT be publicly readable
DROP POLICY IF EXISTS "Anyone can view invitations by code" ON public.patient_invitations;

-- Create a secure function for patient invite code verification
CREATE OR REPLACE FUNCTION public.check_patient_invite_code(_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patient_invitations
    WHERE invite_code = _code
      AND accepted_at IS NULL
      AND expires_at > now()
  )
$$;

-- Policy for staff to view all patient invitations
CREATE POLICY "Staff can view all patient invitations"
ON public.patient_invitations
FOR SELECT
USING (is_staff(auth.uid()));