-- Sale cost discount is per (sale, asset) checkout count, not lifetime volume.
-- Comparison in the app is count > min_checked_out_count (e.g. 21 unlocks 3%).

alter table public.sale_membership_tiers
  add column if not exists min_checked_out_count int not null default 0;

comment on column public.sale_membership_tiers.min_checked_out_count is
  'Discount applies when CHECKED_OUT count for that sale+asset is strictly greater than this value.';

-- Existing rows: sort 0 → 0/0%, sort 1 → 20/3%, sort 2+ → 50/5%.
update public.sale_membership_tiers
set
  min_checked_out_count = 0,
  cost_discount_percent = 0
where sort = 0;

update public.sale_membership_tiers
set
  min_checked_out_count = 20,
  cost_discount_percent = 3
where sort = 1;

update public.sale_membership_tiers
set
  min_checked_out_count = 50,
  cost_discount_percent = 5
where sort >= 2;

create or replace function public.sale_asset_checkout_count(
  p_sale_id uuid,
  p_asset_id uuid
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.bookings
  where sale_id = p_sale_id
    and asset_id = p_asset_id
    and status = 'CHECKED_OUT';
$$;

revoke all on function public.sale_asset_checkout_count(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.sale_asset_checkout_count(uuid, uuid)
  to service_role;

create or replace function public.sale_asset_checkout_counts(
  p_sale_id uuid,
  p_asset_ids uuid[]
)
returns table (asset_id uuid, checkout_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select a.asset_id, coalesce(c.cnt, 0)::bigint as checkout_count
  from unnest(coalesce(p_asset_ids, '{}'::uuid[])) as a(asset_id)
  left join (
    select b.asset_id, count(*)::bigint as cnt
    from public.bookings b
    where b.sale_id = p_sale_id
      and b.status = 'CHECKED_OUT'
      and b.asset_id = any (coalesce(p_asset_ids, '{}'::uuid[]))
    group by b.asset_id
  ) c on c.asset_id = a.asset_id;
$$;

revoke all on function public.sale_asset_checkout_counts(uuid, uuid[])
  from public, anon, authenticated;
grant execute on function public.sale_asset_checkout_counts(uuid, uuid[])
  to service_role;

create or replace function public.sale_checkout_progress(p_sale_id uuid)
returns table (asset_id uuid, checkout_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select b.asset_id, count(*)::bigint as checkout_count
  from public.bookings b
  where b.sale_id = p_sale_id
    and b.status = 'CHECKED_OUT'
  group by b.asset_id;
$$;

revoke all on function public.sale_checkout_progress(uuid)
  from public, anon, authenticated;
grant execute on function public.sale_checkout_progress(uuid) to service_role;
