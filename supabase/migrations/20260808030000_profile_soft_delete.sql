-- Soft-delete / trash for profiles (no hard delete; phone/email unique retained)
alter table public.profiles
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles (id),
  add column if not exists delete_reason text;

create index if not exists profiles_deleted_at_idx
  on public.profiles (deleted_at);

create index if not exists profiles_role_deleted_at_idx
  on public.profiles (role, deleted_at);
