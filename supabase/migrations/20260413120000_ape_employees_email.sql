-- Employee email (beside contact); backfill demo addresses for existing rows.
ALTER TABLE public.ape_employees
  ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';

UPDATE public.ape_employees e
SET email = lower(replace(e.exam_code, '-', '')) || '@employees.healthtrends.demo'
WHERE e.email = '';
