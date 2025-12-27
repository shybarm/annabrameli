-- Add clinic_id to team_invitations for per-clinic invites
ALTER TABLE public.team_invitations ADD COLUMN clinic_id uuid REFERENCES public.clinics(id);

-- Create index for better performance
CREATE INDEX idx_team_invitations_clinic_id ON public.team_invitations(clinic_id);

-- Create index on user_roles.clinic_id if not exists
CREATE INDEX IF NOT EXISTS idx_user_roles_clinic_id ON public.user_roles(clinic_id);