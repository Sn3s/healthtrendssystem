-- Create enum types
CREATE TYPE public.app_role AS ENUM ('encoder', 'doctor', 'patient', 'admin');
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');
CREATE TYPE public.visit_status AS ENUM ('pending', 'in-progress', 'completed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  contact_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender gender NOT NULL,
  contact_number TEXT NOT NULL,
  address TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create visits table
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  department TEXT NOT NULL,
  chief_complaint TEXT NOT NULL,
  status visit_status NOT NULL DEFAULT 'pending',
  final_diagnosis TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Create departmental_logs table
CREATE TABLE public.departmental_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE NOT NULL,
  department TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  findings TEXT NOT NULL,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.departmental_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department
  FROM public.user_roles
  WHERE user_id = _user_id AND role = 'doctor'
  LIMIT 1
$$;

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for patients
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for patients
CREATE POLICY "Encoders and admins can view all patients"
ON public.patients FOR SELECT
USING (
  public.has_role(auth.uid(), 'encoder') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'doctor')
);

CREATE POLICY "Encoders and admins can insert patients"
ON public.patients FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'encoder') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Encoders and admins can update patients"
ON public.patients FOR UPDATE
USING (
  public.has_role(auth.uid(), 'encoder') OR
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for visits
CREATE POLICY "Encoders and admins can view all visits"
ON public.visits FOR SELECT
USING (
  public.has_role(auth.uid(), 'encoder') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Doctors can view visits in their department"
ON public.visits FOR SELECT
USING (
  public.has_role(auth.uid(), 'doctor') AND
  department = public.get_user_department(auth.uid())
);

CREATE POLICY "Patients can view their own visits"
ON public.visits FOR SELECT
USING (
  public.has_role(auth.uid(), 'patient') AND
  patient_id IN (
    SELECT id FROM public.patients
    WHERE patient_number = (
      SELECT full_name FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Encoders and admins can insert visits"
ON public.visits FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'encoder') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Doctors can update visits in their department"
ON public.visits FOR UPDATE
USING (
  public.has_role(auth.uid(), 'doctor') AND
  department = public.get_user_department(auth.uid())
);

CREATE POLICY "Admins can update all visits"
ON public.visits FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for departmental_logs
CREATE POLICY "All authenticated users can view departmental logs"
ON public.departmental_logs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Doctors can insert logs for their department"
ON public.departmental_logs FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'doctor') AND
  department = public.get_user_department(auth.uid())
);

CREATE POLICY "Admins can insert all logs"
ON public.departmental_logs FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_patients_patient_number ON public.patients(patient_number);
CREATE INDEX idx_visits_patient_id ON public.visits(patient_id);
CREATE INDEX idx_visits_department ON public.visits(department);
CREATE INDEX idx_visits_status ON public.visits(status);
CREATE INDEX idx_departmental_logs_visit_id ON public.departmental_logs(visit_id);

-- Function to generate patient number
CREATE OR REPLACE FUNCTION public.generate_patient_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  patient_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(patient_number FROM 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.patients;
  
  patient_num := 'P-' || LPAD(next_number::TEXT, 6, '0');
  RETURN patient_num;
END;
$$;

-- Function to generate visit number
CREATE OR REPLACE FUNCTION public.generate_visit_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  visit_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(visit_number FROM 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.visits;
  
  visit_num := 'V-' || LPAD(next_number::TEXT, 6, '0');
  RETURN visit_num;
END;
$$;