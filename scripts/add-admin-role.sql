-- Add all roles (admin, encoder, doctor, patient) to an existing user.
-- Run this in Supabase Dashboard → SQL Editor.

INSERT INTO public.user_roles (user_id, role, department)
SELECT u.id, r.role::app_role,
  CASE WHEN r.role = 'doctor' THEN (SELECT id FROM public.departments LIMIT 1) ELSE NULL END
FROM auth.users u
CROSS JOIN (VALUES ('admin'), ('encoder'), ('doctor'), ('patient')) AS r(role)
WHERE u.email = 'ycosantos04@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
