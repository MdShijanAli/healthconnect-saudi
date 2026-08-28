CREATE TYPE public.appointment_status AS ENUM ('requested','confirmed','completed','cancelled');

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  reason text NOT NULL DEFAULT '',
  status public.appointment_status NOT NULL DEFAULT 'requested',
  cancel_reason text,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX appointments_doctor_idx ON public.appointments(doctor_id, appointment_date);
CREATE INDEX appointments_patient_idx ON public.appointments(patient_id, appointment_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors and patients view own appointments" ON public.appointments FOR SELECT TO authenticated
  USING (doctor_id = auth.uid() OR patient_id = auth.uid() OR private.has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Patients request appointments" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Doctors update own appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Patients update own appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  is_enabled boolean NOT NULL DEFAULT false,
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, weekday)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_availability TO authenticated;
GRANT SELECT ON public.doctor_availability TO anon;
GRANT ALL ON public.doctor_availability TO service_role;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view availability" ON public.doctor_availability FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Doctors manage own availability" ON public.doctor_availability FOR ALL TO authenticated
  USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE TRIGGER doctor_availability_updated_at BEFORE UPDATE ON public.doctor_availability
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.doctor_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  off_date date NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, off_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_time_off TO authenticated;
GRANT SELECT ON public.doctor_time_off TO anon;
GRANT ALL ON public.doctor_time_off TO service_role;
ALTER TABLE public.doctor_time_off ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view time off" ON public.doctor_time_off FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Doctors manage own time off" ON public.doctor_time_off FOR ALL TO authenticated
  USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE TRIGGER doctor_time_off_updated_at BEFORE UPDATE ON public.doctor_time_off
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.doctor_medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  common_dosage text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_medicines TO authenticated;
GRANT ALL ON public.doctor_medicines TO service_role;
ALTER TABLE public.doctor_medicines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors manage own medicines" ON public.doctor_medicines FOR ALL TO authenticated
  USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE TRIGGER doctor_medicines_updated_at BEFORE UPDATE ON public.doctor_medicines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnosis text NOT NULL DEFAULT '',
  advice text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appointment_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors and patients view prescriptions" ON public.prescriptions FOR SELECT TO authenticated
  USING (doctor_id = auth.uid() OR patient_id = auth.uid());
CREATE POLICY "Doctors write prescriptions" ON public.prescriptions FOR INSERT TO authenticated
  WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Doctors update own prescriptions" ON public.prescriptions FOR UPDATE TO authenticated
  USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE TRIGGER prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  dosage text NOT NULL DEFAULT '',
  frequency text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX prescription_items_prescription_idx ON public.prescription_items(prescription_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescription_items TO authenticated;
GRANT ALL ON public.prescription_items TO service_role;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View items of visible prescriptions" ON public.prescription_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_id AND (p.doctor_id = auth.uid() OR p.patient_id = auth.uid())));
CREATE POLICY "Doctors manage items of own prescriptions" ON public.prescription_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_id AND p.doctor_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_id AND p.doctor_id = auth.uid()));