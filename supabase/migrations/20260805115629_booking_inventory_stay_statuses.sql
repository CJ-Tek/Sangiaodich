-- Inventory lock + free/busy for all post-confirm stay statuses
alter table public.bookings drop constraint if exists bookings_no_confirmed_overlap;

alter table public.bookings
  add constraint bookings_no_confirmed_overlap
  exclude using gist (
    asset_id with =,
    daterange(check_in, check_out, '[)') with &&
  )
  where (status in ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'));

create or replace function public.asset_confirmed_ranges(p_asset_id uuid)
returns table (check_in date, check_out date)
language sql
stable
security definer
set search_path = public
as $$
  select b.check_in, b.check_out
  from public.bookings b
  where b.asset_id = p_asset_id
    and b.status in ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT');
$$;
