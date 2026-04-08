-- Urinalysis on PE records
ALTER TABLE public.pe_records
  ADD COLUMN IF NOT EXISTS lab_ua_color TEXT,
  ADD COLUMN IF NOT EXISTS lab_ua_transparency TEXT,
  ADD COLUMN IF NOT EXISTS lab_ua_reaction TEXT,
  ADD COLUMN IF NOT EXISTS lab_ua_specific_gravity TEXT,
  ADD COLUMN IF NOT EXISTS lab_ua_protein TEXT,
  ADD COLUMN IF NOT EXISTS lab_ua_sugar TEXT,
  ADD COLUMN IF NOT EXISTS lab_ua_pus_cells TEXT,
  ADD COLUMN IF NOT EXISTS lab_ua_red_blood_cells TEXT,
  ADD COLUMN IF NOT EXISTS lab_ua_epithelial_cells TEXT,
  ADD COLUMN IF NOT EXISTS lab_ua_amorphous TEXT,
  ADD COLUMN IF NOT EXISTS lab_ua_mucus_threads TEXT,
  ADD COLUMN IF NOT EXISTS lab_ua_bacteria TEXT,
  ADD COLUMN IF NOT EXISTS lab_ua_others TEXT;
