-- Create reminder_runs logging table
CREATE TABLE public.reminder_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  processed_count INTEGER DEFAULT 0,
  email_sent_count INTEGER DEFAULT 0,
  whatsapp_sent_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB,
  trigger_type TEXT DEFAULT 'cron'
);

-- Enable RLS (only staff can view)
ALTER TABLE public.reminder_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view reminder runs"
ON public.reminder_runs
FOR SELECT
USING (public.is_staff(auth.uid()));

-- Index for recent runs lookup
CREATE INDEX idx_reminder_runs_started_at ON public.reminder_runs(started_at DESC);