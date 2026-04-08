-- Chest PA and ECG on PE records (laboratory / diagnostic tab)
ALTER TABLE public.pe_records
  ADD COLUMN IF NOT EXISTS lab_chest_pa_findings TEXT,
  ADD COLUMN IF NOT EXISTS lab_chest_pa_impression TEXT,
  ADD COLUMN IF NOT EXISTS lab_ecg_rate TEXT,
  ADD COLUMN IF NOT EXISTS lab_ecg_rhythm TEXT,
  ADD COLUMN IF NOT EXISTS lab_ecg_interpretation TEXT,
  ADD COLUMN IF NOT EXISTS lab_ecg_others TEXT;
