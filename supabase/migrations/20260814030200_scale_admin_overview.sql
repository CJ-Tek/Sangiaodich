-- Admin dashboard totals computed in the database.
--
-- The previous version pulled every profile, subscription, paid intent and
-- mark_paid audit row into Node and summed them there. db-max-rows silently
-- truncated all four reads, and the intent query had no ORDER BY, so reported
-- revenue stopped growing past the cap and could differ between page loads.

create or replace function public.admin_overview_counts(
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  guests bigint,
  owners bigint,
  sales bigint,
  active_paid_users bigint,
  revenue_all numeric,
  revenue_month numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with alive as (
    select id, role from public.profiles where deleted_at is null
  ),
  paid as (
    select
      coalesce(sum(amount), 0) as all_time,
      coalesce(
        sum(amount) filter (where paid_at >= p_start and paid_at < p_end), 0
      ) as month
    from public.subscription_payment_intents
    where status = 'PAID'
  ),
  marked as (
    -- A non-numeric payload would abort the whole report on cast, where the
    -- Node version scored it as zero. Keep that behaviour.
    select
      coalesce(sum(amount), 0) as all_time,
      coalesce(
        sum(amount) filter (where created_at >= p_start and created_at < p_end), 0
      ) as month
    from (
      select
        created_at,
        case
          when payload->>'amount' ~ '^-?[0-9]+(\.[0-9]+)?$'
          then (payload->>'amount')::numeric
          else 0
        end as amount
      from public.audit_logs
      where action = 'mark_paid'
    ) scored
  )
  select
    (select count(*) from alive where role = 'GUEST')::bigint,
    (select count(*) from alive where role = 'OWNER')::bigint,
    (select count(*) from alive where role = 'SALE')::bigint,
    (
      select count(*)
      from alive a
      where a.role in ('OWNER', 'SALE')
        and exists (
          select 1
          from public.subscriptions s
          where s.profile_id = a.id
            and s.status = 'ACTIVE'
            and s.period_end >= public.app_today()
        )
    )::bigint,
    (select all_time from paid) + (select all_time from marked),
    (select month from paid) + (select month from marked);
$$;

comment on function public.admin_overview_counts(timestamptz, timestamptz) is
  'Revenue sums two disjoint sources: SePay paid intents and admin mark_paid audit rows.';

-- security definer over revenue figures — service role only.
revoke all on function public.admin_overview_counts(timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.admin_overview_counts(timestamptz, timestamptz)
  to service_role;
