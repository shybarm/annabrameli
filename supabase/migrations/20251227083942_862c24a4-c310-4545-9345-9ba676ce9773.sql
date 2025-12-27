-- Create a function to auto-create patient record for new users
-- This runs after a user signs up and checks if they're not staff
CREATE OR REPLACE FUNCTION public.handle_new_patient_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_staff BOOLEAN;
BEGIN
  -- Check if user is staff (has any staff role)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.id 
    AND role IN ('admin', 'doctor', 'secretary')
  ) INTO _is_staff;
  
  -- If not staff, create a patient record
  IF NOT _is_staff THEN
    INSERT INTO public.patients (
      user_id,
      first_name,
      last_name,
      email
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'מטופל'),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'חדש'),
      NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Assign patient role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'patient')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after user is created
DROP TRIGGER IF EXISTS on_auth_user_created_patient ON auth.users;
CREATE TRIGGER on_auth_user_created_patient
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_patient_user();

-- Add unique constraint on patients.user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'patients_user_id_key'
  ) THEN
    ALTER TABLE public.patients ADD CONSTRAINT patients_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Create patient_invitations table for staff to invite patients
CREATE TABLE IF NOT EXISTS public.patient_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  invite_code text NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  patient_id uuid REFERENCES public.patients(id),
  UNIQUE(invite_code)
);

-- Enable RLS
ALTER TABLE public.patient_invitations ENABLE ROW LEVEL SECURITY;

-- Staff can manage invitations
CREATE POLICY "Staff can manage patient invitations"
ON public.patient_invitations
FOR ALL
USING (is_staff(auth.uid()));

-- Anyone can view invitations by code (for accepting)
CREATE POLICY "Anyone can view invitations by code"
ON public.patient_invitations
FOR SELECT
USING (true);