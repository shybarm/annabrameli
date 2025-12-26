-- Add payment link column to invoices table for manual payment links (bit/paybox)
ALTER TABLE public.invoices 
ADD COLUMN payment_link TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.invoices.payment_link IS 'Manual payment link for bit/paybox or other payment methods';