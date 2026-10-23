-- ============================================================================
-- AICTE SMARTVERIFY — AUTH USER ACCOUNTS SETUP & CONFIRMATION
-- SIH Problem Statement 26261
--
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nyzhayxwntecvhpwiwwo/sql/new
-- ============================================================================

-- 1. Clean up any incomplete auth entries
delete from auth.identities where identity_data->>'email' in (
  'director.approval@aicte-india.org',
  'scrutiny.officer@aicte-india.org',
  'registrar@niatr-demo.edu.in'
);
delete from auth.users where email in (
  'director.approval@aicte-india.org',
  'scrutiny.officer@aicte-india.org',
  'registrar@niatr-demo.edu.in'
);

-- 2. CREATE SUPER ADMIN ACCOUNT
-- Email: director.approval@aicte-india.org
-- Password: SuperAdminPassword2026!
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  'd0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'director.approval@aicte-india.org',
  crypt('SuperAdminPassword2026!', gen_salt('bf', 10)),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Prof. T. G. Chandrasekhar","designation":"Member Secretary & Super Admin"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  'd0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', 'd0000000-0000-0000-0000-000000000001', 'email', 'director.approval@aicte-india.org'),
  'email',
  'director.approval@aicte-india.org',
  now(),
  now(),
  now()
);

insert into public.profiles (id, email, full_name, designation)
values ('d0000000-0000-0000-0000-000000000001', 'director.approval@aicte-india.org', 'Prof. T. G. Chandrasekhar', 'Member Secretary & Super Admin')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role)
values ('d0000000-0000-0000-0000-000000000001', 'super_admin')
on conflict do nothing;

insert into public.user_roles (user_id, role)
values ('d0000000-0000-0000-0000-000000000001', 'admin')
on conflict do nothing;


-- 3. CREATE SCRUTINY OFFICER ACCOUNT
-- Email: scrutiny.officer@aicte-india.org
-- Password: ScrutinyOfficerPassword2026!
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  'd0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'scrutiny.officer@aicte-india.org',
  crypt('ScrutinyOfficerPassword2026!', gen_salt('bf', 10)),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Dr. V. K. Deshmukh","designation":"Regional Scrutiny Officer (Northern Region)"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  'd0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000002',
  jsonb_build_object('sub', 'd0000000-0000-0000-0000-000000000002', 'email', 'scrutiny.officer@aicte-india.org'),
  'email',
  'scrutiny.officer@aicte-india.org',
  now(),
  now(),
  now()
);

insert into public.profiles (id, email, full_name, designation)
values ('d0000000-0000-0000-0000-000000000002', 'scrutiny.officer@aicte-india.org', 'Dr. V. K. Deshmukh', 'Regional Scrutiny Officer (Northern Region)')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role)
values ('d0000000-0000-0000-0000-000000000002', 'scrutiny_officer')
on conflict do nothing;

insert into public.user_roles (user_id, role)
values ('d0000000-0000-0000-0000-000000000002', 'admin')
on conflict do nothing;


-- 4. CREATE INSTITUTION USER ACCOUNT
-- Email: registrar@niatr-demo.edu.in
-- Password: InstitutionPassword2026!
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  'd0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'registrar@niatr-demo.edu.in',
  crypt('InstitutionPassword2026!', gen_salt('bf', 10)),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Dr. Amitabh Verma","designation":"Registrar & Authorized Representative"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  'd0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000003',
  jsonb_build_object('sub', 'd0000000-0000-0000-0000-000000000003', 'email', 'registrar@niatr-demo.edu.in'),
  'email',
  'registrar@niatr-demo.edu.in',
  now(),
  now(),
  now()
);

insert into public.profiles (id, email, full_name, designation, institution_id)
values (
  'd0000000-0000-0000-0000-000000000003', 
  'registrar@niatr-demo.edu.in', 
  'Dr. Amitabh Verma', 
  'Registrar & Authorized Representative',
  'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do update set full_name = excluded.full_name, institution_id = excluded.institution_id;

insert into public.user_roles (user_id, role)
values ('d0000000-0000-0000-0000-000000000003', 'institution_user')
on conflict do nothing;

-- 5. Auto-confirm all emails so logins succeed immediately without email links
update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;
