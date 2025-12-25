-- Fix audit_log RLS policy to restrict inserts to authenticated staff only
-- This prevents unauthenticated users from polluting the audit log

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

-- Create a more restrictive policy that only allows authenticated staff to insert audit logs
CREATE POLICY "Staff can insert audit logs"
ON public.audit_log FOR INSERT
WITH CHECK (
  is_staff(auth.uid()) 
  AND (user_id = auth.uid() OR user_id IS NULL)
);