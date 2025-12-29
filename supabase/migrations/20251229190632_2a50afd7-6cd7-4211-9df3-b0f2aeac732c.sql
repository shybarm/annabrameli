-- Create work_sessions table
CREATE TABLE public.work_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME WITHOUT TIME ZONE,
  end_time TIME WITHOUT TIME ZONE,
  status TEXT NOT NULL DEFAULT 'auto' CHECK (status IN ('auto', 'edited', 'approved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Enable RLS
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON public.work_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
ON public.work_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions (today only, not approved)
CREATE POLICY "Users can update own sessions today"
ON public.work_sessions
FOR UPDATE
USING (auth.uid() = user_id AND date = CURRENT_DATE AND status != 'approved');

-- Staff can view all sessions
CREATE POLICY "Staff can view all sessions"
ON public.work_sessions
FOR SELECT
USING (is_staff(auth.uid()));

-- Managers can update status to approved
CREATE POLICY "Staff can approve sessions"
ON public.work_sessions
FOR UPDATE
USING (is_staff(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_work_sessions_updated_at
BEFORE UPDATE ON public.work_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();