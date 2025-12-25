-- Create storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false);

-- RLS for patient documents storage
CREATE POLICY "Staff can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-documents' 
  AND public.is_staff(auth.uid())
);

CREATE POLICY "Staff can view documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-documents' 
  AND public.is_staff(auth.uid())
);

CREATE POLICY "Staff can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'patient-documents' 
  AND public.is_staff(auth.uid())
);

CREATE POLICY "Patients can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.patients WHERE user_id = auth.uid()
  )
);