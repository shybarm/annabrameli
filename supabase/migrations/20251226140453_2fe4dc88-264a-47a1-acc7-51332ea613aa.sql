-- Fix profiles table RLS policies - make them PERMISSIVE
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create PERMISSIVE SELECT policies (OR'd together)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all profiles"
ON public.profiles
FOR SELECT
USING (is_staff(auth.uid()));

-- Fix patients table policies - ensure proper isolation
DROP POLICY IF EXISTS "Patients can view own record" ON public.patients;
DROP POLICY IF EXISTS "Patients can update own record" ON public.patients;
DROP POLICY IF EXISTS "Staff can manage patients" ON public.patients;
DROP POLICY IF EXISTS "Guest booking can create patients" ON public.patients;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Patients can view own record"
ON public.patients
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Patients can update own record"
ON public.patients
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Staff can manage patients"
ON public.patients
FOR ALL
USING (is_staff(auth.uid()));

-- Guest booking - intentional for guest flow but properly scoped
CREATE POLICY "Guest booking can create patients"
ON public.patients
FOR INSERT
WITH CHECK (user_id IS NULL);

-- Fix appointments table policies - ensure patient data isolation
DROP POLICY IF EXISTS "Patients can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can cancel their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff can manage all appointments" ON public.appointments;

CREATE POLICY "Patients can view their appointments"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = appointments.patient_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = appointments.patient_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can cancel their appointments"
ON public.appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = appointments.patient_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can manage all appointments"
ON public.appointments
FOR ALL
USING (is_staff(auth.uid()));