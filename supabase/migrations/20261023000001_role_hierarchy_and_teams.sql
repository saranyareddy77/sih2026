-- AICTE SmartVerify — Role Hierarchy, Scrutiny Teams & Assignment Migration
-- SIH Problem Statement 26261

-- 1. UPDATE USER_ROLES CHECK CONSTRAINT
-- Support super_admin, scrutiny_officer, scrutiny_member, institution_user (with legacy aliases admin, institution)
alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check 
  check (role in ('super_admin', 'scrutiny_officer', 'scrutiny_member', 'institution_user', 'admin', 'institution'));

-- 2. ENFORCE ONE SUPER ADMIN RULE IN DATABASE
-- Partial unique index strictly guaranteeing at most ONE super_admin across the whole database
create unique index if not exists idx_only_one_super_admin 
  on public.user_roles (role) 
  where (role = 'super_admin');

-- 3. SCRUTINY TEAMS TABLE
-- An authorized Scrutiny Officer leads a Scrutiny Team responsible for a specific region or scope
create table if not exists public.scrutiny_teams (
  id uuid primary key default uuid_generate_v4(),
  officer_id uuid not null references auth.users(id) on delete cascade,
  team_name text not null,
  region_or_scope text default 'National',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. TEAM MEMBERS TABLE
-- Scrutiny Members assigned to an Officer's team
create table if not exists public.team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.scrutiny_teams(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(team_id, member_id)
);

-- 5. APPLICATION ASSIGNMENTS TABLE
-- Assigns applications to a Scrutiny Team, Officer, and/or Member
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

-- Indexes for high-performance scrutiny querying
create index if not exists idx_scrutiny_teams_officer on public.scrutiny_teams(officer_id);
create index if not exists idx_team_members_team on public.team_members(team_id);
create index if not exists idx_team_members_member on public.team_members(member_id);
create index if not exists idx_app_assignments_team on public.application_assignments(team_id);
create index if not exists idx_app_assignments_officer on public.application_assignments(officer_id);
create index if not exists idx_app_assignments_member on public.application_assignments(assigned_member_id);

-- 6. SECURITY DEFINER HELPER FUNCTIONS
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles 
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_scrutiny_officer()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles 
    where user_id = auth.uid() and role in ('scrutiny_officer', 'admin', 'super_admin')
  );
$$;

create or replace function public.is_scrutiny_member()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles 
    where user_id = auth.uid() and role in ('scrutiny_member', 'scrutiny_officer', 'admin', 'super_admin')
  );
$$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.scrutiny_teams enable row level security;
alter table public.team_members enable row level security;
alter table public.application_assignments enable row level security;

-- Teams RLS:
-- Super admin can do all
drop policy if exists "super_admin_all_teams" on public.scrutiny_teams;
create policy "super_admin_all_teams" on public.scrutiny_teams
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Officers can view and update their own team
drop policy if exists "officers_view_own_team" on public.scrutiny_teams;
create policy "officers_view_own_team" on public.scrutiny_teams
  for select to authenticated
  using (officer_id = auth.uid() or public.is_super_admin() or exists (
    select 1 from public.team_members tm where tm.team_id = scrutiny_teams.id and tm.member_id = auth.uid()
  ));

-- Team Members RLS:
drop policy if exists "super_admin_all_members" on public.team_members;
create policy "super_admin_all_members" on public.team_members
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "officers_view_team_members" on public.team_members;
create policy "officers_view_team_members" on public.team_members
  for select to authenticated
  using (
    member_id = auth.uid() or
    exists (select 1 from public.scrutiny_teams st where st.id = team_members.team_id and st.officer_id = auth.uid()) or
    public.is_super_admin()
  );

-- Application Assignments RLS:
drop policy if exists "super_admin_all_assignments" on public.application_assignments;
create policy "super_admin_all_assignments" on public.application_assignments
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "officers_members_view_assignments" on public.application_assignments;
create policy "officers_members_view_assignments" on public.application_assignments
  for select to authenticated
  using (
    public.is_super_admin() or
    officer_id = auth.uid() or
    assigned_member_id = auth.uid() or
    exists (select 1 from public.team_members tm where tm.team_id = application_assignments.team_id and tm.member_id = auth.uid())
  );

-- 8. SUPER ADMIN RPC FOR TEAM & MEMBER MANAGEMENT
create or replace function public.admin_create_officer_and_team(
  p_officer_id uuid,
  p_team_name text,
  p_scope text default 'National'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Unauthorized: Only the Super Admin can create Scrutiny Officers and Teams.';
  end if;

  -- Assign scrutiny_officer and admin roles
  insert into public.user_roles (user_id, role)
  values (p_officer_id, 'scrutiny_officer')
  on conflict (user_id, role) do nothing;

  insert into public.user_roles (user_id, role)
  values (p_officer_id, 'admin')
  on conflict (user_id, role) do nothing;

  -- Create or update team
  insert into public.scrutiny_teams (officer_id, team_name, region_or_scope)
  values (p_officer_id, p_team_name, p_scope)
  returning id into v_team_id;

  -- Log action
  insert into public.audit_logs (actor_id, action, resource_type, resource_id, details)
  values (
    auth.uid(),
    'CREATE_SCRUTINY_OFFICER_TEAM',
    'scrutiny_teams',
    v_team_id::text,
    jsonb_build_object('officer_id', p_officer_id, 'team_name', p_team_name, 'scope', p_scope)
  );

  return jsonb_build_object('success', true, 'team_id', v_team_id);
end;
$$;

create or replace function public.admin_assign_member_to_team(
  p_team_id uuid,
  p_member_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Unauthorized: Only the Super Admin can assign team members.';
  end if;

  -- Assign scrutiny_member role
  insert into public.user_roles (user_id, role)
  values (p_member_id, 'scrutiny_member')
  on conflict (user_id, role) do nothing;

  insert into public.team_members (team_id, member_id, assigned_by)
  values (p_team_id, p_member_id, auth.uid())
  on conflict (team_id, member_id) do update set is_active = true;

  insert into public.audit_logs (actor_id, action, resource_type, resource_id, details)
  values (
    auth.uid(),
    'ASSIGN_TEAM_MEMBER',
    'team_members',
    p_member_id::text,
    jsonb_build_object('team_id', p_team_id, 'member_id', p_member_id)
  );

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_assign_application(
  p_application_id uuid,
  p_team_id uuid,
  p_officer_id uuid default null,
  p_member_id uuid default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_super_admin() or public.is_scrutiny_officer()) then
    raise exception 'Unauthorized: Only Super Admin or Scrutiny Officers can assign applications.';
  end if;

  insert into public.application_assignments (application_id, team_id, officer_id, assigned_member_id, assigned_by, notes)
  values (p_application_id, p_team_id, p_officer_id, p_member_id, auth.uid(), p_notes)
  on conflict (application_id) do update set
    team_id = excluded.team_id,
    officer_id = excluded.officer_id,
    assigned_member_id = excluded.assigned_member_id,
    assigned_by = excluded.assigned_by,
    notes = excluded.notes,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, resource_type, resource_id, details)
  values (
    auth.uid(),
    'ASSIGN_APPLICATION',
    'application_assignments',
    p_application_id::text,
    jsonb_build_object('team_id', p_team_id, 'officer_id', p_officer_id, 'member_id', p_member_id)
  );

  return jsonb_build_object('success', true);
end;
$$;
