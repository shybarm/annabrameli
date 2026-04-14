CREATE TABLE public.geo_page_workflows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'not_reviewed',
  priority text NOT NULL DEFAULT 'medium',
  owner text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  last_reviewed text NOT NULL DEFAULT '',
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.geo_page_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view workflows" ON public.geo_page_workflows FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can insert workflows" ON public.geo_page_workflows FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update workflows" ON public.geo_page_workflows FOR UPDATE USING (is_staff(auth.uid()));
CREATE POLICY "Staff can delete workflows" ON public.geo_page_workflows FOR DELETE USING (is_staff(auth.uid()));

CREATE TRIGGER update_geo_page_workflows_updated_at
  BEFORE UPDATE ON public.geo_page_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();