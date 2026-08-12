-- Fix: admin.createUser writes app_metadata via a follow-up UPDATE, so the
-- AFTER INSERT handle_new_user trigger often sees an empty role and defaults
-- to GUEST. Sync profiles.role from auth.users.raw_app_meta_data on UPDATE,
-- and allow a controlled service-role bootstrap bypass of role immutability.

create or replace function public.role_from_app_metadata(meta jsonb)
returns public.user_role
language plpgsql
immutable
as $$
declare
  meta_role text;
begin
  meta_role := meta->>'role';
  if meta_role in ('GUEST', 'SALE', 'OWNER', 'ADMIN') then
    return meta_role::public.user_role;
  end if;
  return 'GUEST';
end;
$$;

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  -- Transaction-local bypass for auth→profile bootstrap/sync only.
  if current_setting('app.bypass_role_immutable', true) = 'true' then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'Role is immutable';
  end if;
  return new;
end;
$$;

create or replace function public.sync_profile_role_from_auth(p_user_id uuid)
returns public.user_role
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved public.user_role;
begin
  select public.role_from_app_metadata(u.raw_app_meta_data)
  into resolved
  from auth.users u
  where u.id = p_user_id;

  if resolved is null then
    return null;
  end if;

  perform set_config('app.bypass_role_immutable', 'true', true);

  update public.profiles
  set
    role = resolved,
    updated_at = now()
  where id = p_user_id
    and role is distinct from resolved;

  return resolved;
end;
$$;

revoke all on function public.sync_profile_role_from_auth(uuid) from public;
revoke all on function public.sync_profile_role_from_auth(uuid) from anon, authenticated;
grant execute on function public.sync_profile_role_from_auth(uuid) to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, phone, email, full_name)
  values (
    new.id,
    public.role_from_app_metadata(new.raw_app_meta_data),
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.handle_auth_user_app_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_app_meta_data is distinct from old.raw_app_meta_data then
    perform public.sync_profile_role_from_auth(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_app_metadata_updated on auth.users;
create trigger on_auth_user_app_metadata_updated
  after update of raw_app_meta_data on auth.users
  for each row
  execute function public.handle_auth_user_app_metadata();

-- Repair existing mismatches (SALE/OWNER registered but profile stuck as GUEST).
do $$
declare
  r record;
begin
  for r in
    select u.id
    from auth.users u
    join public.profiles p on p.id = u.id
    where public.role_from_app_metadata(u.raw_app_meta_data) is distinct from p.role
  loop
    perform public.sync_profile_role_from_auth(r.id);
  end loop;
end;
$$;
