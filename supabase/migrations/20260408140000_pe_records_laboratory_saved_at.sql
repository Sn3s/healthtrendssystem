-- Timestamp when the Laboratory and Diagnostic Examination tab was saved
ALTER TABLE public.pe_records
  ADD COLUMN IF NOT EXISTS laboratory_saved_at TIMESTAMPTZ;
