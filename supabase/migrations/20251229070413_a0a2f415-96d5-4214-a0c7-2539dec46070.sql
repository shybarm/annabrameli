-- Drop the public access policy that exposes pricing to competitors
DROP POLICY IF EXISTS "Anyone can view active appointment types" ON public.appointment_types;

-- Create a new policy that only allows authenticated users to view appointment types
CREATE POLICY "Authenticated users can view active appointment types" 
ON public.appointment_types 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);