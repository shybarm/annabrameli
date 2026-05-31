CREATE POLICY "Public can view active appointment types"
ON public.appointment_types
FOR SELECT
TO anon
USING (is_active = true);

GRANT SELECT ON public.appointment_types TO anon;