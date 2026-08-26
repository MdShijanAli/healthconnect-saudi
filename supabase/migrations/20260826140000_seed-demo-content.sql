-- Demo/dummy content for the admin, doctor and patient portals: more doctors
-- (approved, pending and rejected, across several specializations), more
-- patients (including one blocked), subscription plans, weekly availability,
-- each doctor's medicine list, a spread of appointments in every status,
-- prescriptions for the completed ones, and patient notifications.
--
-- All new demo accounts use the password: Demo@12345
-- Idempotent: safe to re-run. New auth users are skipped if the email
-- already exists; the appointments/prescriptions/notifications block only
-- runs once (guarded on the appointments table being empty).

DO $$
DECLARE
  v_sarah UUID;
  v_omar UUID;
  v_layla UUID;
  v_yousef UUID;
  v_nora UUID;
  v_khalid UUID;
  v_fahad UUID;
  v_mona UUID;
  v_abdullah UUID;
  v_reem UUID;
  v_sultan UUID;
  v_a1 UUID;
  v_a2 UUID;
  v_a3 UUID;
  v_a4 UUID;
  v_a5 UUID;
  v_a6 UUID;
  v_a7 UUID;
  v_a8 UUID;
  v_a9 UUID;
  v_a10 UUID;
  v_a11 UUID;
  v_p1 UUID;
  v_p2 UUID;
  v_p3 UUID;
  v_p4 UUID;
