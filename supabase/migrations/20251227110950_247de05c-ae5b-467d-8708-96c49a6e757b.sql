-- Add clinic_id to patients table
ALTER TABLE public.patients ADD COLUMN clinic_id uuid REFERENCES public.clinics(id);

-- Create index for better query performance
CREATE INDEX idx_patients_clinic_id ON public.patients(clinic_id);