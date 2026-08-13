-- Sale lifetime volume summed in the database.
--
-- The cancel path rebuilds membership from history and writes the result over
-- the incrementally maintained value. Reading that history through PostgREST
-- capped it at db-max-rows, so one cancellation could overwrite a correct
-- lifetime volume with a truncated one and demote the sale.
--
-- Guest membership deliberately stays in TypeScript: ranking up consumes
-- progress, so it is a sequential replay rather than a sum and the rule must
-- not be duplicated across two languages.

create or replace function public.sale_membership_volume(p_sale_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(base_cost_snapshot), 0)
  from public.bookings
  where sale_id = p_sale_id
    and status in ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT');
$$;

revoke all on function public.sale_membership_volume(uuid) from public, anon, authenticated;
grant execute on function public.sale_membership_volume(uuid) to service_role;
