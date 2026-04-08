-- Pap smear (cervical cytology) on PE records
ALTER TABLE public.pe_records
  ADD COLUMN IF NOT EXISTS lab_pap_specimen_adequacy TEXT,
  ADD COLUMN IF NOT EXISTS lab_pap_general_categorization TEXT,
  ADD COLUMN IF NOT EXISTS lab_pap_descriptive_diagnoses TEXT;
