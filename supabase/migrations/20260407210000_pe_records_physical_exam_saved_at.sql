-- Timestamp when the Physical Examination tab was saved (distinct from lab-only updates)
ALTER TABLE public.pe_records
  ADD COLUMN IF NOT EXISTS physical_exam_saved_at TIMESTAMPTZ;
