-- Add doctor details to clinics table for per-clinic settings
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS doctor_name TEXT,
ADD COLUMN IF NOT EXISTS doctor_license TEXT,
ADD COLUMN IF NOT EXISTS doctor_specialty TEXT;

-- Migrate existing settings from clinic_settings to first clinic (if any)
-- This is optional data migration for existing setups