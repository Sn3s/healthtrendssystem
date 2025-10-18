-- Create departments table with UUID primary key
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on departments table
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Insert existing departments from the application
INSERT INTO public.departments (name) VALUES
  ('Internal Medicine & Surgery'),
  ('Dermatology & Ophthalmology'),
  ('ENT & Pediatrics'),
  ('OB Gyn and Rehab Medicine'),
  ('Ambulatory Surgical Clinic'),
  ('Dental Center'),
  ('Eye Center'),
  ('DOH-Accredited Secondary Laboratory'),
  ('Imaging & X-Ray Facilities'),
  ('DOH-Accredited Drug Testing Center');

-- Create a temporary column to store department UUIDs
ALTER TABLE public.user_roles ADD COLUMN department_id UUID;

-- Migrate existing department names to UUIDs
UPDATE public.user_roles
SET department_id = (
  SELECT id FROM public.departments WHERE name = user_roles.department
)
WHERE department IS NOT NULL;

-- Drop the old text-based department column
ALTER TABLE public.user_roles DROP COLUMN department;

-- Rename department_id to department
ALTER TABLE public.user_roles RENAME COLUMN department_id TO department;

-- Add foreign key constraint
ALTER TABLE public.user_roles 
ADD CONSTRAINT fk_user_roles_department 
FOREIGN KEY (department) 
REFERENCES public.departments(id) 
ON DELETE SET NULL;

-- Drop RLS policies that depend on get_user_department
DROP POLICY IF EXISTS "Doctors can view visits in their department" ON public.visits;
DROP POLICY IF EXISTS "Doctors can update visits in their department" ON public.visits;
DROP POLICY IF EXISTS "Doctors can insert logs for their department" ON public.departmental_logs;
DROP POLICY IF EXISTS "Doctors can view logs in their department" ON public.departmental_logs;
DROP POLICY IF EXISTS "Doctors can view patients in their department" ON public.patients;

-- Drop the functions
DROP FUNCTION IF EXISTS public.get_user_department(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.patient_has_visit_in_department(uuid, text) CASCADE;

-- Recreate get_user_department to return UUID
CREATE FUNCTION public.get_user_department(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department
  FROM public.user_roles
  WHERE user_id = _user_id AND role = 'doctor'
  LIMIT 1
$$;

-- Recreate patient_has_visit_in_department to accept UUID
CREATE FUNCTION public.patient_has_visit_in_department(_patient_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.visits v
    INNER JOIN public.departments d ON v.department = d.name
    WHERE v.patient_id = _patient_id
      AND d.id = _department_id
  )
$$;

-- Recreate RLS policies for visits
CREATE POLICY "Doctors can view visits in their department"
ON public.visits
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND department = (SELECT name FROM public.departments WHERE id = get_user_department(auth.uid()))
);

CREATE POLICY "Doctors can update visits in their department"
ON public.visits
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND department = (SELECT name FROM public.departments WHERE id = get_user_department(auth.uid()))
);

-- Recreate RLS policies for departmental_logs
CREATE POLICY "Doctors can insert logs for their department"
ON public.departmental_logs
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND department = (SELECT name FROM public.departments WHERE id = get_user_department(auth.uid()))
);

CREATE POLICY "Doctors can view logs in their department"
ON public.departmental_logs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND department = (SELECT name FROM public.departments WHERE id = get_user_department(auth.uid()))
);

-- Recreate RLS policy for patients
CREATE POLICY "Doctors can view patients in their department"
ON public.patients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND patient_has_visit_in_department(id, get_user_department(auth.uid()))
);

-- RLS policies for departments table
CREATE POLICY "Anyone authenticated can view departments"
ON public.departments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert departments"
ON public.departments
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update departments"
ON public.departments
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete departments"
ON public.departments
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));