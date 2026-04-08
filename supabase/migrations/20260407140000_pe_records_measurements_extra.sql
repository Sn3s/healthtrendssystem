-- Additional vitals and visual acuity on PE records
ALTER TABLE public.pe_records
  ADD COLUMN IF NOT EXISTS meas_pr TEXT,
  ADD COLUMN IF NOT EXISTS meas_rr TEXT,
  ADD COLUMN IF NOT EXISTS meas_va_correction TEXT,
  ADD COLUMN IF NOT EXISTS meas_far_od TEXT,
  ADD COLUMN IF NOT EXISTS meas_far_os TEXT,
  ADD COLUMN IF NOT EXISTS meas_near_odj TEXT,
  ADD COLUMN IF NOT EXISTS meas_near_osj TEXT;
