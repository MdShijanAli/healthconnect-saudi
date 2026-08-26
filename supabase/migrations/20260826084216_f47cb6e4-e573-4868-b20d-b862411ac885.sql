CREATE TYPE public.app_role AS ENUM ('super_admin', 'doctor', 'patient');
CREATE TYPE public.doctor_approval_status AS ENUM ('pending_approval', 'approved', 'rejected');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 8 AND 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Server creates profiles"
ON public.profiles FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Server manages roles"
ON public.user_roles FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TABLE public.patient_profiles (
  user_id UUID PRIMARY KEY,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.patient_profiles TO authenticated;
GRANT ALL ON public.patient_profiles TO service_role;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view own details"
ON public.patient_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Patients can update own details"
ON public.patient_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can update patient details"
ON public.patient_profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Server creates patient details"
ON public.patient_profiles FOR INSERT TO service_role
WITH CHECK (true);

CREATE TABLE public.doctor_profiles (
  user_id UUID PRIMARY KEY,
  specialization TEXT NOT NULL CHECK (char_length(specialization) BETWEEN 2 AND 100),
  medical_license_number TEXT NOT NULL UNIQUE CHECK (char_length(medical_license_number) BETWEEN 3 AND 50),
  years_experience INTEGER NOT NULL CHECK (years_experience BETWEEN 0 AND 70),
  consultation_fee NUMERIC(10,2) NOT NULL CHECK (consultation_fee >= 0),
  bio TEXT NOT NULL CHECK (char_length(bio) BETWEEN 20 AND 1000),
  profile_photo_path TEXT,
  approval_status public.doctor_approval_status NOT NULL DEFAULT 'pending_approval',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.doctor_profiles TO authenticated;
GRANT ALL ON public.doctor_profiles TO service_role;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can view own application"
ON public.doctor_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Doctors can update own professional details"
ON public.doctor_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND approval_status = (SELECT dp.approval_status FROM public.doctor_profiles dp WHERE dp.user_id = auth.uid())
  AND reviewed_by IS NOT DISTINCT FROM (SELECT dp.reviewed_by FROM public.doctor_profiles dp WHERE dp.user_id = auth.uid())
  AND reviewed_at IS NOT DISTINCT FROM (SELECT dp.reviewed_at FROM public.doctor_profiles dp WHERE dp.user_id = auth.uid())
);
CREATE POLICY "Admins can review doctor applications"
ON public.doctor_profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Server creates doctor applications"
ON public.doctor_profiles FOR INSERT TO service_role
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.get_my_portal_context()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  phone TEXT,
  role public.app_role,
  doctor_status public.doctor_approval_status
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.phone, ur.role, dp.approval_status
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.doctor_profiles dp ON dp.user_id = p.id
  WHERE p.id = auth.uid()
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_my_portal_context() TO authenticated;

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_patient_profiles_updated_at
BEFORE UPDATE ON public.patient_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_doctor_profiles_updated_at
BEFORE UPDATE ON public.doctor_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users can view own profile photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins can view doctor profile photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-photos' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can upload own profile photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own profile photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own profile photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);