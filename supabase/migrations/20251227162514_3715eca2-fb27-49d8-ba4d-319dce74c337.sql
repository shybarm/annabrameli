-- Allow anyone to view active clinics for booking
CREATE POLICY "Anyone can view active clinics" 
ON public.clinics 
FOR SELECT 
USING (is_active = true);

-- Allow anyone to view active appointment types for booking
CREATE POLICY "Anyone can view active appointment types" 
ON public.appointment_types 
FOR SELECT 
USING (is_active = true);