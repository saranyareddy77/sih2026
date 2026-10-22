-- AICTE SmartVerify — Database Schema Migration
-- SIH Problem Statement 26261

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
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

-- 2. USER ROLES TABLE (Protected: public registration CANNOT set role to admin)
create table if not exists public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('institution', 'admin', 'super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, role)
);

-- 3. INSTITUTIONS TABLE
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

-- Add foreign key from profiles to institutions
alter table public.profiles 
  drop constraint if exists fk_profiles_institution,
  add constraint fk_profiles_institution foreign key (institution_id) references public.institutions(id) on delete set null;

-- 4. APPLICATIONS TABLE
create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  application_number text not null unique,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  application_type text not null default 'Extension of Approval (EoA)', 
  -- e.g. 'Extension of Approval (EoA)', 'New Institution Approval', 'Increase in Intake', 'Introduction of New Course'
  academic_year text not null default '2026-2027',
  status text not null default 'Draft' check (
    status in (
      'Draft',
      'Submitted',
      'Preliminary Validation',
      'Action Required',
      'Awaiting Official Review',
      'Under Review',
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

-- 5. APPLICATION DOCUMENTS TABLE
create table if not exists public.application_documents (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  document_type text not null, 
  -- e.g. 'Land Use Certificate', 'Building Plan Approval', 'Occupancy Certificate', 'Fire Safety Certificate', 
  -- 'AICTE Previous Approval Letter', 'Affidavit', 'Society Registration / Trust Deed'
  original_name text not null,
  file_path text not null,
  file_size integer not null default 0,
  mime_type text not null default 'application/pdf',
  checksum text, -- SHA-256
  is_corrupt boolean not null default false,
  extracted_fields jsonb default '{}'::jsonb,
  ocr_status text not null default 'Not Run' check (
    ocr_status in ('Not Run', 'Processing', 'Completed', 'Failed', 'Low Readability')
  ),
  ocr_confidence numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. VALIDATION FINDINGS TABLE
create table if not exists public.validation_findings (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  document_id uuid references public.application_documents(id) on delete cascade,
  check_name text not null,
  category text not null, 
  -- e.g. 'Document Completeness', 'File Validity', 'Field Extraction', 'Cross-Document Consistency',
  -- 'Date & Validity', 'Duplicate & Integrity', 'Signatures & Seals', 'Regulatory Compliance', 'Authenticity Confirmation'
  policy_id text not null default 'AICTE-APH-2026-V1',
  result text not null check (result in ('Passed', 'Failed', 'Needs Review', 'Not Checked')),
  severity text not null check (severity in ('High', 'Medium', 'Low', 'Info')),
  expected_condition text,
  observed_value text,
  explanation text not null,
  recommended_action text,
  evidence_source text,
  page_reference text,
  requires_human_review boolean not null default false,
  is_reviewed boolean not null default false,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. OFFICIAL REVIEW COMMENTS TABLE
create table if not exists public.official_review_comments (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'AICTE Officer',
  comment_type text not null check (comment_type in ('Official Comment', 'Correction Request', 'Final Decision')),
  decision text check (decision in ('Approved', 'Rejected', 'Action Required', 'Needs Further Inspection')),
  comment_text text not null,
  created_at timestamptz not null default now()
);

-- 8. APPLICATION STATUS HISTORY TABLE
create table if not exists public.application_status_history (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  previous_status text,
  new_status text not null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default 'System',
  reason text not null,
  created_at timestamptz not null default now()
);

-- 9. STATUS UPDATE REQUESTS TABLE
create table if not exists public.status_update_requests (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references public.applications(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  request_subject text not null,
  request_message text not null,
  reply_message text,
  replied_by uuid references auth.users(id) on delete set null,
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Resolved')),
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

-- 10. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('info', 'success', 'warning', 'error', 'action_required')),
  application_id uuid references public.applications(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 11. AUDIT LOGS TABLE
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

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
create index if not exists idx_applications_institution_id on public.applications(institution_id);
create index if not exists idx_applications_status on public.applications(status);
create index if not exists idx_applications_number on public.applications(application_number);
create index if not exists idx_docs_application_id on public.application_documents(application_id);
create index if not exists idx_findings_application_id on public.validation_findings(application_id);
create index if not exists idx_findings_result on public.validation_findings(result);
create index if not exists idx_status_hist_app on public.application_status_history(application_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_audit_actor on public.audit_logs(actor_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
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

-- Helper function: is current user an admin or super_admin?
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

-- Helper function: get current user's institution_id
create or replace function public.current_user_institution_id()
returns uuid language sql security definer as $$
  select institution_id from public.profiles
  where id = auth.uid();
$$;

-- PROFILES POLICIES
create policy "Users can view own profile or admins view all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- USER ROLES POLICIES (Strictly locked: public cannot insert admin role)
create policy "Users can view own role or admins view all"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Only existing super_admins can insert or update user roles"
  on public.user_roles for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'super_admin'
    )
  );

-- INSTITUTIONS POLICIES
create policy "Institutions are viewable by members or admins"
  on public.institutions for select
  using (id = public.current_user_institution_id() or public.is_admin() or auth.uid() is null);

create policy "Admins can manage institutions"
  on public.institutions for all
  using (public.is_admin());

create policy "Institution members can update their institution"
  on public.institutions for update
  using (id = public.current_user_institution_id());

-- APPLICATIONS POLICIES
create policy "Institutions view own applications, admins view all"
  on public.applications for select
  using (
    institution_id = public.current_user_institution_id() 
    or public.is_admin()
    or is_synthetic_demo = true -- Allow demo applications to be viewed for inspection
  );

create policy "Institutions can insert applications for their institution"
  on public.applications for insert
  with check (
    institution_id = public.current_user_institution_id() 
    or public.is_admin()
  );

create policy "Institutions can update their draft/action_required applications"
  on public.applications for update
  using (
    (institution_id = public.current_user_institution_id() and status in ('Draft', 'Action Required', 'Preliminary Validation'))
    or public.is_admin()
  );

-- APPLICATION DOCUMENTS POLICIES
create policy "Institutions view own docs, admins view all"
  on public.application_documents for select
  using (
    exists (
      select 1 from public.applications a
      where a.id = application_documents.application_id
        and (a.institution_id = public.current_user_institution_id() or public.is_admin() or a.is_synthetic_demo = true)
    )
  );

create policy "Institutions can upload docs for their applications"
  on public.application_documents for insert
  with check (
    exists (
      select 1 from public.applications a
      where a.id = application_documents.application_id
        and (a.institution_id = public.current_user_institution_id() or public.is_admin())
    )
  );

create policy "Institutions can update/delete docs in editable states"
  on public.application_documents for delete
  using (
    exists (
      select 1 from public.applications a
      where a.id = application_documents.application_id
        and ((a.institution_id = public.current_user_institution_id() and a.status in ('Draft', 'Action Required')) or public.is_admin())
    )
  );

-- VALIDATION FINDINGS POLICIES
create policy "View validation findings"
  on public.validation_findings for select
  using (
    exists (
      select 1 from public.applications a
      where a.id = validation_findings.application_id
        and (a.institution_id = public.current_user_institution_id() or public.is_admin() or a.is_synthetic_demo = true)
    )
  );

create policy "System/admins/owners can insert findings on validation"
  on public.validation_findings for insert
  with check (
    exists (
      select 1 from public.applications a
      where a.id = validation_findings.application_id
        and (a.institution_id = public.current_user_institution_id() or public.is_admin() or a.is_synthetic_demo = true)
    )
  );

create policy "Admins can update findings review status"
  on public.validation_findings for update
  using (public.is_admin());

-- OFFICIAL REVIEW COMMENTS POLICIES
create policy "Everyone authorized can view review comments"
  on public.official_review_comments for select
  using (
    exists (
      select 1 from public.applications a
      where a.id = official_review_comments.application_id
        and (a.institution_id = public.current_user_institution_id() or public.is_admin() or a.is_synthetic_demo = true)
    )
  );

create policy "Only admins can insert review comments"
  on public.official_review_comments for insert
  with check (public.is_admin());

-- STATUS HISTORY POLICIES
create policy "View status history"
  on public.application_status_history for select
  using (
    exists (
      select 1 from public.applications a
      where a.id = application_status_history.application_id
        and (a.institution_id = public.current_user_institution_id() or public.is_admin() or a.is_synthetic_demo = true)
    )
  );

create policy "Insert status history"
  on public.application_status_history for insert
  with check (
    exists (
      select 1 from public.applications a
      where a.id = application_status_history.application_id
        and (a.institution_id = public.current_user_institution_id() or public.is_admin() or a.is_synthetic_demo = true)
    )
  );

-- STATUS UPDATE REQUESTS POLICIES
create policy "Institutions and admins view status requests"
  on public.status_update_requests for select
  using (institution_id = public.current_user_institution_id() or public.is_admin());

create policy "Institutions can insert status requests"
  on public.status_update_requests for insert
  with check (institution_id = public.current_user_institution_id());

create policy "Admins can update status requests (reply)"
  on public.status_update_requests for update
  using (public.is_admin());

-- NOTIFICATIONS POLICIES
create policy "Users view their own notifications"
  on public.notifications for select
  using (user_id = auth.uid() or institution_id = public.current_user_institution_id());

create policy "Users update own notifications (mark read)"
  on public.notifications for update
  using (user_id = auth.uid() or institution_id = public.current_user_institution_id());

create policy "Insert notifications"
  on public.notifications for insert
  with check (true);

-- AUDIT LOGS POLICIES
create policy "Only admins can view audit logs"
  on public.audit_logs for select
  using (public.is_admin());

create policy "Audit logs can be created by authenticated users"
  on public.audit_logs for insert
  with check (auth.uid() is not null or public.is_admin());
