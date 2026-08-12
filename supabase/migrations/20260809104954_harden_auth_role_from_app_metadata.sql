-- Role must come from app_metadata (service-role only), never user_metadata
-- (user-editable via public signup / Auth API). Default remains GUEST.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
  resolved_role public.user_role;
begin
  meta_role := new.raw_app_meta_data->>'role';
  if meta_role in ('GUEST', 'SALE', 'OWNER', 'ADMIN') then
    resolved_role := meta_role::public.user_role;
  else
    resolved_role := 'GUEST';
  end if;

  insert into public.profiles (id, role, phone, email, full_name)
  values (
    new.id,
    resolved_role,
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
