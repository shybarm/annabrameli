-- Add electronic signature fields to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS signature_data text,
ADD COLUMN IF NOT EXISTS signed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS signed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS signature_name text,
ADD COLUMN IF NOT EXISTS signature_role text;

-- Create electronic_signatures table for detailed signature tracking (GAMP5 compliant)
CREATE TABLE IF NOT EXISTS public.electronic_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL, -- 'appointment', 'treatment_plan', etc.
  record_id uuid NOT NULL,
  signature_data text NOT NULL, -- Base64 encoded signature image
  signer_id uuid REFERENCES auth.users(id) NOT NULL,
  signer_name text NOT NULL,
  signer_role text NOT NULL,
  signed_at timestamp with time zone NOT NULL DEFAULT now(),
  signature_meaning text NOT NULL, -- 'approval', 'review', 'authorship'
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on electronic_signatures
ALTER TABLE public.electronic_signatures ENABLE ROW LEVEL SECURITY;

-- Only staff can view signatures
CREATE POLICY "Staff can view signatures" 
ON public.electronic_signatures 
FOR SELECT 
USING (is_staff(auth.uid()));

-- Only staff can create signatures
CREATE POLICY "Staff can create signatures" 
ON public.electronic_signatures 
FOR INSERT 
WITH CHECK (is_staff(auth.uid()) AND signer_id = auth.uid());

-- Signatures cannot be updated or deleted (immutable for GAMP5)
-- No UPDATE or DELETE policies

-- Add audit trigger for electronic_signatures
DROP TRIGGER IF EXISTS audit_electronic_signatures ON public.electronic_signatures;
CREATE TRIGGER audit_electronic_signatures
  AFTER INSERT ON public.electronic_signatures
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();