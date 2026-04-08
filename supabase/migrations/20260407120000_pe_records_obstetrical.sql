-- Obstetrical history fields on PE (physical examination) records
ALTER TABLE public.pe_records
  ADD COLUMN IF NOT EXISTS ob_lmp TEXT,
  ADD COLUMN IF NOT EXISTS ob_days TEXT,
  ADD COLUMN IF NOT EXISTS ob_pmp TEXT,
  ADD COLUMN IF NOT EXISTS ob_interval TEXT,
  ADD COLUMN IF NOT EXISTS ob_gravida TEXT,
  ADD COLUMN IF NOT EXISTS ob_para TEXT,
  ADD COLUMN IF NOT EXISTS ob_delivery TEXT,
  ADD COLUMN IF NOT EXISTS ob_complications TEXT;
