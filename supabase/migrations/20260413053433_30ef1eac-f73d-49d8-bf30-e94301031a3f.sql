
CREATE TABLE public.page_content_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  version_label text DEFAULT 'applied',
  applied_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(page_id)
);

ALTER TABLE public.page_content_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view page content overrides"
  ON public.page_content_overrides FOR SELECT
  USING (is_staff(auth.uid()));

CREATE POLICY "Staff can insert page content overrides"
  ON public.page_content_overrides FOR INSERT
  WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can update page content overrides"
  ON public.page_content_overrides FOR UPDATE
  USING (is_staff(auth.uid()));

CREATE POLICY "Staff can delete page content overrides"
  ON public.page_content_overrides FOR DELETE
  USING (is_staff(auth.uid()));

CREATE TRIGGER update_page_content_overrides_updated_at
  BEFORE UPDATE ON public.page_content_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
