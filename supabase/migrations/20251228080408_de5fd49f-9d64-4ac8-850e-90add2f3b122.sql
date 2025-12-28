-- Update the public clinic functions to include working_hours (not sensitive)
DROP FUNCTION IF EXISTS public.get_public_clinics();
DROP FUNCTION IF EXISTS public.get_public_clinic(uuid);

-- Recreate with working_hours included (needed for booking flow)
CREATE OR REPLACE FUNCTION public.get_public_clinics()
RETURNS TABLE (
  id uuid,
  name text,
  city text,
  working_hours jsonb,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, city, working_hours, is_active
  FROM public.clinics
  WHERE is_active = true
  ORDER BY name
$$;

CREATE OR REPLACE FUNCTION public.get_public_clinic(clinic_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  city text,
  working_hours jsonb,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, city, working_hours, is_active
  FROM public.clinics
  WHERE id = clinic_id AND is_active = true
$$;