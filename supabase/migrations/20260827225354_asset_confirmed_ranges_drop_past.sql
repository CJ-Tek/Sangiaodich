-- Public free/busy calendars should not paint historical occupancy.
-- Inventory overlap still locks CHECKED_OUT rows (exclusion constraint);
-- this RPC only drops stays whose last night is already before app_today().

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
    and b.status in ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
    and b.check_out >= public.app_today();
$$;

comment on function public.asset_confirmed_ranges(uuid) is
  'Public free/busy: locked stays whose check_out is today or later (Asia/Ho_Chi_Minh).';
