-- ============================================================================
-- AICTE SMARTVERIFY — COMPLETE ALL-IN-ONE SUPABASE DATABASE SETUP
-- SIH Problem Statement 26261
-- 
-- Run this ENTIRE script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nyzhayxwntecvhpwiwwo/sql/new
--
-- This script safely:
-- 1. Creates all tables, foreign keys, and indexes
-- 2. Sets up PostgreSQL Row-Level Security (RLS) policies
-- 3. Sets up the private 'application-documents' storage bucket
-- 4. Enforces the Single Super Admin database constraint
-- 5. Seeds the 10 Synthetic Demonstration Institutions & Applications
-- 6. Creates 3 Pre-configured Authentication Accounts (Super Admin, Scrutiny Officer, Institution User)
-- ============================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. DATABASE SCHEMA TABLES
-- ============================================================================

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  designation text,
  institution_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- USER ROLES
create table if not exists public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'scrutiny_officer', 'scrutiny_member', 'institution_user', 'admin', 'institution')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, role)
);

-- ENFORCE SINGLE SUPER ADMIN IN DATABASE
create unique index if not exists idx_only_one_super_admin 
  on public.user_roles (role) 
  where (role = 'super_admin');

-- INSTITUTIONS
create table if not exists public.institutions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  aishe_code text,
  institution_type text default 'Engineering & Technology',
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  contact_email text not null,
  contact_phone text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles institution foreign key
alter table public.profiles 
  drop constraint if exists fk_profiles_institution,
  add constraint fk_profiles_institution foreign key (institution_id) references public.institutions(id) on delete set null;

-- APPLICATIONS
create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  application_number text not null unique,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  application_type text not null default 'Extension of Approval (EoA)',
  academic_year text not null default '2026-2027',
  status text not null default 'Draft' check (
    status in (
      'Draft',
      'Submitted',
      'Preliminary Validation',
      'Action Required',
      'Awaiting Official Review',
      'Under Review',
      'Needs Review',
      'Resubmitted',
      'Authenticity Confirmation Pending',
      'Verification Complete',
      'Review Completed'
    )
  ),
  overall_validation_outcome text default 'Not Checked' check (
    overall_validation_outcome in ('Passed', 'Failed', 'Needs Review', 'Not Checked')
  ),
  is_synthetic_demo boolean not null default false,
  submission_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure check constraint includes 'Needs Review' if table was already created
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check check (
  status in (
    'Draft',
    'Submitted',
    'Preliminary Validation',
    'Action Required',
    'Awaiting Official Review',
    'Under Review',
    'Needs Review',
    'Resubmitted',
    'Authenticity Confirmation Pending',
    'Verification Complete',
    'Review Completed'
  )
);

