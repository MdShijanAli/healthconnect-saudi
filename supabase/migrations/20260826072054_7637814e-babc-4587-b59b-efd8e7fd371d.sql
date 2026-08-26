CREATE POLICY "Server manages doctor registrations"
ON public.doctor_registrations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Server manages patient bookings"
ON public.patient_bookings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);