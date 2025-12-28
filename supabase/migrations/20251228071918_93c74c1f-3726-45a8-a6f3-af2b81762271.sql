-- Remove public SELECT policy from intake_tokens that exposes medical intake tokens
DROP POLICY IF EXISTS "Token holders can validate their intake tokens" ON public.intake_tokens;

-- Remove public SELECT policy from patient_invitations that exposes email/phone
DROP POLICY IF EXISTS "Anyone can view valid patient invitations by code" ON public.patient_invitations;

-- Remove public SELECT policy from team_invitations as well for consistency
DROP POLICY IF EXISTS "Anyone can view valid team invitations by code" ON public.team_invitations;