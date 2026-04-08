-- Laboratory hematology on PE records
ALTER TABLE public.pe_records
  ADD COLUMN IF NOT EXISTS lab_hem_hemoglobin TEXT,
  ADD COLUMN IF NOT EXISTS lab_hem_hematocrit TEXT,
  ADD COLUMN IF NOT EXISTS lab_hem_wbc TEXT,
  ADD COLUMN IF NOT EXISTS lab_hem_rbc TEXT,
  ADD COLUMN IF NOT EXISTS lab_hem_segmanters TEXT,
  ADD COLUMN IF NOT EXISTS lab_hem_lymphocytes TEXT,
  ADD COLUMN IF NOT EXISTS lab_hem_eosinophil TEXT,
  ADD COLUMN IF NOT EXISTS lab_hem_monocytes TEXT,
  ADD COLUMN IF NOT EXISTS lab_hem_basophil TEXT,
  ADD COLUMN IF NOT EXISTS lab_hem_platelet TEXT;
