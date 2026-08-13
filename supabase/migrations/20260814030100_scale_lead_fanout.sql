-- Lead fan-out in one statement.
--
-- The previous version read every ACTIVE subscription into Node, passed up to a
-- thousand UUIDs back through `?id=in.(...)`, then upserted row by row. The read
-- was capped by db-max-rows so sales past the cap never received a lead at all,
-- and the id list outgrew the request URL long before that.

create or replace function public.fanout_lead_notifications(p_lead_id uuid)
returns bigint
language sql
security definer
set search_path = public
as $$
  with eligible as (
    select p.id
    from public.profiles p
    where p.role = 'SALE'
      and p.deleted_at is null
      and exists (
        select 1
        from public.subscriptions s
        where s.profile_id = p.id
          and s.status = 'ACTIVE'
          and s.period_end >= public.app_today()
      )
  ),
  inserted as (
    insert into public.lead_notifications (lead_id, sale_id)
    select p_lead_id, e.id from eligible e
    on conflict (lead_id, sale_id) do nothing
    returning 1
  )
  select count(*)::bigint from eligible;
$$;

comment on function public.fanout_lead_notifications(uuid) is
  'Returns how many sales were targeted. Idempotent: re-running for the same lead inserts nothing.';

revoke all on function public.fanout_lead_notifications(uuid) from public, anon, authenticated;
grant execute on function public.fanout_lead_notifications(uuid) to service_role;
