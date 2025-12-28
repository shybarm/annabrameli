-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view active clinics basic info" ON public.clinics;

-- Create a security definer function that returns only safe public clinic info
CREATE OR REPLACE FUNCTION public.get_public_clinics()
RETURNS TABLE (
  id uuid,
  name text,
  city text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, city, is_active
  FROM public.clinics
  WHERE is_active = true
$$;

-- Create a function to get a single public clinic by ID
CREATE OR REPLACE FUNCTION public.get_public_clinic(clinic_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  city text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, city, is_active
  FROM public.clinics
  WHERE id = clinic_id AND is_active = true
$$;

-- For authenticated patients with appointments, allow them to see full clinic details
CREATE POLICY "Patients can view clinics for their appointments" 
ON public.clinics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.patients p ON p.id = a.patient_id
    WHERE a.clinic_id = clinics.id
    AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.clinic_id = clinics.id
    AND p.user_id = auth.uid()
  )
);