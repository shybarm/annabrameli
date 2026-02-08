
-- Create medical_updates table for auto-fetched allergy news
CREATE TABLE public.medical_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_he TEXT NOT NULL,
  summary_he TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  pubmed_id TEXT UNIQUE,
  published_date DATE NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_updates ENABLE ROW LEVEL SECURITY;

-- Public read access (this is public-facing content)
CREATE POLICY "Anyone can read published medical updates"
ON public.medical_updates
FOR SELECT
USING (is_published = true);

-- Staff can manage updates
CREATE POLICY "Staff can insert medical updates"
ON public.medical_updates
FOR INSERT
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update medical updates"
ON public.medical_updates
FOR UPDATE
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete medical updates"
ON public.medical_updates
FOR DELETE
USING (public.is_staff(auth.uid()));

-- Index for fast ordering
CREATE INDEX idx_medical_updates_published_date ON public.medical_updates (published_date DESC);

-- Allow service role inserts (for edge function with service key)
CREATE POLICY "Service role can insert medical updates"
ON public.medical_updates
FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_updates;
