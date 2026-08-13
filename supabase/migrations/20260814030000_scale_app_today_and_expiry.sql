-- App calendar day + set-based subscription expiry.
--
-- `current_date` follows the database timezone (UTC) while the app decides
-- "today" in Asia/Ho_Chi_Minh (lib/dates.ts), so between 00:00 and 07:00 local
-- the two disagree on which day it is. One helper now answers for both.

create or replace function public.app_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Ho_Chi_Minh')::date;
$$;

comment on function public.app_today() is
  'Calendar day in the app timezone (Asia/Ho_Chi_Minh) — mirrors todayDateOnly() in lib/dates.ts';

-- The cron route used to read expired rows into Node and update them one by
-- one. PostgREST caps that read at db-max-rows, so subscriptions past the cap
-- stayed ACTIVE forever, and the per-row round trips ran the function out of
-- time. Both updates now happen in a single statement.
create or replace function public.expire_due_subscriptions()
returns table (expired_subscriptions bigint, suspended_assets bigint)
language sql
security definer
set search_path = public
as $$
  with due as (
    update public.subscriptions s
       set status = 'EXPIRED'
     where s.status = 'ACTIVE'
       and s.period_end < public.app_today()
    returning s.profile_id
  ),
  expired_owners as (
    select distinct d.profile_id
    from due d
    join public.profiles p on p.id = d.profile_id
    where p.role = 'OWNER'
  ),
  suspended as (
    update public.assets a
       set status = 'SUSPENDED',
           updated_at = now()
     where a.status = 'ACTIVE'
       and a.owner_id in (select profile_id from expired_owners)
    returning a.id
  )
  select
    (select count(*) from due)::bigint,
    (select count(*) from suspended)::bigint;
$$;

revoke all on function public.expire_due_subscriptions() from public, anon, authenticated;
grant execute on function public.expire_due_subscriptions() to service_role;
