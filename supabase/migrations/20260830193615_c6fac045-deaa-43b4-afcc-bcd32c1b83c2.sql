ALTER TABLE public.search_console_daily
  ALTER COLUMN page_host SET NOT NULL;

ALTER TABLE public.search_console_daily
  DROP CONSTRAINT search_console_daily_pkey;

ALTER TABLE public.search_console_daily
  ADD CONSTRAINT search_console_daily_pkey
  PRIMARY KEY (property, date, page_host, page_path, query);