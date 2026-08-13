-- Faster ACTIVE villa lists ordered by newest first.
create index if not exists assets_status_created_at_idx
  on public.assets (status, created_at desc);

-- Last 6 hex chars of the UUID (no dashes) — sale marketplace "mã villa" search.
alter table public.assets
  add column if not exists public_code text
  generated always as (right(replace(id::text, '-', ''), 6)) stored;

create index if not exists assets_public_code_idx
  on public.assets (public_code);
