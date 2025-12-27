-- Create a function to check granular permissions from user_roles
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'doctor', 'secretary')
      AND (
        -- Admins always have all permissions
        role = 'admin'
        OR
        -- Check specific permission in JSON
        (permissions->>_permission)::boolean = true
      )
  )
$$;

-- Create convenience functions for each permission type
CREATE OR REPLACE FUNCTION public.can_view_patients(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_permission(_user_id, 'canViewPatients')
$$;

CREATE OR REPLACE FUNCTION public.can_edit_patients(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_permission(_user_id, 'canEditPatients')
$$;

CREATE OR REPLACE FUNCTION public.can_view_appointments(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_permission(_user_id, 'canViewAppointments')
$$;

CREATE OR REPLACE FUNCTION public.can_edit_appointments(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_permission(_user_id, 'canEditAppointments')
$$;

CREATE OR REPLACE FUNCTION public.can_view_billing(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_permission(_user_id, 'canViewBilling')
$$;

CREATE OR REPLACE FUNCTION public.can_edit_billing(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_permission(_user_id, 'canEditBilling')
$$;

CREATE OR REPLACE FUNCTION public.can_view_documents(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_permission(_user_id, 'canViewDocuments')
$$;

CREATE OR REPLACE FUNCTION public.can_edit_documents(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_permission(_user_id, 'canEditDocuments')
$$;

-- Update patients table RLS policies
DROP POLICY IF EXISTS "Staff can manage patients" ON public.patients;

CREATE POLICY "Staff can view patients"
ON public.patients
FOR SELECT
USING (can_view_patients(auth.uid()));

CREATE POLICY "Staff can insert patients"
ON public.patients
FOR INSERT
WITH CHECK (can_edit_patients(auth.uid()));

CREATE POLICY "Staff can update patients"
ON public.patients
FOR UPDATE
USING (can_edit_patients(auth.uid()));

CREATE POLICY "Staff can delete patients"
ON public.patients
FOR DELETE
USING (can_edit_patients(auth.uid()));

-- Update appointments table RLS policies
DROP POLICY IF EXISTS "Staff can manage all appointments" ON public.appointments;

CREATE POLICY "Staff can view appointments"
ON public.appointments
FOR SELECT
USING (can_view_appointments(auth.uid()));

CREATE POLICY "Staff can insert appointments"
ON public.appointments
FOR INSERT
WITH CHECK (can_edit_appointments(auth.uid()));

CREATE POLICY "Staff can update appointments"
ON public.appointments
FOR UPDATE
USING (can_edit_appointments(auth.uid()));

CREATE POLICY "Staff can delete appointments"
ON public.appointments
FOR DELETE
USING (can_edit_appointments(auth.uid()));

-- Update invoices table RLS policies
DROP POLICY IF EXISTS "Staff can manage invoices" ON public.invoices;

CREATE POLICY "Staff can view invoices"
ON public.invoices
FOR SELECT
USING (can_view_billing(auth.uid()));

CREATE POLICY "Staff can insert invoices"
ON public.invoices
FOR INSERT
WITH CHECK (can_edit_billing(auth.uid()));

CREATE POLICY "Staff can update invoices"
ON public.invoices
FOR UPDATE
USING (can_edit_billing(auth.uid()));

CREATE POLICY "Staff can delete invoices"
ON public.invoices
FOR DELETE
USING (can_edit_billing(auth.uid()));

-- Update invoice_items table RLS policies
DROP POLICY IF EXISTS "Staff can manage invoice items" ON public.invoice_items;

CREATE POLICY "Staff can view invoice items"
ON public.invoice_items
FOR SELECT
USING (can_view_billing(auth.uid()));

CREATE POLICY "Staff can insert invoice items"
ON public.invoice_items
FOR INSERT
WITH CHECK (can_edit_billing(auth.uid()));

CREATE POLICY "Staff can update invoice items"
ON public.invoice_items
FOR UPDATE
USING (can_edit_billing(auth.uid()));

CREATE POLICY "Staff can delete invoice items"
ON public.invoice_items
FOR DELETE
USING (can_edit_billing(auth.uid()));

-- Update payments table RLS policies
DROP POLICY IF EXISTS "Staff can manage payments" ON public.payments;

CREATE POLICY "Staff can view payments"
ON public.payments
FOR SELECT
USING (can_view_billing(auth.uid()));

CREATE POLICY "Staff can insert payments"
ON public.payments
FOR INSERT
WITH CHECK (can_edit_billing(auth.uid()));

CREATE POLICY "Staff can update payments"
ON public.payments
FOR UPDATE
USING (can_edit_billing(auth.uid()));

CREATE POLICY "Staff can delete payments"
ON public.payments
FOR DELETE
USING (can_edit_billing(auth.uid()));

-- Update patient_documents table RLS policies
DROP POLICY IF EXISTS "Staff can manage documents" ON public.patient_documents;

CREATE POLICY "Staff can view documents"
ON public.patient_documents
FOR SELECT
USING (can_view_documents(auth.uid()));

CREATE POLICY "Staff can insert documents"
ON public.patient_documents
FOR INSERT
WITH CHECK (can_edit_documents(auth.uid()));

CREATE POLICY "Staff can update documents"
ON public.patient_documents
FOR UPDATE
USING (can_edit_documents(auth.uid()));

CREATE POLICY "Staff can delete documents"
ON public.patient_documents
FOR DELETE
USING (can_edit_documents(auth.uid()));

-- Update messages table to use patient viewing permission
DROP POLICY IF EXISTS "Staff can manage messages" ON public.messages;

CREATE POLICY "Staff can view messages"
ON public.messages
FOR SELECT
USING (can_view_patients(auth.uid()));

CREATE POLICY "Staff can insert messages"
ON public.messages
FOR INSERT
WITH CHECK (can_edit_patients(auth.uid()));

CREATE POLICY "Staff can update messages"
ON public.messages
FOR UPDATE
USING (can_edit_patients(auth.uid()));

CREATE POLICY "Staff can delete messages"
ON public.messages
FOR DELETE
USING (can_edit_patients(auth.uid()));