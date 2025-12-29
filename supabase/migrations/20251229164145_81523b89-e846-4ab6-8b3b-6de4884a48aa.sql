-- =============================================
-- FIX 1: PHI Access Logging Triggers
-- Creates database triggers to automatically log all access to PHI tables
-- =============================================

-- Function to log PHI access automatically
CREATE OR REPLACE FUNCTION public.phi_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor_id uuid;
  _actor_role text;
  _action text;
  _record_id uuid;
  _old_values jsonb;
  _new_values jsonb;
  _phi_fields text[];
BEGIN
  -- Get current user
  _actor_id := auth.uid();
  
  -- Get actor role
  SELECT role::text INTO _actor_role
  FROM public.user_roles
  WHERE user_id = _actor_id
  LIMIT 1;
  
  _action := TG_OP;
  
  -- Define PHI fields per table
  IF TG_TABLE_NAME = 'patients' THEN
    _phi_fields := ARRAY['id_number', 'email', 'phone', 'address', 'insurance_number', 'emergency_contact_phone', 'medical_notes', 'allergies', 'current_medications'];
  ELSIF TG_TABLE_NAME = 'appointments' THEN
    _phi_fields := ARRAY['notes', 'internal_notes', 'visit_summary', 'treatment_plan', 'medications'];
  ELSIF TG_TABLE_NAME = 'patient_documents' THEN
    _phi_fields := ARRAY['file_path', 'ai_summary', 'title', 'description'];
  ELSIF TG_TABLE_NAME = 'messages' THEN
    _phi_fields := ARRAY['content', 'subject'];
  ELSE
    _phi_fields := ARRAY[]::text[];
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    _record_id := OLD.id;
    _old_values := to_jsonb(OLD);
    _new_values := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    _record_id := NEW.id;
    _old_values := to_jsonb(OLD);
    _new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    _record_id := NEW.id;
    _old_values := NULL;
    _new_values := to_jsonb(NEW);
  END IF;
  
  -- Log to PHI access log
  INSERT INTO public.phi_access_log (
    actor_id,
    actor_role,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    phi_fields_accessed,
    ip_address,
    created_at
  ) VALUES (
    _actor_id,
    COALESCE(_actor_role, 'anonymous'),
    TG_TABLE_NAME,
    _record_id,
    _action,
    _old_values,
    _new_values,
    _phi_fields,
    NULL, -- IP captured at application layer
    now()
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers on PHI tables
DROP TRIGGER IF EXISTS phi_audit_patients ON public.patients;
CREATE TRIGGER phi_audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.phi_audit_trigger();

DROP TRIGGER IF EXISTS phi_audit_appointments ON public.appointments;
CREATE TRIGGER phi_audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.phi_audit_trigger();

DROP TRIGGER IF EXISTS phi_audit_patient_documents ON public.patient_documents;
CREATE TRIGGER phi_audit_patient_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_documents
  FOR EACH ROW EXECUTE FUNCTION public.phi_audit_trigger();

DROP TRIGGER IF EXISTS phi_audit_messages ON public.messages;
CREATE TRIGGER phi_audit_messages
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.phi_audit_trigger();

-- =============================================
-- FIX 2: Multi-Tenant Clinic Isolation
-- Helper function to get user's clinic_id
-- =============================================

CREATE OR REPLACE FUNCTION public.get_user_clinic_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to check if user can access a specific clinic's data
CREATE OR REPLACE FUNCTION public.can_access_clinic(_user_id uuid, _clinic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND (
      role = 'admin' -- Admins can access all clinics
      OR clinic_id IS NULL -- Staff without clinic restriction
      OR clinic_id = _clinic_id -- Staff assigned to specific clinic
    )
  )
$$;

-- =============================================
-- FIX 3: Electronic Signatures Immutability
-- =============================================

-- Drop existing policies if any allow DELETE
DROP POLICY IF EXISTS "Staff can delete signatures" ON public.electronic_signatures;

-- Create restrictive policy to prevent ALL deletes
CREATE POLICY "Signatures are immutable - no deletions"
ON public.electronic_signatures
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false); -- Never allow delete

-- Also prevent updates to signature data
DROP POLICY IF EXISTS "Staff can update signatures" ON public.electronic_signatures;
CREATE POLICY "Signatures are immutable - no updates"
ON public.electronic_signatures
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false); -- Never allow update

-- =============================================
-- FIX 4: Profiles Table - Restrict Access
-- =============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create strict policy: users can only see their own profile
CREATE POLICY "Users can only view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all profiles (for team management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Staff can view other staff profiles only (not patient profiles)
CREATE POLICY "Staff can view staff profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_staff(auth.uid()) 
  AND public.is_staff(user_id)
);