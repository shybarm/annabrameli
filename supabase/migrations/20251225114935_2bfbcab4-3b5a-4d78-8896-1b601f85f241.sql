-- Create intake_tokens table for unique patient intake links
CREATE TABLE IF NOT EXISTS public.intake_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  completed_at TIMESTAMP WITH TIME ZONE,
  sent_via TEXT, -- 'whatsapp', 'email', 'sms'
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.intake_tokens ENABLE ROW LEVEL SECURITY;

-- Staff can manage intake tokens
CREATE POLICY "Staff can manage intake tokens" 
ON public.intake_tokens 
FOR ALL 
USING (is_staff(auth.uid()));

-- Anyone can view their token (for the public intake page)
CREATE POLICY "Anyone can view valid tokens" 
ON public.intake_tokens 
FOR SELECT 
USING (
  expires_at > now() 
  AND completed_at IS NULL
);

-- Add intake form fields to patients table
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS intake_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS intake_token_id UUID REFERENCES public.intake_tokens(id),
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS num_children INTEGER,
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[],
ADD COLUMN IF NOT EXISTS current_medications TEXT,
ADD COLUMN IF NOT EXISTS previous_surgeries TEXT,
ADD COLUMN IF NOT EXISTS family_medical_history TEXT,
ADD COLUMN IF NOT EXISTS smoking_status TEXT,
ADD COLUMN IF NOT EXISTS alcohol_consumption TEXT,
ADD COLUMN IF NOT EXISTS exercise_frequency TEXT,
ADD COLUMN IF NOT EXISTS sleep_hours INTEGER,
ADD COLUMN IF NOT EXISTS stress_level TEXT,
ADD COLUMN IF NOT EXISTS main_complaint TEXT,
ADD COLUMN IF NOT EXISTS symptoms_duration TEXT,
ADD COLUMN IF NOT EXISTS previous_treatments TEXT,
ADD COLUMN IF NOT EXISTS treatment_goals TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_time TEXT;