BEGIN
  ------------------------------------------------------------------
  -- Doctors
  ------------------------------------------------------------------

  SELECT id INTO v_sarah FROM auth.users WHERE email = 'doctor@sehatycloud.sa';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'omar.harbi@sehatycloud.sa') THEN
    v_omar := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_omar, 'authenticated', 'authenticated',
      'omar.harbi@sehatycloud.sa', extensions.crypt('Demo@12345', extensions.gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_omar, v_omar::text,
      jsonb_build_object('sub', v_omar::text, 'email', 'omar.harbi@sehatycloud.sa', 'email_verified', true),
      'email', now(), now(), now()
    );
    INSERT INTO public.profiles (id, full_name, phone) VALUES (v_omar, 'Dr. Omar Al-Harbi', '+966500000004');
    INSERT INTO public.user_roles (user_id, role) VALUES (v_omar, 'doctor');
    INSERT INTO public.doctor_profiles (
      user_id, specialization, medical_license_number, years_experience,
      consultation_fee, bio, approval_status, is_active
    ) VALUES (
      v_omar, 'Cardiology', 'DEMO-LICENSE-0002', 12, 250,
      'Board-certified cardiologist with over a decade of experience diagnosing and treating heart and vascular conditions, from hypertension to complex arrhythmias.',
      'approved', true
    );
  ELSE
    SELECT id INTO v_omar FROM auth.users WHERE email = 'omar.harbi@sehatycloud.sa';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'layla.zahrani@sehatycloud.sa') THEN
    v_layla := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_layla, 'authenticated', 'authenticated',
      'layla.zahrani@sehatycloud.sa', extensions.crypt('Demo@12345', extensions.gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_layla, v_layla::text,
      jsonb_build_object('sub', v_layla::text, 'email', 'layla.zahrani@sehatycloud.sa', 'email_verified', true),
      'email', now(), now(), now()
    );
    INSERT INTO public.profiles (id, full_name, phone) VALUES (v_layla, 'Dr. Layla Al-Zahrani', '+966500000005');
    INSERT INTO public.user_roles (user_id, role) VALUES (v_layla, 'doctor');
    INSERT INTO public.doctor_profiles (
      user_id, specialization, medical_license_number, years_experience,
      consultation_fee, bio, approval_status, is_active
    ) VALUES (
      v_layla, 'Pediatrics', 'DEMO-LICENSE-0003', 9, 120,
      'Compassionate pediatrician dedicated to the health and development of infants, children and adolescents, with a focus on preventive care.',
      'approved', true
    );
  ELSE
    SELECT id INTO v_layla FROM auth.users WHERE email = 'layla.zahrani@sehatycloud.sa';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'yousef.qahtani@sehatycloud.sa') THEN
    v_yousef := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_yousef, 'authenticated', 'authenticated',
      'yousef.qahtani@sehatycloud.sa', extensions.crypt('Demo@12345', extensions.gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_yousef, v_yousef::text,
      jsonb_build_object('sub', v_yousef::text, 'email', 'yousef.qahtani@sehatycloud.sa', 'email_verified', true),
      'email', now(), now(), now()
    );
    INSERT INTO public.profiles (id, full_name, phone) VALUES (v_yousef, 'Dr. Yousef Al-Qahtani', '+966500000006');
    INSERT INTO public.user_roles (user_id, role) VALUES (v_yousef, 'doctor');
    INSERT INTO public.doctor_profiles (
      user_id, specialization, medical_license_number, years_experience,
      consultation_fee, bio, approval_status, is_active
    ) VALUES (
      v_yousef, 'Dermatology', 'DEMO-LICENSE-0004', 6, 180,
      'Dermatologist experienced in treating a wide range of skin, hair and nail conditions using the latest evidence-based approaches.',
      'pending_approval', true
    );
  ELSE
    SELECT id INTO v_yousef FROM auth.users WHERE email = 'yousef.qahtani@sehatycloud.sa';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'nora.mutairi@sehatycloud.sa') THEN
    v_nora := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_nora, 'authenticated', 'authenticated',
      'nora.mutairi@sehatycloud.sa', extensions.crypt('Demo@12345', extensions.gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_nora, v_nora::text,
      jsonb_build_object('sub', v_nora::text, 'email', 'nora.mutairi@sehatycloud.sa', 'email_verified', true),
      'email', now(), now(), now()
    );
    INSERT INTO public.profiles (id, full_name, phone) VALUES (v_nora, 'Dr. Nora Al-Mutairi', '+966500000007');
    INSERT INTO public.user_roles (user_id, role) VALUES (v_nora, 'doctor');
    INSERT INTO public.doctor_profiles (
      user_id, specialization, medical_license_number, years_experience,
      consultation_fee, bio, approval_status, is_active
    ) VALUES (
      v_nora, 'Orthopedics', 'DEMO-LICENSE-0005', 11, 220,
      'Orthopedic surgeon specializing in sports injuries, joint disorders and post-operative rehabilitation for patients of all ages.',
      'pending_approval', true
    );
  ELSE
    SELECT id INTO v_nora FROM auth.users WHERE email = 'nora.mutairi@sehatycloud.sa';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'khalid.otaibi@sehatycloud.sa') THEN
    v_khalid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_khalid, 'authenticated', 'authenticated',
      'khalid.otaibi@sehatycloud.sa', extensions.crypt('Demo@12345', extensions.gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_khalid, v_khalid::text,
      jsonb_build_object('sub', v_khalid::text, 'email', 'khalid.otaibi@sehatycloud.sa', 'email_verified', true),
      'email', now(), now(), now()
    );
    INSERT INTO public.profiles (id, full_name, phone) VALUES (v_khalid, 'Dr. Khalid Al-Otaibi', '+966500000008');
    INSERT INTO public.user_roles (user_id, role) VALUES (v_khalid, 'doctor');
    INSERT INTO public.doctor_profiles (
      user_id, specialization, medical_license_number, years_experience,
      consultation_fee, bio, approval_status, is_active, review_notes
    ) VALUES (
      v_khalid, 'Mental Health', 'DEMO-LICENSE-0006', 7, 200,
      'Psychiatrist with a focus on anxiety, depression and stress-related disorders, combining therapy and medication management.',
      'rejected', false,
      'Medical license could not be verified with the Saudi Commission for Health Specialties. Please resubmit with updated supporting documentation.'
    );
  ELSE
    SELECT id INTO v_khalid FROM auth.users WHERE email = 'khalid.otaibi@sehatycloud.sa';
  END IF;

  ------------------------------------------------------------------
  -- Patients
  ------------------------------------------------------------------

  SELECT id INTO v_fahad FROM auth.users WHERE email = 'patient@sehatycloud.sa';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mona.shehri@sehatycloud.sa') THEN
    v_mona := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_mona, 'authenticated', 'authenticated',
      'mona.shehri@sehatycloud.sa', extensions.crypt('Demo@12345', extensions.gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_mona, v_mona::text,
      jsonb_build_object('sub', v_mona::text, 'email', 'mona.shehri@sehatycloud.sa', 'email_verified', true),
      'email', now(), now(), now()
    );
    INSERT INTO public.profiles (id, full_name, phone) VALUES (v_mona, 'Mona Al-Shehri', '+966500000009');
    INSERT INTO public.user_roles (user_id, role) VALUES (v_mona, 'patient');
    INSERT INTO public.patient_profiles (user_id, date_of_birth, gender) VALUES (v_mona, '1988-03-22', 'female');
  ELSE
    SELECT id INTO v_mona FROM auth.users WHERE email = 'mona.shehri@sehatycloud.sa';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'abdullah.dossari@sehatycloud.sa') THEN
    v_abdullah := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_abdullah, 'authenticated', 'authenticated',
      'abdullah.dossari@sehatycloud.sa', extensions.crypt('Demo@12345', extensions.gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_abdullah, v_abdullah::text,
      jsonb_build_object('sub', v_abdullah::text, 'email', 'abdullah.dossari@sehatycloud.sa', 'email_verified', true),
      'email', now(), now(), now()
    );
    INSERT INTO public.profiles (id, full_name, phone) VALUES (v_abdullah, 'Abdullah Al-Dossari', '+966500000010');
    INSERT INTO public.user_roles (user_id, role) VALUES (v_abdullah, 'patient');
    INSERT INTO public.patient_profiles (user_id, date_of_birth, gender) VALUES (v_abdullah, '1979-11-05', 'male');
  ELSE
    SELECT id INTO v_abdullah FROM auth.users WHERE email = 'abdullah.dossari@sehatycloud.sa';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'reem.ghamdi@sehatycloud.sa') THEN
    v_reem := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_reem, 'authenticated', 'authenticated',
      'reem.ghamdi@sehatycloud.sa', extensions.crypt('Demo@12345', extensions.gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_reem, v_reem::text,
      jsonb_build_object('sub', v_reem::text, 'email', 'reem.ghamdi@sehatycloud.sa', 'email_verified', true),
      'email', now(), now(), now()
    );
    INSERT INTO public.profiles (id, full_name, phone) VALUES (v_reem, 'Reem Al-Ghamdi', '+966500000011');
    INSERT INTO public.user_roles (user_id, role) VALUES (v_reem, 'patient');
    INSERT INTO public.patient_profiles (user_id, date_of_birth, gender, is_blocked) VALUES (v_reem, '1995-07-14', 'female', true);
  ELSE
    SELECT id INTO v_reem FROM auth.users WHERE email = 'reem.ghamdi@sehatycloud.sa';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sultan.anzi@sehatycloud.sa') THEN
    v_sultan := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_sultan, 'authenticated', 'authenticated',
      'sultan.anzi@sehatycloud.sa', extensions.crypt('Demo@12345', extensions.gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_sultan, v_sultan::text,
      jsonb_build_object('sub', v_sultan::text, 'email', 'sultan.anzi@sehatycloud.sa', 'email_verified', true),
      'email', now(), now(), now()
    );
    INSERT INTO public.profiles (id, full_name, phone) VALUES (v_sultan, 'Sultan Al-Anzi', '+966500000012');
    INSERT INTO public.user_roles (user_id, role) VALUES (v_sultan, 'patient');
    INSERT INTO public.patient_profiles (user_id, date_of_birth, gender) VALUES (v_sultan, '1985-01-30', 'male');
  ELSE
    SELECT id INTO v_sultan FROM auth.users WHERE email = 'sultan.anzi@sehatycloud.sa';
  END IF;

  ------------------------------------------------------------------
  -- Subscription plans
  ------------------------------------------------------------------

  IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Basic') THEN
    INSERT INTO public.subscription_plans (name, price, billing_cycle, features, is_active) VALUES
      ('Basic', 199.00, 'monthly', '["Up to 20 appointments per month", "Email support", "Basic analytics"]'::jsonb, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Professional') THEN
    INSERT INTO public.subscription_plans (name, price, billing_cycle, features, is_active) VALUES
      ('Professional', 499.00, 'monthly', '["Unlimited appointments", "Priority support", "Advanced analytics", "Custom branding"]'::jsonb, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Enterprise') THEN
    INSERT INTO public.subscription_plans (name, price, billing_cycle, features, is_active) VALUES
      ('Enterprise', 4999.00, 'yearly', '["Everything in Professional", "Dedicated account manager", "API access", "SLA guarantee"]'::jsonb, true);
  END IF;

  ------------------------------------------------------------------
  -- Weekly availability (Sun-Thu, 09:00-17:00) for approved doctors
  ------------------------------------------------------------------

  INSERT INTO public.doctor_availability (doctor_id, day_of_week, is_enabled, start_time, end_time)
  SELECT d.doctor_id, dow, true, '09:00', '17:00'
  FROM (VALUES (v_sarah), (v_omar), (v_layla)) AS d(doctor_id)
  CROSS JOIN generate_series(0, 4) AS dow
  ON CONFLICT (doctor_id, day_of_week) DO NOTHING;

  ------------------------------------------------------------------
  -- Doctor medicine lists
  ------------------------------------------------------------------

  INSERT INTO public.doctor_medicines (doctor_id, name, common_dosage, category) VALUES
    (v_sarah, 'Amlodipine', '5mg', 'Cardiovascular'),
    (v_sarah, 'Paracetamol', '500mg', 'Pain relief'),
    (v_sarah, 'Amoxicillin', '500mg', 'Antibiotic'),
    (v_sarah, 'Vitamin C', '1000mg', 'Supplement'),
    (v_sarah, 'Ibuprofen', '400mg', 'Pain relief')
  ON CONFLICT (doctor_id, name) DO NOTHING;

  INSERT INTO public.doctor_medicines (doctor_id, name, common_dosage, category) VALUES
    (v_omar, 'Aspirin', '75mg', 'Cardiovascular'),
    (v_omar, 'Atorvastatin', '20mg', 'Cardiovascular'),
    (v_omar, 'Metoprolol', '50mg', 'Cardiovascular'),
    (v_omar, 'Clopidogrel', '75mg', 'Cardiovascular'),
    (v_omar, 'Nitroglycerin', '0.4mg', 'Cardiovascular')
  ON CONFLICT (doctor_id, name) DO NOTHING;

  INSERT INTO public.doctor_medicines (doctor_id, name, common_dosage, category) VALUES
    (v_layla, 'Cetirizine', '10mg', 'Allergy'),
    (v_layla, 'Paracetamol (Pediatric)', '120mg/5ml', 'Pain relief'),
    (v_layla, 'Amoxicillin (Pediatric)', '250mg/5ml', 'Antibiotic'),
    (v_layla, 'Ibuprofen (Pediatric)', '100mg/5ml', 'Pain relief'),
    (v_layla, 'Vitamin D3 Drops', '400 IU', 'Supplement')
  ON CONFLICT (doctor_id, name) DO NOTHING;

  ------------------------------------------------------------------
  -- Appointments, prescriptions and notifications (seed once)
  ------------------------------------------------------------------

  IF (SELECT COUNT(*) FROM public.appointments) = 0 THEN

    -- Dr. Sarah Al-Fahad (Family Medicine)
    INSERT INTO public.appointments (doctor_id, patient_id, appointment_date, appointment_time, status, fee, reason)
    VALUES (v_sarah, v_fahad, CURRENT_DATE - 6, '10:00', 'completed', 150, 'Annual check-up and blood pressure review')
    RETURNING id INTO v_a1;

    INSERT INTO public.appointments (doctor_id, patient_id, appointment_date, appointment_time, status, fee, reason)
    VALUES (v_sarah, v_mona, CURRENT_DATE - 2, '11:30', 'completed', 150, 'Persistent cough and fatigue')
    RETURNING id INTO v_a2;

    INSERT INTO public.appointments (doctor_id, patient_id, appointment_date, appointment_time, status, fee, reason)
    VALUES (v_sarah, v_abdullah, CURRENT_DATE, '10:00', 'scheduled', 150, 'Follow-up on medication')
    RETURNING id INTO v_a3;

    INSERT INTO public.appointments (doctor_id, patient_id, appointment_date, appointment_time, status, fee, reason)
    VALUES (v_sarah, v_sultan, CURRENT_DATE, '14:00', 'pending', 150, 'General consultation')
    RETURNING id INTO v_a4;

    INSERT INTO public.appointments (doctor_id, patient_id, appointment_date, appointment_time, status, fee, reason)
    VALUES (v_sarah, v_fahad, CURRENT_DATE + 2, '11:00', 'scheduled', 150, 'Routine follow-up')
    RETURNING id INTO v_a5;

    INSERT INTO public.appointments (doctor_id, patient_id, appointment_date, appointment_time, status, fee, reason, cancel_reason)
    VALUES (v_sarah, v_reem, CURRENT_DATE - 8, '09:00', 'cancelled', 150, 'General consultation', 'Patient requested to reschedule due to travel')
    RETURNING id INTO v_a6;

    -- Dr. Omar Al-Harbi (Cardiology)
    INSERT INTO public.appointments (doctor_id, patient_id, appointment_date, appointment_time, status, fee, reason)
    VALUES (v_omar, v_sultan, CURRENT_DATE - 4, '09:30', 'completed', 250, 'Chest discomfort and shortness of breath')
    RETURNING id INTO v_a7;

    INSERT INTO public.appointments (doctor_id, patient_id, appointment_date, appointment_time, status, fee, reason)
    VALUES (v_omar, v_mona, CURRENT_DATE, '09:30', 'scheduled', 250, 'Cardiac screening')
    RETURNING id INTO v_a8;

    INSERT INTO public.appointments (doctor_id, patient_id, appointment_date, appointment_time, status, fee, reason)
    VALUES (v_omar, v_abdullah, CURRENT_DATE + 3, '15:00', 'scheduled', 250, 'Follow-up ECG review')
    RETURNING id INTO v_a9;

    -- Dr. Layla Al-Zahrani (Pediatrics)
    INSERT INTO public.appointments (doctor_id, patient_id, appointment_date, appointment_time, status, fee, reason)
    VALUES (v_layla, v_reem, CURRENT_DATE - 1, '13:00', 'completed', 120, 'Seasonal allergy consultation')
    RETURNING id INTO v_a10;

    INSERT INTO public.appointments (doctor_id, patient_id, appointment_date, appointment_time, status, fee, reason)
    VALUES (v_layla, v_fahad, CURRENT_DATE + 1, '16:00', 'pending', 120, 'Wellness visit')
    RETURNING id INTO v_a11;

    -- Prescriptions for the completed appointments
    INSERT INTO public.prescriptions (appointment_id, doctor_id, patient_id, diagnosis_notes, advice_notes)
    VALUES (v_a1, v_sarah, v_fahad, 'Mild hypertension, blood pressure slightly elevated at 138/88.', 'Reduce sodium intake, moderate exercise 30 minutes a day, recheck in 4 weeks.')
    RETURNING id INTO v_p1;
    INSERT INTO public.prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES
      (v_p1, 'Amlodipine', '5mg', 'Once daily', '30 days', 'Take in the morning with water.'),
      (v_p1, 'Paracetamol', '500mg', 'As needed', '30 days', 'For headache, up to 3 times a day.');

    INSERT INTO public.prescriptions (appointment_id, doctor_id, patient_id, diagnosis_notes, advice_notes)
    VALUES (v_a2, v_sarah, v_mona, 'Upper respiratory tract infection.', 'Rest, stay hydrated, follow up if symptoms persist beyond 7 days.')
    RETURNING id INTO v_p2;
    INSERT INTO public.prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES
      (v_p2, 'Amoxicillin', '500mg', 'Three times daily', '7 days', 'Complete the full course even if symptoms improve.'),
      (v_p2, 'Vitamin C', '1000mg', 'Once daily', '14 days', 'Take with food.');

    INSERT INTO public.prescriptions (appointment_id, doctor_id, patient_id, diagnosis_notes, advice_notes)
    VALUES (v_a7, v_omar, v_sultan, 'Stable angina, ECG shows mild ST changes.', 'Avoid strenuous activity, follow a low-fat diet, cardiology follow-up in 3 months.')
    RETURNING id INTO v_p3;
    INSERT INTO public.prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES
      (v_p3, 'Aspirin', '75mg', 'Once daily', 'Ongoing', 'Take with food to reduce stomach irritation.'),
      (v_p3, 'Atorvastatin', '20mg', 'Once daily at night', '90 days', 'Recheck lipid panel after 3 months.');

    INSERT INTO public.prescriptions (appointment_id, doctor_id, patient_id, diagnosis_notes, advice_notes)
    VALUES (v_a10, v_layla, v_reem, 'Seasonal allergic rhinitis.', 'Avoid known allergens, use antihistamine as needed.')
    RETURNING id INTO v_p4;
    INSERT INTO public.prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES
      (v_p4, 'Cetirizine', '10mg', 'Once daily', '14 days', 'May cause drowsiness.');

    -- Notifications
    INSERT INTO public.notifications (user_id, type, title, body, related_appointment_id, is_read) VALUES
      (v_fahad, 'prescription_ready', 'Prescription ready', 'Dr. Sarah Al-Fahad completed your consultation and issued a prescription.', v_a1, true),
      (v_fahad, 'appointment_accepted', 'Appointment confirmed', 'Dr. Sarah Al-Fahad confirmed your appointment.', v_a5, false),
      (v_mona, 'prescription_ready', 'Prescription ready', 'Dr. Sarah Al-Fahad completed your consultation and issued a prescription.', v_a2, false),
      (v_mona, 'booking_confirmation', 'Booking request sent', 'Your appointment request with Dr. Omar Al-Harbi has been sent and is awaiting confirmation.', v_a8, true),
      (v_sultan, 'prescription_ready', 'Prescription ready', 'Dr. Omar Al-Harbi completed your consultation and issued a prescription.', v_a7, true),
      (v_sultan, 'booking_confirmation', 'Booking request sent', 'Your appointment request with Dr. Sarah Al-Fahad has been sent and is awaiting confirmation.', v_a4, false),
      (v_abdullah, 'appointment_accepted', 'Appointment confirmed', 'Dr. Sarah Al-Fahad confirmed your appointment.', v_a3, false),
      (v_abdullah, 'booking_confirmation', 'Booking request sent', 'Your appointment request with Dr. Omar Al-Harbi has been sent and is awaiting confirmation.', v_a9, true),
      (v_reem, 'appointment_cancelled', 'Appointment cancelled', 'Dr. Sarah Al-Fahad cancelled your appointment. Reason: Patient requested to reschedule due to travel', v_a6, true),
      (v_reem, 'prescription_ready', 'Prescription ready', 'Dr. Layla Al-Zahrani completed your consultation and issued a prescription.', v_a10, false);

  END IF;
END $$;
