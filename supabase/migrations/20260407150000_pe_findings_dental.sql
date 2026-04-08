-- Physical exam findings and dental on PE records
ALTER TABLE public.pe_records
  ADD COLUMN IF NOT EXISTS find_head TEXT,
  ADD COLUMN IF NOT EXISTS find_ears_eyes_nose TEXT,
  ADD COLUMN IF NOT EXISTS find_mouth_throat TEXT,
  ADD COLUMN IF NOT EXISTS find_neck_thorax TEXT,
  ADD COLUMN IF NOT EXISTS find_lungs TEXT,
  ADD COLUMN IF NOT EXISTS find_heart TEXT,
  ADD COLUMN IF NOT EXISTS find_abdomen TEXT,
  ADD COLUMN IF NOT EXISTS find_genitalia TEXT,
  ADD COLUMN IF NOT EXISTS find_extremities TEXT,
  ADD COLUMN IF NOT EXISTS find_skin TEXT,
  ADD COLUMN IF NOT EXISTS find_rectum TEXT,
  ADD COLUMN IF NOT EXISTS find_ishihara_score TEXT,
  ADD COLUMN IF NOT EXISTS dental_missing_teeth TEXT,
  ADD COLUMN IF NOT EXISTS dental_canes TEXT,
  ADD COLUMN IF NOT EXISTS dental_replaced TEXT,
  ADD COLUMN IF NOT EXISTS dental_jacket_crown TEXT;
