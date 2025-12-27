-- Allow guest booking to create appointments for patients with no user_id
CREATE POLICY "Guest booking can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients p 
    WHERE p.id = patient_id 
    AND p.user_id IS NULL
  )
);