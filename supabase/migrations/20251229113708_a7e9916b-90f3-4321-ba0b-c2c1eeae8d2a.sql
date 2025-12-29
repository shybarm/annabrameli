-- =====================================================
-- ISO 27799 SECURITY HARDENING MIGRATION
-- =====================================================

-- 1. CREATE RATE LIMITING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP address or fingerprint hash
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_lookup ON public.rate_limits (identifier, endpoint, window_start);
CREATE INDEX idx_rate_limits_cleanup ON public.rate_limits (window_start);

-- Enable RLS on rate_limits - only service role can access
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.rate_limits
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 2. CREATE GUEST BOOKINGS STAGING TABLE
-- Separate table for unauthenticated bookings - not the main patients table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.guest_booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text,
  clinic_id uuid REFERENCES public.clinics(id),
  appointment_type_id uuid REFERENCES public.appointment_types(id),
  requested_date date NOT NULL,
  requested_time time NOT NULL,
  notes text,
  captcha_token text, -- Store hashed CAPTCHA verification
  ip_address text, -- For abuse tracking
  fingerprint_hash text, -- Browser fingerprint hash
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approved_at timestamp with time zone,
  approved_by uuid,
  patient_id uuid REFERENCES public.patients(id), -- Links to patient after approval
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_guest_bookings_status ON public.guest_booking_requests (status, created_at);
CREATE INDEX idx_guest_bookings_expiry ON public.guest_booking_requests (expires_at) WHERE status = 'pending';
CREATE INDEX idx_guest_bookings_ip ON public.guest_booking_requests (ip_address, created_at);

ALTER TABLE public.guest_booking_requests ENABLE ROW LEVEL SECURITY;

-- Only unauthenticated can INSERT to staging table
CREATE POLICY "Guests can create booking requests" ON public.guest_booking_requests
FOR INSERT WITH CHECK (auth.uid() IS NULL);

-- Staff can view and manage
CREATE POLICY "Staff can view booking requests" ON public.guest_booking_requests
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can update booking requests" ON public.guest_booking_requests
FOR UPDATE USING (is_staff(auth.uid()));

CREATE POLICY "Staff can delete booking requests" ON public.guest_booking_requests
FOR DELETE USING (is_staff(auth.uid()));

-- 3. REMOVE GUEST INSERT CAPABILITY FROM PATIENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Guest booking can create patients" ON public.patients;

-- 4. REMOVE GUEST INSERT CAPABILITY FROM APPOINTMENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Guest booking can create appointments" ON public.appointments;

-- 5. FIX PROFILES TABLE RLS - PREVENT STAFF ENUMERATION
-- =====================================================
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

-- Create restrictive policy: users see own, staff see only staff
CREATE POLICY "Users can view own profile only" ON public.profiles
FOR SELECT USING (
  auth.uid() = user_id
  OR (
    is_staff(auth.uid()) 
    AND is_staff(user_id)
  )
);

-- 6. ADD FOREIGN KEY CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================
-- Note: These may already exist, using IF NOT EXISTS pattern

-- Ensure appointments reference valid patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_patient_id_fkey'
  ) THEN
    ALTER TABLE public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure patient_documents reference valid patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_documents_patient_id_fkey'
  ) THEN
    ALTER TABLE public.patient_documents
    ADD CONSTRAINT patient_documents_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure messages reference valid patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_patient_id_fkey'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT messages_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 7. COMPREHENSIVE AUDIT LOGGING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.phi_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL CHECK (action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  phi_fields_accessed text[],
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_phi_access_log_actor ON public.phi_access_log (actor_id, created_at);
CREATE INDEX idx_phi_access_log_table ON public.phi_access_log (table_name, created_at);
CREATE INDEX idx_phi_access_log_time ON public.phi_access_log (created_at);

-- RLS: Only admins can read, system can write
ALTER TABLE public.phi_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view PHI access logs" ON public.phi_access_log
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow inserts from triggers (service role)
CREATE POLICY "System can insert logs" ON public.phi_access_log
FOR INSERT WITH CHECK (true);

-- Make logs immutable
-- No UPDATE or DELETE policies

