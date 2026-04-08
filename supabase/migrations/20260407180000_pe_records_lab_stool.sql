-- Stool examination on PE records
ALTER TABLE public.pe_records
  ADD COLUMN IF NOT EXISTS lab_stool_color TEXT,
  ADD COLUMN IF NOT EXISTS lab_stool_consistency TEXT,
  ADD COLUMN IF NOT EXISTS lab_stool_others TEXT;