-- APPLICATION DOCUMENTS
create table if not exists public.application_documents (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  document_type text not null,
  original_name text not null,
  file_path text not null,
  file_size integer not null default 0,
  mime_type text not null default 'application/pdf',
  checksum text,
  is_corrupt boolean not null default false,
  extracted_fields jsonb default '{}'::jsonb,
  ocr_status text not null default 'Not Run' check (
    ocr_status in ('Not Run', 'Processing', 'Completed', 'Failed', 'Low Readability')
  ),
  ocr_confidence numeric(5,2),
  ocr_raw_text text,
  has_seal boolean default false,
  has_signature boolean default false,
  authority_verified boolean,
  authority_status text check (
    authority_status in ('Verified by Source', 'Mismatched Details', 'Certificate Expired', 'Record Not Found', 'Source Unavailable')
  ),
  authority_verified_at timestamptz,
  authority_notes text,
  version integer not null default 1,
  superseded_by uuid references public.application_documents(id) on delete set null,
  is_active boolean not null default true,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- VALIDATION FINDINGS
create table if not exists public.validation_findings (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  document_id uuid references public.application_documents(id) on delete cascade,
  check_name text not null,
  category text not null,
  policy_id text,
  result text not null check (result in ('Passed', 'Failed', 'Needs Review', 'Not Checked')),
  severity text not null default 'Medium' check (severity in ('High', 'Medium', 'Low', 'Info')),
  observed_value text,
  expected_value text,
  explanation text not null,
  requires_human_review boolean not null default false,
  page_number integer,
  bounding_box jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- OFFICIAL REVIEW COMMENTS
create table if not exists public.official_review_comments (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  finding_id uuid references public.validation_findings(id) on delete set null,
  document_id uuid references public.application_documents(id) on delete set null,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  comment_type text not null default 'finding_review' check (
    comment_type in ('general', 'finding_review', 'correction_request', 'decision_record')
  ),
  comment text not null,
  status_change text,
  is_internal_only boolean not null default false,
  created_at timestamptz not null default now()
);

-- STATUS HISTORY
create table if not exists public.application_status_history (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  changed_by uuid references auth.users(id) on delete set null,
  previous_status text,
  new_status text not null,
  reason text,
  created_at timestamptz not null default now()
);

-- STATUS UPDATE REQUESTS
create table if not exists public.status_update_requests (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  current_status text not null,
  requested_status text not null,
  reason text not null,
  justification text,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- REGULATORY RULES
create table if not exists public.regulatory_rules (
  id text primary key,
  title text not null,
  clause text not null,
  description text not null,
  severity text not null check (severity in ('High', 'Medium', 'Low', 'Info')),
  is_active boolean not null default true,
  rule_version text not null default '2026.1',
  updated_by text not null default 'AICTE Central Authority',
  updated_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  title text not null,
  message text not null,
  notification_type text not null check (
    notification_type in ('system', 'status_change', 'deficiency_found', 'correction_requested', 'review_complete')
  ),
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- AUDIT LOGS
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  resource_type text not null,
  resource_id text,
  details jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- SCRUTINY TEAMS
create table if not exists public.scrutiny_teams (
  id uuid primary key default uuid_generate_v4(),
  officer_id uuid not null references auth.users(id) on delete cascade,
  team_name text not null,
  region_or_scope text default 'National',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TEAM MEMBERS
create table if not exists public.team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.scrutiny_teams(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(team_id, member_id)
);

-- APPLICATION ASSIGNMENTS
create table if not exists public.application_assignments (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  team_id uuid references public.scrutiny_teams(id) on delete set null,
  officer_id uuid references auth.users(id) on delete set null,
  assigned_member_id uuid references auth.users(id) on delete set null,
  assigned_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(application_id)
);

-- ============================================================================
-- 2. HELPER FUNCTIONS & RLS
-- ============================================================================

create or replace function public.is_super_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.user_roles 
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_scrutiny_officer()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.user_roles 
    where user_id = auth.uid() and role in ('scrutiny_officer', 'admin', 'super_admin')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin', 'super_admin', 'scrutiny_officer', 'scrutiny_member')
  );
$$;

create or replace function public.current_user_institution_id()
returns uuid language sql security definer stable as $$
  select institution_id from public.profiles where id = auth.uid();
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.institutions enable row level security;
alter table public.applications enable row level security;
alter table public.application_documents enable row level security;
alter table public.validation_findings enable row level security;
alter table public.official_review_comments enable row level security;
alter table public.application_status_history enable row level security;
alter table public.status_update_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.regulatory_rules enable row level security;
alter table public.scrutiny_teams enable row level security;
alter table public.team_members enable row level security;
alter table public.application_assignments enable row level security;

-- Policies for Profiles
drop policy if exists "profile_select" on public.profiles;
create policy "profile_select" on public.profiles for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profile_update" on public.profiles;
create policy "profile_update" on public.profiles for update using (auth.uid() = id);

drop policy if exists "profile_insert" on public.profiles;
create policy "profile_insert" on public.profiles for insert with check (auth.uid() = id or public.is_admin());

-- Policies for User Roles
drop policy if exists "user_roles_select" on public.user_roles;
create policy "user_roles_select" on public.user_roles for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "user_roles_super_admin" on public.user_roles;
create policy "user_roles_super_admin" on public.user_roles for all using (public.is_super_admin());

-- Policies for Applications
drop policy if exists "applications_select" on public.applications;
create policy "applications_select" on public.applications for select using (
  institution_id = public.current_user_institution_id() 
  or public.is_admin()
  or is_synthetic_demo = true
);

drop policy if exists "applications_insert" on public.applications;
create policy "applications_insert" on public.applications for insert with check (
  institution_id = public.current_user_institution_id() 
  or public.is_admin()
);

drop policy if exists "applications_update" on public.applications;
create policy "applications_update" on public.applications for update using (
  institution_id = public.current_user_institution_id() 
  or public.is_admin()
);

-- Policies for Documents
drop policy if exists "documents_select" on public.application_documents;
create policy "documents_select" on public.application_documents for select using (
  exists (
    select 1 from public.applications a
    where a.id = application_documents.application_id
      and (a.institution_id = public.current_user_institution_id() or public.is_admin() or a.is_synthetic_demo = true)
  )
);

-- Policies for Findings
drop policy if exists "findings_select" on public.validation_findings;
create policy "findings_select" on public.validation_findings for select using (
  exists (
    select 1 from public.applications a
    where a.id = validation_findings.application_id
      and (a.institution_id = public.current_user_institution_id() or public.is_admin() or a.is_synthetic_demo = true)
  )
);

-- Policies for Teams & Assignments
drop policy if exists "super_admin_all_teams" on public.scrutiny_teams;
create policy "super_admin_all_teams" on public.scrutiny_teams for all using (public.is_super_admin());

drop policy if exists "officers_view_own_team" on public.scrutiny_teams;
create policy "officers_view_own_team" on public.scrutiny_teams for select using (officer_id = auth.uid() or public.is_super_admin());

drop policy if exists "super_admin_all_members" on public.team_members;
create policy "super_admin_all_members" on public.team_members for all using (public.is_super_admin());

drop policy if exists "officers_view_team_members" on public.team_members;
create policy "officers_view_team_members" on public.team_members for select using (
  member_id = auth.uid() or
  exists (select 1 from public.scrutiny_teams st where st.id = team_members.team_id and st.officer_id = auth.uid()) or
  public.is_super_admin()
);

drop policy if exists "super_admin_all_assignments" on public.application_assignments;
create policy "super_admin_all_assignments" on public.application_assignments for all using (public.is_super_admin());

drop policy if exists "officers_members_view_assignments" on public.application_assignments;
create policy "officers_members_view_assignments" on public.application_assignments for select using (
  public.is_super_admin() or
  officer_id = auth.uid() or
  assigned_member_id = auth.uid()
);

-- Notifications Policies
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications for select using (user_id = auth.uid());

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications for update using (user_id = auth.uid());

-- Audit Logs Policies
drop policy if exists "audit_logs_select" on public.audit_logs;
create policy "audit_logs_select" on public.audit_logs for select using (public.is_admin());

drop policy if exists "audit_logs_insert" on public.audit_logs;
create policy "audit_logs_insert" on public.audit_logs for insert with check (true);

-- Regulatory Rules Policies
drop policy if exists "regulatory_rules_select" on public.regulatory_rules;
create policy "regulatory_rules_select" on public.regulatory_rules for select using (true);

drop policy if exists "regulatory_rules_admin" on public.regulatory_rules;
create policy "regulatory_rules_admin" on public.regulatory_rules for all using (public.is_admin());

-- ============================================================================
-- 3. STORAGE SETUP
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('application-documents', 'application-documents', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'])
on conflict (id) do update set
  public = false,
  file_size_limit = 15728640;

-- ============================================================================
-- 4. SEED 10 SYNTHETIC INSTITUTIONS & DEMO APPLICATIONS
-- ============================================================================
insert into public.institutions (id, name, code, aishe_code, institution_type, address, city, state, pincode, contact_email, contact_phone, website)
values 
  ('a0000000-0000-0000-0000-000000000001', 'National Institute of Advanced Technology & Research', '1-1092837411', 'C-48192', 'Engineering & Technology', 'Sector 62, Institutional Area', 'Noida', 'Uttar Pradesh', '201309', 'registrar@niatr-demo.edu.in', '+91 120 2998811', 'https://niatr-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000002', 'Deccan Polytechnic & Engineering Academy', '1-2093847522', 'C-39102', 'Polytechnic & Diploma', 'Survey No. 44, Hilltop Campus', 'Pune', 'Maharashtra', '411038', 'principal@deccanpoly-demo.edu.in', '+91 20 25890011', 'https://deccanpoly-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000003', 'Kaveri Institute of Technology and Management', '1-3049586733', 'C-51982', 'Management & Technical', 'Outer Ring Road, IT Corridor', 'Bengaluru', 'Karnataka', '560103', 'admin@kaveri-itm-demo.edu.in', '+91 80 41235678', 'https://kaveri-itm-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000004', 'Aravalli College of Pharmacy & Allied Sciences', '1-4092837444', 'C-28471', 'Pharmacy & Health Sciences', 'NH-8, Bilaspur Junction', 'Gurugram', 'Haryana', '122413', 'compliance@aravalli-pharma-demo.edu.in', '+91 124 2883399', 'https://aravalli-pharma-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000005', 'Malabar Ocean Institute of Maritime Studies', '1-5093847555', 'C-63910', 'Applied Maritime & Engineering', 'Willingdon Island Road', 'Kochi', 'Kerala', '682003', 'dean@malabar-maritime-demo.edu.in', '+91 484 2667788', 'https://malabar-maritime-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000006', 'Himalayan Institute of Architecture & Town Planning', '1-6094857666', 'C-18492', 'Architecture & Applied Arts', 'Rajpur Road, Foothills Enclave', 'Dehradun', 'Uttarakhand', '248009', 'office@himalayan-arch-demo.edu.in', '+91 135 2774411', 'https://himalayan-arch-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000007', 'Brahmaputra Regional Engineering College', '1-7095867777', 'C-72910', 'Engineering & Technology', 'Jalukbari Campus', 'Guwahati', 'Assam', '781014', 'director@brahmaputra-rec-demo.edu.in', '+91 361 2570088', 'https://brahmaputra-rec-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000008', 'Vindhya Institute of Computer Applications', '1-8096877888', 'C-40192', 'MCA & Computer Sciences', 'Kolar Road Extension', 'Bhopal', 'Madhya Pradesh', '462042', 'hod@vindhya-ca-demo.edu.in', '+91 755 2498877', 'https://vindhya-ca-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000009', 'Thar Desert Institute of Solar & Applied Energy', '1-9097887999', 'C-89102', 'Renewable Energy & Technology', 'Mandore Road, Solar Park Zone', 'Jodhpur', 'Rajasthan', '342007', 'academic@thar-solar-demo.edu.in', '+91 291 2891122', 'https://thar-solar-demo.edu.in'),
  ('a0000000-0000-0000-0000-000000000010', 'Coromandel Coastal Institute of Technology', '1-1002938010', 'C-91029', 'Engineering & Technology', 'East Coast Road, Sholinganallur', 'Chennai', 'Tamil Nadu', '600119', 'registrar@coromandel-tech-demo.edu.in', '+91 44 24500990', 'https://coromandel-tech-demo.edu.in')
on conflict (id) do nothing;

insert into public.applications (id, application_number, institution_id, application_type, academic_year, status, overall_validation_outcome, is_synthetic_demo, submission_date)
values
  ('b0000000-0000-0000-0000-000000000001', 'AICTE/2026/APP-1001-PASS', 'a0000000-0000-0000-0000-000000000001', 'Extension of Approval (EoA)', '2026-2027', 'Awaiting Official Review', 'Passed', true, '2026-02-10 11:30:00+00'),
  ('b0000000-0000-0000-0000-000000000002', 'AICTE/2026/APP-1002-REVIEWED', 'a0000000-0000-0000-0000-000000000002', 'Extension of Approval (EoA)', '2026-2027', 'Review Completed', 'Passed', true, '2026-02-01 10:00:00+00'),
  ('b0000000-0000-0000-0000-000000000003', 'AICTE/2026/APP-1003-MISSING-DOC', 'a0000000-0000-0000-0000-000000000003', 'Extension of Approval (EoA)', '2026-2027', 'Action Required', 'Failed', true, '2026-02-12 14:15:00+00'),
  ('b0000000-0000-0000-0000-000000000004', 'AICTE/2026/APP-1004-EXPIRED', 'a0000000-0000-0000-0000-000000000004', 'Extension of Approval (EoA)', '2026-2027', 'Action Required', 'Failed', true, '2026-02-14 09:40:00+00'),
  ('b0000000-0000-0000-0000-000000000005', 'AICTE/2026/APP-1005-NAME-MISMATCH', 'a0000000-0000-0000-0000-000000000005', 'Extension of Approval (EoA)', '2026-2027', 'Needs Review', 'Needs Review', true, '2026-02-15 12:00:00+00'),
  ('b0000000-0000-0000-0000-000000000006', 'AICTE/2026/APP-1006-CODE-MISMATCH', 'a0000000-0000-0000-0000-000000000006', 'Extension of Approval (EoA)', '2026-2027', 'Needs Review', 'Needs Review', true, '2026-02-16 15:20:00+00'),
  ('b0000000-0000-0000-0000-000000000007', 'AICTE/2026/APP-1007-DUPLICATE', 'a0000000-0000-0000-0000-000000000007', 'Extension of Approval (EoA)', '2026-2027', 'Needs Review', 'Needs Review', true, '2026-02-17 11:00:00+00'),
  ('b0000000-0000-0000-0000-000000000008', 'AICTE/2026/APP-1008-LOW-QUALITY', 'a0000000-0000-0000-0000-000000000008', 'Extension of Approval (EoA)', '2026-2027', 'Needs Review', 'Needs Review', true, '2026-02-18 16:00:00+00'),
  ('b0000000-0000-0000-0000-000000000009', 'AICTE/2026/APP-1009-CORRUPT-FILE', 'a0000000-0000-0000-0000-000000000009', 'Extension of Approval (EoA)', '2026-2027', 'Action Required', 'Failed', true, '2026-02-19 09:10:00+00'),
  ('b0000000-0000-0000-0000-000000000010', 'AICTE/2026/APP-1010-AUTH-PENDING', 'a0000000-0000-0000-0000-000000000010', 'Extension of Approval (EoA)', '2026-2027', 'Authenticity Confirmation Pending', 'Needs Review', true, '2026-02-20 10:30:00+00')
on conflict (id) do nothing;

insert into public.validation_findings (id, application_id, check_name, category, policy_id, result, severity, explanation, requires_human_review)
values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Mandatory Document Completeness', 'Document Completeness', 'AICTE-APH-2026-V1.2', 'Passed', 'Info', 'All mandatory certificates required under APH 2026-2027 are present.', false),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Mandatory Document Completeness', 'Document Completeness', 'AICTE-APH-2026-V1.2', 'Failed', 'High', 'Mandatory safety and legal certificates are absent from the submission dossier.', false),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Fire Safety Certificate Temporal Validity', 'Date & Validity', 'AICTE-APH-2026-V1.2', 'Failed', 'High', 'The regulatory validity period of Fire Safety Certificate lapsed on 2024-08-09.', false),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Cross-Document Entity Matching', 'Cross-Document Consistency', 'AICTE-APH-2026-V1.2', 'Needs Review', 'High', 'Extracted name does not match the registered institution profile name.', true),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'Institution Code Alignment', 'Cross-Document Consistency', 'AICTE-APH-2026-V1.2', 'Needs Review', 'High', 'The institute code found on Building Plan Approval differs from application profile.', true),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007', 'File Duplicate Checksum Flag', 'Duplicate & Integrity', 'AICTE-APH-2026-V1.2', 'Needs Review', 'Medium', 'Identical SHA-256 hash detected across distinct regulatory document slots.', true),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', 'Visual Clarity & DPI Quality', 'File Validity', 'AICTE-APH-2026-V1.2', 'Needs Review', 'Medium', 'Document scan exhibits blur or low contrast below confidence threshold.', true),
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', 'File Integrity & Readable Header', 'File Validity', 'AICTE-APH-2026-V1.2', 'Failed', 'High', 'The uploaded file payload is corrupt or unreadable.', true),
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000010', 'Third-Party Registry Authenticity', 'Authenticity Confirmation', 'AICTE-APH-2026-V1.2', 'Needs Review', 'Info', 'Internal consistency passed; external live state registry verification is pending.', true)
on conflict (id) do nothing;

-- ============================================================================
-- 5. SEED AUTH USERS WITH EMAILS AND PASSWORDS
-- ============================================================================

-- Clean up any incomplete auth entries
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

-- SUPER ADMIN
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  'd0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'director.approval@aicte-india.org',
  crypt('SuperAdminPassword2026!', gen_salt('bf', 10)), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Prof. T. G. Chandrasekhar","designation":"Member Secretary & Super Admin"}'::jsonb,
  now(), now(), '', '', '', ''
);

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values (
  'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', 'd0000000-0000-0000-0000-000000000001', 'email', 'director.approval@aicte-india.org'),
  'email', 'director.approval@aicte-india.org', now(), now(), now()
);

