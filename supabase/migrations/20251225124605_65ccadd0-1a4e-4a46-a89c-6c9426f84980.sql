-- Create clinics table for multi-clinic support
CREATE TABLE public.clinics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  working_hours JSONB DEFAULT '{"sunday": {"open": "09:00", "close": "18:00"}, "monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "13:00"}, "saturday": null}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table for clinic expenses tracking
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id),
  category TEXT NOT NULL, -- rent, salary, utilities, supplies, marketing, insurance, other
  description TEXT,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recurring BOOLEAN DEFAULT false,
  recurring_interval TEXT, -- monthly, quarterly, yearly
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral_sources table for tracking how patients heard about us
CREATE TABLE public.referral_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add clinic_id to appointments for multi-clinic support
ALTER TABLE public.appointments ADD COLUMN clinic_id UUID REFERENCES public.clinics(id);

-- Add clinic_id to user_roles for staff assignments per clinic
ALTER TABLE public.user_roles ADD COLUMN clinic_id UUID REFERENCES public.clinics(id);

-- Enable RLS on new tables
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_sources ENABLE ROW LEVEL SECURITY;

-- Clinics policies
CREATE POLICY "Staff can view clinics" ON public.clinics FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage clinics" ON public.clinics FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Expenses policies
CREATE POLICY "Staff can view expenses" ON public.expenses FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Referral sources policies
CREATE POLICY "Staff can view referral sources" ON public.referral_sources FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage referral sources" ON public.referral_sources FOR ALL USING (is_staff(auth.uid()));

-- Insert default clinic
INSERT INTO public.clinics (name, address, city) VALUES ('מרפאה ראשית', 'רחוב הרופא 1', 'תל אביב');

-- Insert common referral sources
INSERT INTO public.referral_sources (name) VALUES 
  ('המלצת חבר/משפחה'),
  ('Google'),
  ('Facebook/Instagram'),
  ('רופא מפנה'),
  ('אתר המרפאה'),
  ('אחר')
ON CONFLICT (name) DO NOTHING;

-- Create trigger for updating timestamps
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();