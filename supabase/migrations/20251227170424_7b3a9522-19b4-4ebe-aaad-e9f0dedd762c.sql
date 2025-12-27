-- Remove the public SELECT policy that exposes clinic data
DROP POLICY IF EXISTS "Anyone can view active clinics" ON public.clinics;