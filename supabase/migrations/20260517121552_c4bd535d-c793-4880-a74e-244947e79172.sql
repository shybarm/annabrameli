
-- Remove overly permissive public read on appointment_types (pricing/services).
-- Edge functions (guest-booking) use service_role and bypass RLS, so public access is unnecessary.
DROP POLICY IF EXISTS "Public can view active appointment types" ON public.appointment_types;

-- Restrict system insert/update policies to service_role only.
-- Previously these used WITH CHECK (true) on the public role, allowing any anon user to write.

DROP POLICY IF EXISTS "System can insert AI logs" ON public.ai_output_log;
CREATE POLICY "Service role can insert AI logs"
  ON public.ai_output_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert delivery logs" ON public.reminder_delivery_log;
CREATE POLICY "Service role can insert delivery logs"
  ON public.reminder_delivery_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert reminder runs" ON public.reminder_runs;
CREATE POLICY "Service role can insert reminder runs"
  ON public.reminder_runs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update reminder runs" ON public.reminder_runs;
CREATE POLICY "Service role can update reminder runs"
  ON public.reminder_runs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
