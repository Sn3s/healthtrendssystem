-- Fuzzy / recommended search for APE employees (name + exam code)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_ape_employees_name_trgm ON public.ape_employees USING gin (lower(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ape_employees_exam_trgm ON public.ape_employees USING gin (exam_code gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_ape_employees(p_query text)
RETURNS TABLE (
  id uuid,
  exam_code text,
  name text,
  exam_date date,
  company_code text,
  match_rank real,
  match_label text
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH q AS (
    SELECT
      trim(p_query) AS t,
      lower(trim(p_query)) AS tl,
      regexp_replace(trim(p_query), '[^0-9]', '', 'g') AS digits
  ),
  norm AS (
    SELECT
      t,
      tl,
      digits,
      CASE
        WHEN length(digits) = 6 THEN substring(digits FROM 1 FOR 3) || '-' || substring(digits FROM 4 FOR 3)
        ELSE NULL
      END AS code_6,
      replace(replace(trim(p_query), ' ', ''), '-', '') AS code_nodash
    FROM q
  ),
  scored AS (
    SELECT
      e.id,
      e.exam_code,
      e.name,
      e.exam_date::date AS ed,
      e.company_code,
      GREATEST(
        CASE WHEN lower(e.exam_code) = norm.tl THEN 100::real ELSE 0 END,
        CASE WHEN norm.code_6 IS NOT NULL AND e.exam_code = norm.code_6 THEN 99::real ELSE 0 END,
        CASE WHEN length(norm.digits) >= 3 AND replace(lower(e.exam_code), '-', '') = norm.digits THEN 96::real ELSE 0 END,
        CASE WHEN norm.code_nodash <> '' AND replace(lower(e.exam_code), '-', '') LIKE norm.code_nodash || '%' THEN 88::real ELSE 0 END,
        CASE WHEN e.exam_code ILIKE '%' || norm.t || '%' THEN 78::real ELSE 0 END,
        CASE WHEN lower(e.name) = norm.tl THEN 97::real ELSE 0 END,
        CASE WHEN lower(e.name) LIKE norm.tl || '%' THEN 90::real ELSE 0 END,
        CASE WHEN e.name ILIKE '%' || norm.t || '%' THEN 74::real ELSE 0 END,
        LEAST(93::real, (similarity(lower(e.name), norm.tl) * 100)::real)
      ) AS match_rank,
      CASE
        WHEN lower(e.exam_code) = norm.tl OR (norm.code_6 IS NOT NULL AND e.exam_code = norm.code_6)
          OR (length(norm.digits) >= 3 AND replace(lower(e.exam_code), '-', '') = norm.digits)
          THEN 'code_match'
        WHEN lower(e.name) = norm.tl OR lower(e.name) LIKE norm.tl || '%' THEN 'exact_name'
        WHEN similarity(lower(e.name), norm.tl) >= 0.35 THEN 'recommended'
        WHEN similarity(lower(e.name), norm.tl) >= 0.15 THEN 'similar'
        ELSE 'match'
      END AS match_label
    FROM public.ape_employees e
    CROSS JOIN norm
    WHERE
      length(norm.t) >= 1
      AND (
        e.exam_code ILIKE '%' || norm.t || '%'
        OR (norm.code_6 IS NOT NULL AND e.exam_code = norm.code_6)
        OR (length(norm.digits) >= 2 AND replace(lower(e.exam_code), '-', '') LIKE '%' || norm.digits || '%')
        OR e.name ILIKE '%' || norm.t || '%'
        OR similarity(lower(e.name), norm.tl) > 0.12
      )
  )
  SELECT id, exam_code, name, ed, company_code, match_rank, match_label
  FROM scored
  WHERE match_rank >= 8
  ORDER BY match_rank DESC, name ASC
  LIMIT 25;
$$;

GRANT EXECUTE ON FUNCTION public.search_ape_employees(text) TO authenticated;
