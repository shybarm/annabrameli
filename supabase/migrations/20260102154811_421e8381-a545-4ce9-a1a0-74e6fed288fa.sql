-- Allow public (anon) read access to active appointment types for guest booking
-- This table contains no PHI and is required for public booking flows.
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'appointment_types'
      AND policyname = 'Public can view active appointment types'
  ) THEN
    CREATE POLICY "Public can view active appointment types"
    ON public.appointment_types
    FOR SELECT
    USING (is_active IS TRUE);
  END IF;
END $$;