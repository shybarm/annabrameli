-- Allow anyone to view active appointment types for booking
CREATE POLICY "Anyone can view active appointment types" 
ON public.appointment_types 
FOR SELECT 
USING (is_active = true);