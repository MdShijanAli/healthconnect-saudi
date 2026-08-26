-- Patients can now have a private profile photo, same storage convention
-- as doctors (path-scoped by user id in the existing profile-photos bucket).
ALTER TABLE public.patient_profiles ADD COLUMN profile_photo_path TEXT;

-- get_my_portal_context() gains patient_blocked so the patient portal layout
-- can gate a blocked patient's own session, not just hide them from admin
-- lists. Changing the return shape requires dropping first (Postgres won't
-- let CREATE OR REPLACE alter a function's output columns).
DROP FUNCTION public.get_my_portal_context();

CREATE FUNCTION public.get_my_portal_context()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  phone TEXT,
  role public.app_role,
  doctor_status public.doctor_approval_status,
  patient_blocked BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.phone, ur.role, dp.approval_status, pp.is_blocked
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.doctor_profiles dp ON dp.user_id = p.id
  LEFT JOIN public.patient_profiles pp ON pp.user_id = p.id
  WHERE p.id = auth.uid()
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_my_portal_context() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_portal_context() TO authenticated;

-- Notifications: appointment reminders, prescription-ready alerts and
-- booking confirmations, surfaced in the patient portal's bell/list.
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking_confirmation', 'appointment_accepted', 'appointment_cancelled', 'prescription_ready')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body TEXT NOT NULL CHECK (char_length(body) <= 1000),
  related_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "Users mark own notifications read"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
CREATE POLICY "Server manages notifications"
ON public.notifications FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
