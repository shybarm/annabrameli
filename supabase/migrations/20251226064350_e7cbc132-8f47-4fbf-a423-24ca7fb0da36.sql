-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view appointment types" ON public.appointment_types;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view appointment types" 
ON public.appointment_types 
FOR SELECT 
USING (auth.uid() IS NOT NULL);