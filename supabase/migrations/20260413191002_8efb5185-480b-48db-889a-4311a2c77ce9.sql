
-- GEO Scan Results table
CREATE TABLE public.geo_scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL,
  overall_score numeric NOT NULL DEFAULT 0,
  dimensions jsonb NOT NULL DEFAULT '{}',
  blockers jsonb NOT NULL DEFAULT '[]',
  recommendations jsonb NOT NULL DEFAULT '[]',
  strengths jsonb NOT NULL DEFAULT '[]',
  weaknesses jsonb NOT NULL DEFAULT '[]',
  scanned_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_geo_scan_results_page_id ON public.geo_scan_results(page_id);
CREATE INDEX idx_geo_scan_results_scanned_at ON public.geo_scan_results(scanned_at DESC);

ALTER TABLE public.geo_scan_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view scan results" ON public.geo_scan_results FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can insert scan results" ON public.geo_scan_results FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update scan results" ON public.geo_scan_results FOR UPDATE USING (is_staff(auth.uid()));
CREATE POLICY "Staff can delete scan results" ON public.geo_scan_results FOR DELETE USING (is_staff(auth.uid()));
CREATE POLICY "Service role full access geo_scan_results" ON public.geo_scan_results FOR ALL TO service_role USING (true) WITH CHECK (true);

-- GEO Cluster Actions table
CREATE TABLE public.geo_cluster_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  cluster_id text NOT NULL,
  page_title text NOT NULL,
  page_path text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}',
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid()
);

CREATE INDEX idx_geo_cluster_actions_cluster ON public.geo_cluster_actions(cluster_id);
CREATE INDEX idx_geo_cluster_actions_status ON public.geo_cluster_actions(status);

ALTER TABLE public.geo_cluster_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view cluster actions" ON public.geo_cluster_actions FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can insert cluster actions" ON public.geo_cluster_actions FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update cluster actions" ON public.geo_cluster_actions FOR UPDATE USING (is_staff(auth.uid()));
CREATE POLICY "Staff can delete cluster actions" ON public.geo_cluster_actions FOR DELETE USING (is_staff(auth.uid()));

-- GEO Content Briefs table
CREATE TABLE public.geo_content_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_title text NOT NULL,
  page_path text NOT NULL DEFAULT '',
  cluster_id text NOT NULL DEFAULT '',
  brief_type text NOT NULL DEFAULT 'brief',
  content jsonb NOT NULL DEFAULT '{}',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_geo_content_briefs_page ON public.geo_content_briefs(page_path);
CREATE INDEX idx_geo_content_briefs_cluster ON public.geo_content_briefs(cluster_id);

ALTER TABLE public.geo_content_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view briefs" ON public.geo_content_briefs FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can insert briefs" ON public.geo_content_briefs FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff can update briefs" ON public.geo_content_briefs FOR UPDATE USING (is_staff(auth.uid()));
CREATE POLICY "Staff can delete briefs" ON public.geo_content_briefs FOR DELETE USING (is_staff(auth.uid()));

-- Trigger for updated_at on briefs
CREATE TRIGGER update_geo_content_briefs_updated_at
  BEFORE UPDATE ON public.geo_content_briefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
