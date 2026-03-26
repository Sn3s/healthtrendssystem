-- HealthTrends Mobile Clinic: APE companies, employees, PE records

CREATE TABLE public.ape_companies (
  company_code TEXT PRIMARY KEY CHECK (company_code ~ '^\d{3}$'),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ape_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code TEXT NOT NULL REFERENCES public.ape_companies(company_code) ON DELETE RESTRICT,
  employee_number INTEGER NOT NULL CHECK (employee_number >= 1 AND employee_number <= 999),
  exam_code TEXT NOT NULL UNIQUE,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  contact_number TEXT NOT NULL DEFAULT '',
  age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_code, employee_number)
);

CREATE TABLE public.pe_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ape_employee_id UUID NOT NULL UNIQUE REFERENCES public.ape_employees(id) ON DELETE CASCADE,
  -- Tab 1: Review of Systems / Past history
  childhood_diseases TEXT,
  past_illnesses_injuries TEXT,
  operations TEXT,
  smoker TEXT CHECK (smoker IS NULL OR smoker IN ('yes', 'no')),
  alcohol TEXT CHECK (alcohol IS NULL OR alcohol IN ('yes', 'no', 'occasional')),
  exercise TEXT CHECK (exercise IS NULL OR exercise IN ('none', 'light', 'moderate', 'heavy')),
  family_heart_disease BOOLEAN DEFAULT false,
  family_hypertension BOOLEAN DEFAULT false,
  family_diabetes BOOLEAN DEFAULT false,
  family_asthma BOOLEAN DEFAULT false,
  family_allergy BOOLEAN DEFAULT false,
  family_cancer BOOLEAN DEFAULT false,
  family_others TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ape_employees_exam_code ON public.ape_employees(exam_code);
CREATE INDEX idx_ape_employees_company ON public.ape_employees(company_code);
CREATE INDEX idx_ape_employees_name ON public.ape_employees(name);

ALTER TABLE public.ape_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ape_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pe_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Encoders admins manage ape_companies"
  ON public.ape_companies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Encoders admins manage ape_employees"
  ON public.ape_employees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Encoders admins manage pe_records"
  ON public.pe_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin'));
