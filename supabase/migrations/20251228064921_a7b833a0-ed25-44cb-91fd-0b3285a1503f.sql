-- Update trigger to always create a patient record for ALL new users
-- This ensures team members (staff) also appear in the patients list

CREATE OR REPLACE FUNCTION public.handle_new_patient_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create a patient record for ALL new users (including staff)
  INSERT INTO public.patients (
    user_id,
    first_name,
    last_name,
    email
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'מטופל'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'חדש'),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;