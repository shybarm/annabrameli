-- Create reminder delivery log table for per-message logging (no PHI)
CREATE TABLE IF NOT EXISTS public.reminder_delivery_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  provider_message_id text,
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for querying by appointment
CREATE INDEX idx_reminder_delivery_log_appointment ON public.reminder_delivery_log(appointment_id);

-- Index for querying by status/channel
CREATE INDEX idx_reminder_delivery_log_channel_status ON public.reminder_delivery_log(channel, status, created_at DESC);

-- Enable RLS
ALTER TABLE public.reminder_delivery_log ENABLE ROW LEVEL SECURITY;

-- Staff can view logs
CREATE POLICY "Staff can view delivery logs"
  ON public.reminder_delivery_log
  FOR SELECT
  USING (is_staff(auth.uid()));

-- System (service role) can insert logs
CREATE POLICY "System can insert delivery logs"
  ON public.reminder_delivery_log
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions for service role insert via reminder_runs
ALTER TABLE public.reminder_runs ENABLE ROW LEVEL SECURITY;

-- Add insert policy for service role on reminder_runs
CREATE POLICY "System can insert reminder runs"
  ON public.reminder_runs
  FOR INSERT
  WITH CHECK (true);

-- Update policy for service role on reminder_runs
CREATE POLICY "System can update reminder runs"
  ON public.reminder_runs
  FOR UPDATE
  USING (true);