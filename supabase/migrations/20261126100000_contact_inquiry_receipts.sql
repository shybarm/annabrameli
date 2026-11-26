-- Service-only receipt ledger. No contact details or medical text are stored here.
CREATE TABLE public.contact_inquiry_receipts (
  inquiry_reference uuid PRIMARY KEY,
  payload_hash text NOT NULL,
  form_source text NOT NULL,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  email_status text NOT NULL DEFAULT 'sending' CHECK (email_status IN ('sending','accepted','failed','unknown')),
  provider_message_id text,
  accepted_at timestamptz
);
ALTER TABLE public.contact_inquiry_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_inquiry_receipts FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.contact_inquiry_receipts TO service_role;
COMMENT ON COLUMN public.contact_inquiry_receipts.email_status IS 'accepted means provider acceptance, not delivery to the recipient inbox';
