-- Add unique constraint on page_id for upsert support
ALTER TABLE public.geo_scan_results ADD CONSTRAINT geo_scan_results_page_id_unique UNIQUE (page_id);