-- Create team invitations table
CREATE TABLE public.team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  role app_role NOT NULL,
  invite_code text NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  permissions jsonb DEFAULT '{"canViewPatients": true, "canEditPatients": false, "canViewAppointments": true, "canEditAppointments": false, "canViewBilling": false, "canEditBilling": false, "canViewDocuments": true, "canEditDocuments": false}'::jsonb,
  invited_by uuid REFERENCES auth.users(id),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(email, invite_code)
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitations
CREATE POLICY "Admins can manage team invitations"
ON public.team_invitations
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add permissions column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{"canViewPatients": true, "canEditPatients": false, "canViewAppointments": true, "canEditAppointments": false, "canViewBilling": false, "canEditBilling": false, "canViewDocuments": true, "canEditDocuments": false}'::jsonb;