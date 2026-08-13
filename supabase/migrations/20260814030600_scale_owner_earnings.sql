-- Owner dashboard totals computed in the database.
--
-- The dashboard read every booking across every asset the owner holds and
-- summed them in Node, so past the row cap the earnings figure quietly stopped
-- growing.

-- security invoker on purpose: `bookings_select` already limits an owner to
-- bookings on their own assets, and the dashboard already ran under RLS. A
-- definer function here would let any signed-in user total up another owner's
-- earnings by passing their id.
create or replace function public.owner_earnings_summary(p_owner_id uuid)
returns table (confirmed_bookings bigint, owner_earn_total numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::bigint,
    coalesce(sum(b.owner_earn_snapshot), 0)
  from public.bookings b
  join public.assets a on a.id = b.asset_id
  where a.owner_id = p_owner_id
    and b.status in ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT');
$$;

revoke all on function public.owner_earnings_summary(uuid) from public, anon;
grant execute on function public.owner_earnings_summary(uuid) to authenticated, service_role;
