-- Add explicit RESTRICTIVE RLS policies denying anonymous access to all PHI/PII tables
-- This provides defense-in-depth security beyond the existing permissive policies

-- 1. patients table
CREATE POLICY "Deny anonymous access to patients"
ON public.patients
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 2. appointments table
CREATE POLICY "Deny anonymous access to appointments"
ON public.appointments
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 3. patient_documents table
CREATE POLICY "Deny anonymous access to patient_documents"
ON public.patient_documents
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 4. messages table
CREATE POLICY "Deny anonymous access to messages"
ON public.messages
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 5. invoices table
CREATE POLICY "Deny anonymous access to invoices"
ON public.invoices
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 6. invoice_items table
CREATE POLICY "Deny anonymous access to invoice_items"
ON public.invoice_items
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 7. payments table
CREATE POLICY "Deny anonymous access to payments"
ON public.payments
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 8. profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 9. electronic_signatures table
CREATE POLICY "Deny anonymous access to electronic_signatures"
ON public.electronic_signatures
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 10. phi_access_log table
CREATE POLICY "Deny anonymous access to phi_access_log"
ON public.phi_access_log
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 11. audit_log table
CREATE POLICY "Deny anonymous access to audit_log"
ON public.audit_log
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 12. active_sessions table
CREATE POLICY "Deny anonymous access to active_sessions"
ON public.active_sessions
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);