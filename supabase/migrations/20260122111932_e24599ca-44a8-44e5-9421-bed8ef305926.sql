-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'encoder', 'patient');

-- Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Populate departments
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

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  contact_number TEXT,
  patient_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  department UUID REFERENCES public.departments(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  contact_number TEXT,
  address TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create visits table
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_number TEXT NOT NULL UNIQUE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  department TEXT NOT NULL,
  chief_complaint TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  final_diagnosis TEXT,
  created_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create departmental_logs table
CREATE TABLE public.departmental_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE NOT NULL,
  department TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  findings TEXT NOT NULL,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sequence for patient numbers
CREATE SEQUENCE IF NOT EXISTS patient_number_seq START WITH 100001;

-- Create sequence for visit numbers
CREATE SEQUENCE IF NOT EXISTS visit_number_seq START WITH 100001;

-- Function to generate patient number
CREATE OR REPLACE FUNCTION public.generate_patient_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'P-' || nextval('patient_number_seq')::text;
END;
$$;

-- Function to generate visit number
CREATE OR REPLACE FUNCTION public.generate_visit_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'V-' || nextval('visit_number_seq')::text;
END;
$$;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's department
CREATE OR REPLACE FUNCTION public.get_user_department(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department FROM public.user_roles
  WHERE user_id = _user_id AND role = 'doctor'
  LIMIT 1
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departmental_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments (readable by all authenticated users)
CREATE POLICY "Departments are viewable by authenticated users"
  ON public.departments FOR SELECT TO authenticated USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for patients
CREATE POLICY "Encoders and admins can view all patients"
  ON public.patients FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Encoders can create patients"
  ON public.patients FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Encoders can update patients"
  ON public.patients FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for visits
CREATE POLICY "Staff can view visits"
  ON public.visits FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Encoders can create visits"
  ON public.visits FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update visits"
  ON public.visits FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Admins can delete visits"
  ON public.visits FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for departmental_logs
CREATE POLICY "Staff can view departmental logs"
  ON public.departmental_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'encoder') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can create departmental logs"
  ON public.departmental_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete departmental logs"
  ON public.departmental_logs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));