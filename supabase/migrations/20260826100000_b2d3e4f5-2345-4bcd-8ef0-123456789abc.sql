-- Doctor active/suspended toggle, patient block/unblock toggle, and a short
-- note captured when an admin rejects a doctor application.
ALTER TABLE public.doctor_profiles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.doctor_profiles ADD COLUMN review_notes TEXT CHECK (review_notes IS NULL OR char_length(review_notes) <= 500);
ALTER TABLE public.patient_profiles ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT false;

-- Specializations master list: source for the landing page, the doctor
-- registration dropdown, and the admin CRUD screen. Publicly readable
-- since it's shown pre-login on the landing page and registration form.
CREATE TABLE public.specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 2 AND 100),
  icon TEXT NOT NULL DEFAULT 'Stethoscope' CHECK (char_length(icon) <= 50),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.specializations TO anon, authenticated;
GRANT ALL ON public.specializations TO service_role;
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view specializations"
ON public.specializations FOR SELECT TO anon, authenticated
USING (true);
CREATE POLICY "Server manages specializations"
ON public.specializations FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TRIGGER set_specializations_updated_at
BEFORE UPDATE ON public.specializations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.specializations (name, icon, description, display_order) VALUES
  ('Family Medicine', 'Stethoscope', 'Primary and preventive care for the whole family.', 1),
  ('Pediatrics', 'Baby', 'Medical care for infants, children and adolescents.', 2),
  ('Cardiology', 'HeartPulse', 'Diagnosis and treatment of heart and vascular conditions.', 3),
  ('Dermatology', 'Sparkles', 'Skin, hair and nail conditions.', 4),
  ('Dentistry', 'Smile', 'General and cosmetic dental care.', 5),
  ('Orthopedics', 'Bone', 'Bones, joints, ligaments and muscles.', 6),
  ('Obstetrics & Gynecology', 'Flower2', 'Women''s reproductive health and pregnancy care.', 7),
  ('Mental Health', 'Brain', 'Psychiatry and psychological counseling.', 8);

-- Subscription plans doctors can sign up for. Admin-managed only for now;
-- no payment gateway integration yet.
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Server manages subscription plans"
ON public.subscription_plans FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TRIGGER set_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Appointments: foundation for admin dashboard stats and reports. The
-- patient-facing booking flow isn't built yet, so this starts empty.
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(user_id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(user_id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants and admins can view appointments"
ON public.appointments FOR SELECT TO authenticated
USING (
  doctor_id = auth.uid()
  OR patient_id = auth.uid()
  OR private.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Server manages appointments"
ON public.appointments FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TRIGGER set_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
