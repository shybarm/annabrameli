-- Add AI-detected tags column to patient_documents
ALTER TABLE public.patient_documents 
ADD COLUMN IF NOT EXISTS ai_tags text[] DEFAULT NULL;

-- Add AI summary column if not exists
ALTER TABLE public.patient_documents 
ADD COLUMN IF NOT EXISTS ai_summary text DEFAULT NULL;