UPDATE public.page_content_overrides
SET sections = jsonb_set(
  sections,
  '{1,content}',
  to_jsonb('אני מאבחנת ומטפלת באלרגיות מזון, אקזמה אטופית ואסתמה אלרגית, אצל ילדים ומבוגרים. כל מטופל מקבל הקשבה, בירור מדוקדק ותוכנית טיפול ברורה שמתאימה למשפחה שלו.'::text)
)
WHERE page_id = 'homepage';

UPDATE public.page_content_overrides
SET sections = REPLACE(sections::text, ' — ', ' - ')::jsonb
WHERE sections::text LIKE '%—%';

UPDATE public.page_content_overrides
SET sections = REPLACE(sections::text, '—', '-')::jsonb
WHERE sections::text LIKE '%—%';