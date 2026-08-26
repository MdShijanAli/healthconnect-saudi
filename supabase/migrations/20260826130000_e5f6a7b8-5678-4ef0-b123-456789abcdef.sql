-- Seed default demo accounts (super admin, doctor, patient) for evaluating the
-- platform without going through registration + manual approval first.
-- Auth users are created directly via SQL (crypt/gen_salt, matching how
-- Supabase Auth hashes passwords) rather than the Admin API, since this
-- environment only has SQL migration access to the project.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  admin_id UUID;
  doctor_id UUID;
  patient_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@sehatycloud.sa') THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
      'admin@sehatycloud.sa', extensions.crypt('Admin@12345', extensions.gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), admin_id, admin_id::text,
      jsonb_build_object('sub', admin_id::text, 'email', 'admin@sehatycloud.sa', 'email_verified', true),
      'email', now(), now(), now()
    );
    INSERT INTO public.profiles (id, full_name, phone) VALUES (admin_id, 'Sehaty Admin', '+966500000001');
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'super_admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'doctor@sehatycloud.sa') THEN
    doctor_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', doctor_id, 'authenticated', 'authenticated',
      'doctor@sehatycloud.sa', extensions.crypt('Doctor@12345', extensions.gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), doctor_id, doctor_id::text,
      jsonb_build_object('sub', doctor_id::text, 'email', 'doctor@sehatycloud.sa', 'email_verified', true),
      'email', now(), now(), now()
    );
    INSERT INTO public.profiles (id, full_name, phone) VALUES (doctor_id, 'Dr. Sarah Al-Fahad', '+966500000002');
    INSERT INTO public.user_roles (user_id, role) VALUES (doctor_id, 'doctor');
    INSERT INTO public.doctor_profiles (
      user_id, specialization, medical_license_number, years_experience,
      consultation_fee, bio, approval_status, is_active
    ) VALUES (
      doctor_id, 'Family Medicine', 'DEMO-LICENSE-0001', 8, 150,
      'Experienced family medicine physician providing comprehensive primary and preventive care for patients of all ages.',
      'approved', true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'patient@sehatycloud.sa') THEN
    patient_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', patient_id, 'authenticated', 'authenticated',
      'patient@sehatycloud.sa', extensions.crypt('Patient@12345', extensions.gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), patient_id, patient_id::text,
      jsonb_build_object('sub', patient_id::text, 'email', 'patient@sehatycloud.sa', 'email_verified', true),
      'email', now(), now(), now()
    );
    INSERT INTO public.profiles (id, full_name, phone) VALUES (patient_id, 'Fahad Al-Otaibi', '+966500000003');
    INSERT INTO public.user_roles (user_id, role) VALUES (patient_id, 'patient');
    INSERT INTO public.patient_profiles (user_id, date_of_birth, gender) VALUES (patient_id, '1990-05-14', 'male');
  END IF;
END $$;
