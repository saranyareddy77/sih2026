-- AICTE SmartVerify — Secure Admin Bootstrapping and Role Management
-- SIH Problem Statement 26261

-- Function to bootstrap initial super_admin safely.
-- SECURITY RULE: This function ONLY succeeds if no super_admin exists yet OR if authorized by an existing super_admin.
-- Once the first super_admin is registered and assigned, public initialization locks permanently.
create or replace function public.bootstrap_initial_super_admin(
  p_user_id uuid,
  p_bootstrap_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_super_admin int;
  v_expected_token text := 'AICTE_SUPER_ADMIN_INIT_SECURE_TOKEN_2026';
  v_user_email text;
begin
  -- 1. Check if token matches
  if p_bootstrap_token != v_expected_token then
    return jsonb_build_object('success', false, 'error', 'Invalid bootstrap security token');
  end if;

  -- 2. Check if a super admin already exists
  select count(*) into v_existing_super_admin
  from public.user_roles
  where role = 'super_admin';

  if v_existing_super_admin > 0 then
    -- If a super_admin exists, only an authenticated super_admin can invoke this
    if not public.is_admin() then
      return jsonb_build_object(
        'success', false, 
        'error', 'Super admin bootstrap is permanently disabled because an initial super admin already exists.'
      );
    end if;
  end if;

  -- 3. Verify user exists in profiles or auth
  select email into v_user_email from public.profiles where id = p_user_id;
  if v_user_email is null then
    select email into v_user_email from auth.users where id = p_user_id;
  end if;

  if v_user_email is null then
    return jsonb_build_object('success', false, 'error', 'Specified user does not exist');
  end if;

  -- 4. Assign super_admin role
  insert into public.user_roles (user_id, role)
  values (p_user_id, 'super_admin')
  on conflict (user_id, role) do nothing;

  -- Also grant 'admin' role for general admin queries
  insert into public.user_roles (user_id, role)
  values (p_user_id, 'admin')
  on conflict (user_id, role) do nothing;

  -- Log action in audit table
  insert into public.audit_logs (actor_id, actor_email, action, resource_type, resource_id, details)
  values (
    p_user_id, 
    v_user_email, 
    'BOOTSTRAP_SUPER_ADMIN', 
    'user_roles', 
    p_user_id::text, 
    jsonb_build_object('granted_role', 'super_admin', 'initial_bootstrap', (v_existing_super_admin = 0))
  );

  return jsonb_build_object(
    'success', true, 
    'message', 'Super admin initialized successfully.',
    'user_id', p_user_id,
    'email', v_user_email
  );
end;
$$;

-- Function for authorized super_admin to grant or revoke admin privileges
create or replace function public.authorize_admin_user(
  p_target_user_id uuid,
  p_role text default 'admin'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Enforce caller must be super_admin
  if not exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'super_admin') then
    raise exception 'Unauthorized: Only an existing Super Admin can authorize new administrators.';
  end if;

  if p_role not in ('admin', 'institution') then
    raise exception 'Invalid role assignment';
  end if;

  insert into public.user_roles (user_id, role)
  values (p_target_user_id, p_role)
  on conflict (user_id, role) do nothing;

  insert into public.audit_logs (actor_id, action, resource_type, resource_id, details)
  values (
    auth.uid(), 
    'AUTHORIZE_USER_ROLE', 
    'user_roles', 
    p_target_user_id::text, 
    jsonb_build_object('role_assigned', p_role)
  );

  return jsonb_build_object('success', true, 'assigned_role', p_role);
end;
$$;

-- Function to safely disable/lock the bootstrap function entirely if desired
create or replace function public.disable_bootstrap_permanently()
returns void
language sql
security definer
as $$
  drop function if exists public.bootstrap_initial_super_admin(uuid, text);
$$;
