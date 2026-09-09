-- Medical summaries must remain private until a clinician/editor reviews them.
ALTER TABLE public.medical_updates
  ALTER COLUMN is_published SET DEFAULT false;

UPDATE public.medical_updates
SET is_published = false
WHERE is_published = true;