insert into public.profiles (id, email, full_name, designation)
values ('d0000000-0000-0000-0000-000000000001', 'director.approval@aicte-india.org', 'Prof. T. G. Chandrasekhar', 'Member Secretary & Super Admin')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role) values ('d0000000-0000-0000-0000-000000000001', 'super_admin') on conflict do nothing;
insert into public.user_roles (user_id, role) values ('d0000000-0000-0000-0000-000000000001', 'admin') on conflict do nothing;

-- SCRUTINY OFFICER
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  'd0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'scrutiny.officer@aicte-india.org',
  crypt('ScrutinyOfficerPassword2026!', gen_salt('bf', 10)), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Dr. V. K. Deshmukh","designation":"Regional Scrutiny Officer (Northern Region)"}'::jsonb,
  now(), now(), '', '', '', ''
);

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values (
  'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002',
  jsonb_build_object('sub', 'd0000000-0000-0000-0000-000000000002', 'email', 'scrutiny.officer@aicte-india.org'),
  'email', 'scrutiny.officer@aicte-india.org', now(), now(), now()
);

insert into public.profiles (id, email, full_name, designation)
values ('d0000000-0000-0000-0000-000000000002', 'scrutiny.officer@aicte-india.org', 'Dr. V. K. Deshmukh', 'Regional Scrutiny Officer (Northern Region)')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role) values ('d0000000-0000-0000-0000-000000000002', 'scrutiny_officer') on conflict do nothing;
insert into public.user_roles (user_id, role) values ('d0000000-0000-0000-0000-000000000002', 'admin') on conflict do nothing;

