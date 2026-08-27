ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS review_notes text;
ALTER TABLE public.patient_profiles ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.patient_bookings ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0;

CREATE TABLE public.specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'stethoscope',
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.specializations TO anon;
GRANT SELECT ON public.specializations TO authenticated;
GRANT ALL ON public.specializations TO service_role;
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view specializations" ON public.specializations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Server manages specializations" ON public.specializations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER set_specializations_updated_at BEFORE UPDATE ON public.specializations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  features text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO anon;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Server manages subscription plans" ON public.subscription_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER set_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.specializations (name, icon, description, sort_order) VALUES
  ('Cardiology', 'heart-pulse', 'Heart health, diagnostics and long-term cardiac care.', 1),
  ('Dermatology', 'sparkles', 'Skin, hair and nail treatments with modern dermatology.', 2),
  ('Dental Care', 'smile', 'Preventive, cosmetic and restorative dental treatment.', 3),
  ('Pediatrics', 'baby', 'Gentle, attentive care for infants, children and teens.', 4),
  ('General Medicine', 'stethoscope', 'Everyday consultations, screening and follow-up care.', 5),
  ('Orthopedics', 'bone', 'Bone, joint and sports injury diagnosis and recovery.', 6),
  ('Gynecology', 'flower', 'Women''s health, pregnancy care and routine screening.', 7),
  ('ENT', 'ear', 'Ear, nose and throat care for all ages.', 8);

INSERT INTO public.subscription_plans (name, price, billing_cycle, features, sort_order) VALUES
  ('Starter', 299, 'monthly', ARRAY['1 doctor seat','Online booking','Basic reports'], 1),
  ('Clinic', 899, 'monthly', ARRAY['Up to 10 doctors','E-prescriptions','Advanced reports','Priority support'], 2),
  ('Enterprise', 2499, 'monthly', ARRAY['Unlimited doctors','Multi-branch','API access','Dedicated success manager'], 3);