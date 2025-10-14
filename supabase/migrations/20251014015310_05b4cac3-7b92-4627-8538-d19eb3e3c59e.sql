-- Fix infinite recursion in RLS policies by using security definer functions

-- Drop the problematic policies
DROP POLICY IF EXISTS "Doctors can view patients in their department" ON public.patients;
DROP POLICY IF EXISTS "Patients can view their own visits" ON public.visits;

-- Create security definer function to check if a patient has visits in a specific department
CREATE OR REPLACE FUNCTION public.patient_has_visit_in_department(_patient_id uuid, _department text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.visits
    WHERE patient_id = _patient_id
      AND department = _department
  )
$$;

-- Create security definer function to get patient_id from patient_number
CREATE OR REPLACE FUNCTION public.get_patient_id_by_number(_patient_number text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.patients
  WHERE patient_number = _patient_number
  LIMIT 1
$$;

-- Recreate the doctor patient access policy using the security definer function
CREATE POLICY "Doctors can view patients in their department"
ON public.patients FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND
  patient_has_visit_in_department(id, get_user_department(auth.uid()))
);

-- Recreate the patient visits policy using the security definer function
CREATE POLICY "Patients can view their own visits"
ON public.visits FOR SELECT
USING (
  has_role(auth.uid(), 'patient'::app_role) AND
  patient_id = get_patient_id_by_number((
    SELECT patient_number FROM public.profiles WHERE id = auth.uid()
  ))
);