-- Create a function to handle team invitation acceptance
-- This runs with elevated privileges to create the user role
CREATE OR REPLACE FUNCTION public.accept_team_invitation(
  _invite_code text,
  _user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation record;
BEGIN
  -- Find the invitation
  SELECT * INTO _invitation
  FROM public.team_invitations
  WHERE invite_code = _invite_code
    AND accepted_at IS NULL
    AND expires_at > now();
  
  IF _invitation IS NULL THEN
    RETURN false;
  END IF;
  
  -- Create the user role
  INSERT INTO public.user_roles (user_id, role, permissions)
  VALUES (_user_id, _invitation.role, _invitation.permissions)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Mark invitation as accepted
  UPDATE public.team_invitations
  SET accepted_at = now()
  WHERE id = _invitation.id;
  
  RETURN true;
END;
$$;

-- Add unique constraint on user_roles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;