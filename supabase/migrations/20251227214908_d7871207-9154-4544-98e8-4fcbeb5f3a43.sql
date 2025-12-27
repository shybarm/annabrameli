-- Fix: Update RLS policy for guest patient creation
-- The issue is that the current policy checks (user_id IS NULL) but
-- guest bookings don't explicitly set user_id, so Postgres uses the default (which is NULL)
-- But the policy needs to check the NEW row being inserted

-- Drop the existing policy
DROP POLICY IF EXISTS "Guest booking can create patients" ON public.patients;

-- Create a new policy that properly handles anonymous inserts
-- This allows unauthenticated users to create patients where user_id is not set
CREATE POLICY "Guest booking can create patients"
ON public.patients
FOR INSERT
WITH CHECK (
  -- Allow insert only when there's no authenticated user AND user_id is null
  auth.uid() IS NULL AND user_id IS NULL
);