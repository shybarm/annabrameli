
-- ============================================================
-- RLS POLICIES FOR OTP/VERIFICATION TABLES
-- ISO 27799: Deny all client access, service-role only
-- These tables contain sensitive tokens that must never be exposed
-- ============================================================

-- booking_otp: RLS is already enabled, add deny-all policies
-- Policy: Deny all access to regular users (anon/authenticated)
CREATE POLICY "Deny all client access to booking_otp"
ON public.booking_otp
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Policy: Allow service role full access (edge functions)
CREATE POLICY "Service role full access to booking_otp"
ON public.booking_otp
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- email_verifications: RLS is already enabled, add deny-all policies
-- Policy: Deny all access to regular users (anon/authenticated)
CREATE POLICY "Deny all client access to email_verifications"
ON public.email_verifications
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Policy: Allow service role full access (edge functions)
CREATE POLICY "Service role full access to email_verifications"
ON public.email_verifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add index for efficient expiry cleanup on booking_otp
CREATE INDEX IF NOT EXISTS idx_booking_otp_expires_at 
ON public.booking_otp(expires_at) 
WHERE verified = false;

-- Add index for efficient expiry cleanup on email_verifications
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at 
ON public.email_verifications(expires_at) 
WHERE verified_at IS NULL;