-- =====================================================
-- CRITICAL SECURITY HARDENING FOR MEDICAL APPLICATION
-- =====================================================

-- 1. FIX INTAKE TOKENS - Remove public read access, require token validation through edge function only
DROP POLICY IF EXISTS "Token holders can validate specific token" ON public.intake_tokens;

-- Only staff can manage intake tokens, no public SELECT
-- Token validation will be done through secure edge function with service role

-- 2. FIX UPLOAD TOKENS - Remove public create access, restrict to staff only
DROP POLICY IF EXISTS "Anyone can create upload tokens" ON public.upload_tokens;

-- Only staff can create upload tokens
CREATE POLICY "Staff can create upload tokens"
ON public.upload_tokens FOR INSERT
WITH CHECK (is_staff(auth.uid()));

-- 3. RESTRICT CLINIC SETTINGS - Only staff should see operational settings
DROP POLICY IF EXISTS "Anyone can view settings" ON public.clinic_settings;

-- Staff only access for clinic settings
CREATE POLICY "Staff can view settings"
ON public.clinic_settings FOR SELECT
USING (is_staff(auth.uid()));

-- 4. RESTRICT REMINDER SCHEDULES - Only staff should see communication strategy
DROP POLICY IF EXISTS "Anyone can view reminder schedules" ON public.reminder_schedules;

CREATE POLICY "Staff can view reminder schedules"
ON public.reminder_schedules FOR SELECT
USING (is_staff(auth.uid()));