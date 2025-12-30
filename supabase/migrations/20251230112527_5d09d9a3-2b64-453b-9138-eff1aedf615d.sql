-- Create booking_otp table for SMS verification
CREATE TABLE public.booking_otp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_token UUID,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for phone lookups
CREATE INDEX idx_booking_otp_phone ON public.booking_otp(phone);

-- Create index for cleanup queries
CREATE INDEX idx_booking_otp_expires ON public.booking_otp(expires_at);

-- Enable RLS
ALTER TABLE public.booking_otp ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - table is accessed only via service role in edge functions