-- INSTITUTION USER
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  'd0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'registrar@niatr-demo.edu.in',
  crypt('InstitutionPassword2026!', gen_salt('bf', 10)), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Dr. Amitabh Verma","designation":"Registrar & Authorized Representative"}'::jsonb,
  now(), now(), '', '', '', ''
);

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values (
  'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003',
  jsonb_build_object('sub', 'd0000000-0000-0000-0000-000000000003', 'email', 'registrar@niatr-demo.edu.in'),
  'email', 'registrar@niatr-demo.edu.in', now(), now(), now()
);

insert into public.profiles (id, email, full_name, designation, institution_id)
values (
  'd0000000-0000-0000-0000-000000000003', 'registrar@niatr-demo.edu.in',
  'Dr. Amitabh Verma', 'Registrar & Authorized Representative', 'a0000000-0000-0000-0000-000000000001'
)
on conflict (id) do update set full_name = excluded.full_name, institution_id = excluded.institution_id;

insert into public.user_roles (user_id, role) values ('d0000000-0000-0000-0000-000000000003', 'institution_user') on conflict do nothing;

-- Create initial Scrutiny Cell for the Scrutiny Officer
insert into public.scrutiny_teams (id, officer_id, team_name, region_or_scope)
values (
  'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
  'Northern Regional Scrutiny Cell', 'Northern Region'
)
on conflict do nothing;

-- Auto-confirm all emails
update auth.users set email_confirmed_at = now() where email_confirmed_at is null;
