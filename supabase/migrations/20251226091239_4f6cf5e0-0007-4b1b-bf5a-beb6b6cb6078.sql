-- Create audit trigger function that logs all changes automatically
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _old_data jsonb;
  _new_data jsonb;
  _action text;
  _record_id uuid;
BEGIN
  -- Get the current user ID from the JWT
  _user_id := auth.uid();
  
  -- Determine the action type
  _action := TG_OP;
  
  -- Set old and new data based on operation
  IF TG_OP = 'DELETE' THEN
    _old_data := to_jsonb(OLD);
    _new_data := NULL;
    _record_id := OLD.id;
  ELSIF TG_OP = 'UPDATE' THEN
    _old_data := to_jsonb(OLD);
    _new_data := to_jsonb(NEW);
    _record_id := NEW.id;
  ELSIF TG_OP = 'INSERT' THEN
    _old_data := NULL;
    _new_data := to_jsonb(NEW);
    _record_id := NEW.id;
  END IF;
  
  -- Insert audit log entry
  INSERT INTO public.audit_log (
    user_id,
    table_name,
    action,
    record_id,
    old_data,
    new_data,
    created_at
  ) VALUES (
    _user_id,
    TG_TABLE_NAME,
    _action,
    _record_id,
    _old_data,
    _new_data,
    now()
  );
  
  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for all important tables

-- Patients table
DROP TRIGGER IF EXISTS audit_patients ON public.patients;
CREATE TRIGGER audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Appointments table
DROP TRIGGER IF EXISTS audit_appointments ON public.appointments;
CREATE TRIGGER audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Invoices table
DROP TRIGGER IF EXISTS audit_invoices ON public.invoices;
CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Invoice items table
DROP TRIGGER IF EXISTS audit_invoice_items ON public.invoice_items;
CREATE TRIGGER audit_invoice_items
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Payments table
DROP TRIGGER IF EXISTS audit_payments ON public.payments;
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Patient documents table
DROP TRIGGER IF EXISTS audit_patient_documents ON public.patient_documents;
CREATE TRIGGER audit_patient_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_documents
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Messages table
DROP TRIGGER IF EXISTS audit_messages ON public.messages;
CREATE TRIGGER audit_messages
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- User roles table
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Clinic settings table
DROP TRIGGER IF EXISTS audit_clinic_settings ON public.clinic_settings;
CREATE TRIGGER audit_clinic_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.clinic_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Appointment types table
DROP TRIGGER IF EXISTS audit_appointment_types ON public.appointment_types;
CREATE TRIGGER audit_appointment_types
  AFTER INSERT OR UPDATE OR DELETE ON public.appointment_types
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();