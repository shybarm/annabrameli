-- Add columns to track individual reminder sending on appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_2h_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Create reminder_schedules table to store configurable reminder times
CREATE TABLE IF NOT EXISTS public.reminder_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hours_before INTEGER NOT NULL,
  send_whatsapp BOOLEAN DEFAULT true,
  send_email BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminder_schedules ENABLE ROW LEVEL SECURITY;

-- Only staff can manage reminder schedules
CREATE POLICY "Staff can manage reminder schedules" 
ON public.reminder_schedules 
FOR ALL 
USING (is_staff(auth.uid()));

-- Anyone can view reminder schedules (for edge function)
CREATE POLICY "Anyone can view reminder schedules" 
ON public.reminder_schedules 
FOR SELECT 
USING (true);

-- Insert default reminder schedules (24 hours and 2 hours before)
INSERT INTO public.reminder_schedules (hours_before, send_whatsapp, send_email, is_active)
VALUES 
  (24, true, true, true),
  (2, true, false, true)
ON CONFLICT DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_reminder_schedules_updated_at
BEFORE UPDATE ON public.reminder_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();