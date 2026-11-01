-- AICTE SmartVerify — Application Workflow, Institution Profile & RLS Policies
-- SIH Problem Statement 26261

-- 1. EXTEND INSTITUTIONS TABLE FOR COMPLETE INSTITUTION PROFILE
alter table public.institutions 
  add column if not exists district text,
  add column if not exists previous_approval_details jsonb default '{}'::jsonb,
  add column if not exists director_name text,
  add column if not exists director_email text,
  add column if not exists director_phone text,
  add column if not exists representative_name text,
  add column if not exists representative_designation text,
  add column if not exists approved_programmes jsonb default '[]'::jsonb,
  add column if not exists faculty_records jsonb default '{}'::jsonb,
  add column if not exists accreditation_details jsonb default '{}'::jsonb,
  add column if not exists infrastructure_details jsonb default '{}'::jsonb,
  add column if not exists is_profile_completed boolean default false,
  add column if not exists profile_completion_percentage integer default 0;

-- 2. EXTEND APPLICATIONS TABLE FOR DRAFT PERSISTENCE, CLARIFICATIONS & SUBMISSION SNAPSHOTS
alter table public.applications
  add column if not exists draft_data jsonb default '{}'::jsonb,
  add column if not exists submission_snapshot jsonb,
  add column if not exists clarification_request text,
  add column if not exists clarification_response text,
  add column if not exists clarification_requested_at timestamptz,
  add column if not exists clarification_responded_at timestamptz,
  add column if not exists step_progress integer default 1;

-- 3. UPDATE APPLICATION STATUS CONSTRAINT
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check check (
  status in (
    'Draft',
    'Validation Required',
    'Ready for Submission',
    'Submitted',
    'Under Scrutiny',
    'Clarification Required',
    'Resubmitted',
    'Verified',
    'Preliminary Validation',
    'Action Required',
    'Awaiting Official Review',
    'Under Review',
    'Needs Review',
    'Authenticity Confirmation Pending',
    'Verification Complete',
    'Review Completed',
    'Received',
    'Pending',
    'Under Process',
    'Awaiting Information',
    'Transferred',
    'Escalated',
    'Disposed',
    'Closed'
  )
);

-- 4. SAFE RLS POLICIES FOR INSTITUTION REGISTRATION & USER SELF-PROVISIONING
-- Allow authenticated users to insert institution record upon registration
drop policy if exists "Authenticated users can insert institution" on public.institutions;
create policy "Authenticated users can insert institution" 
  on public.institutions for insert 
  to authenticated 
  with check (true);

-- Allow authenticated users to insert their own profile
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" 
  on public.profiles for insert 
  to authenticated 
  with check (auth.uid() = id);

-- Allow authenticated users to self-assign STRICTLY 'institution_user' role
drop policy if exists "Users can self-assign institution_user role" on public.user_roles;
create policy "Users can self-assign institution_user role" 
  on public.user_roles for insert 
  to authenticated 
  with check (auth.uid() = user_id and role = 'institution_user');

-- Allow institutions to update their draft applications
drop policy if exists "Institutions can update their draft/action_required applications" on public.applications;
create policy "Institutions can update their draft/action_required applications"
  on public.applications for update
  to authenticated
  using (
    (institution_id = public.current_user_institution_id() and status in (
      'Draft', 
      'Validation Required', 
      'Ready for Submission', 
      'Action Required', 
      'Preliminary Validation', 
      'Clarification Required',
      'Resubmitted'
    ))
    or public.is_admin()
  );

-- 5. RPC FUNCTION: SECURE INSTITUTION REGISTRATION
-- Atomically creates institution, profile, and institution_user role
create or replace function public.register_new_institution(
  p_institution_name text,
  p_institution_code text,
  p_aishe_code text default null,
  p_institution_type text default 'Engineering & Technology',
  p_address text default 'Institutional Area',
  p_city text default 'New Delhi',
  p_district text default null,
  p_state text default 'Delhi',
  p_pincode text default '110001',
  p_official_email text default '',
  p_contact_phone text default null,
  p_full_name text default '',
  p_designation text default 'Authorized Representative'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_institution_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized: Must be authenticated to register an institution.';
  end if;

  -- 1. Check if institution with same permanent ID already exists
  select id into v_institution_id from public.institutions where lower(code) = lower(trim(p_institution_code));

  if v_institution_id is null then
    insert into public.institutions (
      name,
      code,
      aishe_code,
      institution_type,
      address,
      city,
      district,
      state,
      pincode,
      contact_email,
      contact_phone,
      representative_name,
      representative_designation
    ) values (
      trim(p_institution_name),
      trim(p_institution_code),
      trim(p_aishe_code),
      p_institution_type,
      trim(p_address),
      trim(p_city),
      trim(p_district),
      trim(p_state),
      trim(p_pincode),
      lower(trim(p_official_email)),
      trim(p_contact_phone),
      trim(p_full_name),
      trim(p_designation)
    )
    returning id into v_institution_id;
  end if;

  -- 2. Upsert user profile linked to this institution
  insert into public.profiles (
    id,
    email,
    full_name,
    designation,
    phone,
    institution_id,
    updated_at
  ) values (
    v_user_id,
    lower(trim(p_official_email)),
    trim(p_full_name),
    trim(p_designation),
    trim(p_contact_phone),
    v_institution_id,
    now()
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    designation = excluded.designation,
    phone = excluded.phone,
    institution_id = excluded.institution_id,
    updated_at = now();

  -- 3. Ensure role is strictly institution_user (never admin)
  insert into public.user_roles (user_id, role)
  values (v_user_id, 'institution_user')
  on conflict (user_id, role) do nothing;

  -- 4. Record audit log
  insert into public.audit_logs (actor_id, actor_email, action, resource_type, resource_id, details)
  values (
    v_user_id,
    lower(trim(p_official_email)),
    'REGISTER_INSTITUTION',
    'institutions',
    v_institution_id::text,
    jsonb_build_object(
      'institution_name', p_institution_name,
      'institution_code', p_institution_code,
      'representative_name', p_full_name
    )
  );

  return jsonb_build_object(
    'success', true,
    'institution_id', v_institution_id
  );
end;
$$;
