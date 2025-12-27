-- Remove the public SELECT policy that exposes appointment types and pricing
DROP POLICY IF EXISTS "Anyone can view active appointment types" ON public.appointment_types;