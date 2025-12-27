-- Allow anyone to view active clinics for appointment booking
CREATE POLICY "Anyone can view active clinics" 
ON public.clinics 
FOR SELECT 
USING (is_active = true);