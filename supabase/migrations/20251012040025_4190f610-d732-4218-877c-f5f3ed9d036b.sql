-- Fix 1: Restrict doctors to view only patients in their department
DROP POLICY IF EXISTS "Encoders and admins can view all patients" ON public.patients;

-- Encoders and admins can view all patients
CREATE POLICY "Encoders and admins can view all patients"
ON public.patients FOR SELECT
USING (
  has_role(auth.uid(), 'encoder'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Doctors can only view patients with visits in their department
CREATE POLICY "Doctors can view patients in their department"
ON public.patients FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND
  id IN (
    SELECT patient_id FROM public.visits
    WHERE department = get_user_department(auth.uid())
  )
);

-- Fix 2: Restrict departmental_logs access to relevant staff only
DROP POLICY IF EXISTS "All authenticated users can view departmental logs" ON public.departmental_logs;

-- Doctors can only view logs in their department
CREATE POLICY "Doctors can view logs in their department"
ON public.departmental_logs FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND
  department = get_user_department(auth.uid())
);

-- Admins can view all departmental logs
CREATE POLICY "Admins can view all departmental logs"
ON public.departmental_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: Fix broken patient portal access
-- Add patient_number column to profiles for proper patient identification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS patient_number TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_patient_number ON public.profiles(patient_number);

-- Drop and recreate the broken patient visits policy
DROP POLICY IF EXISTS "Patients can view their own visits" ON public.visits;

CREATE POLICY "Patients can view their own visits"
ON public.visits FOR SELECT
USING (
  has_role(auth.uid(), 'patient'::app_role) AND
  patient_id IN (
    SELECT id FROM public.patients
    WHERE patient_number = (
      SELECT patient_number FROM public.profiles WHERE id = auth.uid()
    )
  )
);