-- 8. CREATE COMPREHENSIVE AUDIT TRIGGER FUNCTION
-- =====================================================
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
BEGIN
  -- Get current user
  _actor_id := auth.uid();
  
  -- Get actor role
  SELECT role::text INTO _actor_role
  FROM public.user_roles
  WHERE user_id = _actor_id
  LIMIT 1;
  
  _action := TG_OP;
  
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
    created_at
  ) VALUES (
    _actor_id,
    COALESCE(_actor_role, 'anonymous'),
    TG_TABLE_NAME,
    _record_id,
    _action,
    _old_values,
    _new_values,
    now()
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 9. APPLY AUDIT TRIGGERS TO ALL PHI TABLES
-- =====================================================
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

DROP TRIGGER IF EXISTS phi_audit_invoices ON public.invoices;
CREATE TRIGGER phi_audit_invoices
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.phi_audit_trigger();

DROP TRIGGER IF EXISTS phi_audit_payments ON public.payments;
CREATE TRIGGER phi_audit_payments
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.phi_audit_trigger();

-- 10. RATE LIMITING HELPER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _endpoint text,
  _max_requests integer DEFAULT 10,
  _window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _window_start timestamp with time zone;
  _current_count integer;
BEGIN
  _window_start := now() - (_window_seconds || ' seconds')::interval;
  
  -- Count requests in current window
  SELECT COALESCE(SUM(request_count), 0) INTO _current_count
  FROM public.rate_limits
  WHERE identifier = _identifier
    AND endpoint = _endpoint
    AND window_start >= _window_start;
  
  -- Check if limit exceeded
  IF _current_count >= _max_requests THEN
    RETURN false;
  END IF;
  
  -- Record this request
  INSERT INTO public.rate_limits (identifier, endpoint, window_start, request_count)
  VALUES (_identifier, _endpoint, date_trunc('minute', now()), 1)
  ON CONFLICT DO NOTHING;
  
  -- If no insert happened, increment existing
  UPDATE public.rate_limits
  SET request_count = request_count + 1
  WHERE identifier = _identifier
    AND endpoint = _endpoint
    AND window_start = date_trunc('minute', now());
  
  RETURN true;
END;
$$;

-- 11. FILE SCAN STATUS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.file_scan_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.patient_documents(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  scan_status text NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'scanning', 'clean', 'infected', 'error')),
  scan_result jsonb,
  scanned_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_file_scan_queue_status ON public.file_scan_queue (scan_status, created_at);
CREATE UNIQUE INDEX idx_file_scan_queue_document ON public.file_scan_queue (document_id);

ALTER TABLE public.file_scan_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view scan results" ON public.file_scan_queue
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "System can manage scans" ON public.file_scan_queue
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 12. SESSION MANAGEMENT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  ip_address text,
  user_agent text,
  last_activity timestamp with time zone NOT NULL DEFAULT now(),
  idle_timeout_minutes integer NOT NULL DEFAULT 15,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_active_sessions_user ON public.active_sessions (user_id, last_activity);
CREATE INDEX idx_active_sessions_expiry ON public.active_sessions (expires_at);
CREATE UNIQUE INDEX idx_active_sessions_token ON public.active_sessions (session_token);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.active_sessions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON public.active_sessions
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions" ON public.active_sessions
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 13. SESSION VALIDATION FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_session(
  _session_token text,
  _user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session record;
BEGIN
  SELECT * INTO _session
  FROM public.active_sessions
  WHERE session_token = _session_token
    AND user_id = _user_id
    AND expires_at > now();
  
  IF _session IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check idle timeout
  IF _session.last_activity < (now() - (_session.idle_timeout_minutes || ' minutes')::interval) THEN
    -- Session expired due to inactivity
    DELETE FROM public.active_sessions WHERE id = _session.id;
    RETURN false;
  END IF;
  
  -- Update last activity
  UPDATE public.active_sessions
  SET last_activity = now()
  WHERE id = _session.id;
  
  RETURN true;
END;
$$;

-- 14. CLEANUP FUNCTION FOR EXPIRED DATA
-- =====================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete expired guest booking requests
  DELETE FROM public.guest_booking_requests
  WHERE status = 'pending' AND expires_at < now();
  
  -- Delete old rate limit records (older than 1 hour)
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
  
  -- Delete expired sessions
  DELETE FROM public.active_sessions
  WHERE expires_at < now();
  
  -- Delete expired intake tokens
  DELETE FROM public.intake_tokens
  WHERE expires_at < now() AND completed_at IS NULL;
  
  -- Delete expired upload tokens
  DELETE FROM public.upload_tokens
  WHERE expires_at < now() AND used_at IS NULL;
END;
$$;

-- 15. AI OUTPUT SANITIZATION LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_output_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  input_hash text, -- Hash of input, not the input itself
  output_sanitized boolean NOT NULL DEFAULT false,
  phi_detected boolean NOT NULL DEFAULT false,
  phi_removed_fields text[],
  actor_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_output_log_function ON public.ai_output_log (function_name, created_at);

ALTER TABLE public.ai_output_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view AI logs" ON public.ai_output_log
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert AI logs" ON public.ai_output_log
FOR INSERT WITH CHECK (true);