CREATE TABLE public.doctor_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email TEXT NOT NULL CHECK (char_length(email) <= 255),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 8 AND 20),
  specialty TEXT NOT NULL CHECK (char_length(specialty) BETWEEN 2 AND 100),
  license_number TEXT NOT NULL CHECK (char_length(license_number) BETWEEN 3 AND 50),
  years_experience INTEGER NOT NULL CHECK (years_experience BETWEEN 0 AND 70),
  clinic_name TEXT CHECK (clinic_name IS NULL OR char_length(clinic_name) <= 120),
  city TEXT NOT NULL CHECK (char_length(city) BETWEEN 2 AND 80),
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('in_person', 'video', 'both')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.doctor_registrations TO service_role;
ALTER TABLE public.doctor_registrations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.patient_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL CHECK (char_length(patient_name) BETWEEN 2 AND 100),
  email TEXT NOT NULL CHECK (char_length(email) <= 255),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 8 AND 20),
  specialty TEXT NOT NULL CHECK (char_length(specialty) BETWEEN 2 AND 100),
  doctor_preference TEXT CHECK (doctor_preference IS NULL OR char_length(doctor_preference) <= 100),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('in_person', 'video')),
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 5 AND 1000),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.patient_bookings TO service_role;
ALTER TABLE public.patient_bookings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_doctor_registrations_updated_at
BEFORE UPDATE ON public.doctor_registrations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_patient_bookings_updated_at
BEFORE UPDATE ON public.patient_bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_future_booking_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.appointment_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Appointment date must be today or later';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_patient_booking_date
BEFORE INSERT OR UPDATE OF appointment_date ON public.patient_bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_future_booking_date();