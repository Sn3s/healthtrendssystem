-- Vital measurements on PE records
ALTER TABLE public.pe_records
  ADD COLUMN IF NOT EXISTS meas_height TEXT,
  ADD COLUMN IF NOT EXISTS meas_weight_lbs TEXT,
  ADD COLUMN IF NOT EXISTS meas_bp TEXT;
