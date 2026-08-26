-- Appointments: add a "pending" state (patient requested, awaiting doctor
-- acceptance), a reason-for-visit field, and a cancellation reason.
ALTER TABLE public.appointments ADD COLUMN reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 1000);
ALTER TABLE public.appointments ADD COLUMN cancel_reason TEXT CHECK (cancel_reason IS NULL OR char_length(cancel_reason) <= 500);
ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled'));

-- Doctor's personal predefined medicine list, used to populate the
-- prescription builder's autocomplete.
CREATE TABLE public.doctor_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 150),
  common_dosage TEXT CHECK (common_dosage IS NULL OR char_length(common_dosage) <= 100),
  category TEXT CHECK (category IS NULL OR char_length(category) <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_medicines TO authenticated;
GRANT ALL ON public.doctor_medicines TO service_role;
ALTER TABLE public.doctor_medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage own medicines"
ON public.doctor_medicines FOR ALL TO authenticated
USING (doctor_id = auth.uid())
WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Server manages medicines"
ON public.doctor_medicines FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TRIGGER set_doctor_medicines_updated_at
BEFORE UPDATE ON public.doctor_medicines
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- One prescription per completed consultation.
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(user_id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(user_id) ON DELETE CASCADE,
  diagnosis_notes TEXT CHECK (diagnosis_notes IS NULL OR char_length(diagnosis_notes) <= 2000),
  advice_notes TEXT CHECK (advice_notes IS NULL OR char_length(advice_notes) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctor and patient can view own prescriptions"
ON public.prescriptions FOR SELECT TO authenticated
USING (
  doctor_id = auth.uid()
  OR patient_id = auth.uid()
  OR private.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Server manages prescriptions"
ON public.prescriptions FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TRIGGER set_prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Line items (medicines) within a prescription. medicine_name is a
-- snapshot so the prescription stays accurate even if the doctor later
-- edits or deletes that medicine from their personal list.
CREATE TABLE public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES public.doctor_medicines(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL CHECK (char_length(medicine_name) BETWEEN 2 AND 150),
  dosage TEXT CHECK (dosage IS NULL OR char_length(dosage) <= 100),
  frequency TEXT CHECK (frequency IS NULL OR char_length(frequency) <= 50),
  duration TEXT CHECK (duration IS NULL OR char_length(duration) <= 50),
  instructions TEXT CHECK (instructions IS NULL OR char_length(instructions) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prescription_items TO authenticated;
GRANT ALL ON public.prescription_items TO service_role;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctor and patient can view own prescription items"
ON public.prescription_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.prescriptions p
    WHERE p.id = prescription_items.prescription_id
    AND (p.doctor_id = auth.uid() OR p.patient_id = auth.uid() OR private.has_role(auth.uid(), 'super_admin'))
  )
);
CREATE POLICY "Server manages prescription items"
ON public.prescription_items FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Weekly working hours (one row per day of week, 0 = Sunday) and
-- specific dates marked unavailable (holidays/leave). Together these
-- define the slots patients will be able to book.
CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(user_id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, day_of_week),
  CHECK (end_time > start_time)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_availability TO authenticated;
GRANT ALL ON public.doctor_availability TO service_role;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctor manages own availability"
ON public.doctor_availability FOR ALL TO authenticated
USING (doctor_id = auth.uid())
WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Server manages availability"
ON public.doctor_availability FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TRIGGER set_doctor_availability_updated_at
BEFORE UPDATE ON public.doctor_availability
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.doctor_unavailable_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, date)
);
GRANT SELECT, INSERT, DELETE ON public.doctor_unavailable_dates TO authenticated;
GRANT ALL ON public.doctor_unavailable_dates TO service_role;
ALTER TABLE public.doctor_unavailable_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctor manages own leave dates"
ON public.doctor_unavailable_dates FOR ALL TO authenticated
USING (doctor_id = auth.uid())
WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Server manages leave dates"
ON public.doctor_unavailable_dates FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Public, field-limited view of approved & active doctors for the
-- landing page's "Meet Our Doctors" section (phone numbers etc. stay
-- private; only safe marketing fields are exposed).
CREATE OR REPLACE FUNCTION public.list_public_doctors()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  specialization TEXT,
  years_experience INTEGER,
  consultation_fee NUMERIC,
  bio TEXT,
  profile_photo_path TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, dp.specialization, dp.years_experience, dp.consultation_fee, dp.bio, dp.profile_photo_path
  FROM public.doctor_profiles dp
  JOIN public.profiles p ON p.id = dp.user_id
  WHERE dp.approval_status = 'approved' AND dp.is_active = true
  ORDER BY dp.created_at ASC
$$;
REVOKE ALL ON FUNCTION public.list_public_doctors() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_doctors() TO anon, authenticated;
