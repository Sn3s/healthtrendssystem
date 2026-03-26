-- X-Ray Reports table for Imaging & X-Ray Facilities
CREATE SEQUENCE IF NOT EXISTS xray_control_number_seq START WITH 100001;

CREATE OR REPLACE FUNCTION public.generate_xray_control_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'XR-' || nextval('xray_control_number_seq')::text;
END;
$$;

CREATE TABLE public.xray_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_number TEXT NOT NULL UNIQUE DEFAULT public.generate_xray_control_number(),

  -- Administrative & Identification
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  company_affiliation TEXT,
  requesting_physician TEXT NOT NULL,
  radiologic_technologist TEXT NOT NULL,
  radiologist TEXT NOT NULL,

  -- Patient Demographics
  patient_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  first_day_last_menstruation DATE,

  -- Clinical Context & Results
  indication_history TEXT NOT NULL,
  diagnostic_imaging_request TEXT NOT NULL,
  findings TEXT NOT NULL,
  impression TEXT NOT NULL,

  -- Link to visit (optional)
  visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,

  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.xray_reports ENABLE ROW LEVEL SECURITY;

-- Staff (encoder, doctor, admin) can view all X-ray reports
CREATE POLICY "Staff can view xray reports"
  ON public.xray_reports FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'encoder') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor')
  );

-- Staff can create X-ray reports
CREATE POLICY "Staff can create xray reports"
  ON public.xray_reports FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'encoder') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor')
  );

-- Staff can update X-ray reports
CREATE POLICY "Staff can update xray reports"
  ON public.xray_reports FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'encoder') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'doctor')
  );

-- Admins can delete
CREATE POLICY "Admins can delete xray reports"
  ON public.xray_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Patients can view their own (via patient_id)
CREATE POLICY "Patients can view own xray reports"
  ON public.xray_reports FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'patient') AND
    patient_id IN (
      SELECT p.id FROM public.patients p
      JOIN public.profiles pr ON pr.patient_number = p.patient_number
      WHERE pr.id = auth.uid()
    )
  );

CREATE INDEX idx_xray_reports_visit_id ON public.xray_reports(visit_id);
CREATE INDEX idx_xray_reports_patient_id ON public.xray_reports(patient_id);
CREATE INDEX idx_xray_reports_control_number ON public.xray_reports(control_number);
CREATE INDEX idx_xray_reports_report_date ON public.xray_reports(report_date);
