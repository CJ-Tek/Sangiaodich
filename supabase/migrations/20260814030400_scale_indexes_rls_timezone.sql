-- Missing indexes, cheaper RLS on profiles, one timezone.

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- audit_logs had no index at all beyond its primary key, and the admin
-- dashboard filters it by action.
create index if not exists audit_logs_action_created_at_idx
  on public.audit_logs (action, created_at);

create index if not exists subscription_payment_intents_status_paid_at_idx
  on public.subscription_payment_intents (status, paid_at);

-- Every RLS check on assets, bookings and profiles runs
-- has_active_subscription for the current user.
create index if not exists subscriptions_active_lookup_idx
  on public.subscriptions (profile_id, period_end desc)
  where status = 'ACTIVE';

create index if not exists subscriptions_status_period_idx
  on public.subscriptions (status, period_end);

-- The unprocessed queue is a handful of rows in a table of raw jsonb bodies.
create index if not exists sepay_webhook_events_unprocessed_idx
  on public.sepay_webhook_events (created_at desc)
  where processed = false;

create index if not exists profiles_role_created_at_idx
  on public.profiles (role, created_at desc)
  where deleted_at is null;

-- Registration looks up profiles by email on every attempt. Uniqueness is only
-- enforced when the data already allows it — this migration must not fail on an
-- existing duplicate.
do $$
begin
  if exists (
    select 1
    from public.profiles
    where email is not null and length(trim(email)) > 0
    group by lower(email)
    having count(*) > 1
  ) then
    raise warning 'profiles.email holds duplicates — creating a non-unique index instead';
    create index if not exists profiles_email_lower_idx
      on public.profiles (lower(email))
      where email is not null and length(trim(email)) > 0;
  else
    create unique index if not exists profiles_email_lower_uidx
      on public.profiles (lower(email))
      where email is not null and length(trim(email)) > 0;
  end if;
end;
$$;

-- Admin user search filters each column separately with `ilike '%q%'`, so the
-- indexes have to be per column for the planner to reach them.
create extension if not exists pg_trgm with schema extensions;

create index if not exists profiles_full_name_trgm_idx
  on public.profiles using gin (full_name extensions.gin_trgm_ops);

create index if not exists profiles_phone_trgm_idx
  on public.profiles using gin (phone extensions.gin_trgm_ops);

create index if not exists profiles_email_trgm_idx
  on public.profiles using gin (email extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- RLS: hoist function calls into InitPlans
-- ---------------------------------------------------------------------------
-- `auth.uid()` and `current_role()` written bare are re-evaluated for every
-- candidate row. Wrapped in a scalar sub-select Postgres runs them once per
-- statement. The predicates below are unchanged in every other respect.

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select using (
    id = (select auth.uid())
    or (select public.current_role()) = 'ADMIN'
    or (
      (select public.current_role()) = 'SALE'
      and (select public.has_active_subscription((select auth.uid())))
      and role = 'GUEST'
    )
  );

drop policy if exists profiles_owner_read_sale_on_own_assets on public.profiles;
create policy profiles_owner_read_sale_on_own_assets on public.profiles
  for select using (
    (select public.current_role()) = 'OWNER'
    and role = 'SALE'
    and exists (
      select 1
      from public.bookings b
      join public.assets a on a.id = b.asset_id
      where b.sale_id = profiles.id
        and a.owner_id = (select auth.uid())
    )
  );

drop policy if exists profiles_sale_read_owner_on_booked_assets on public.profiles;
create policy profiles_sale_read_owner_on_booked_assets on public.profiles
  for select using (
    (select public.current_role()) = 'SALE'
    and role = 'OWNER'
    and exists (
      select 1
      from public.bookings b
      join public.assets a on a.id = b.asset_id
      where b.sale_id = (select auth.uid())
        and a.owner_id = profiles.id
    )
  );

drop policy if exists profiles_guest_read_sale_on_own_bookings on public.profiles;
create policy profiles_guest_read_sale_on_own_bookings on public.profiles
  for select using (
    (select public.current_role()) = 'GUEST'
    and role = 'SALE'
    and exists (
      select 1
      from public.bookings b
      where b.sale_id = profiles.id
        and b.guest_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Timezone
-- ---------------------------------------------------------------------------
-- `current_date` is UTC, so between 00:00 and 07:00 Vietnam time the database
-- considered a subscription expired a day before the app did — or the reverse.
-- The change can only expire access earlier, never widen it.

create or replace function public.has_active_subscription(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.profile_id = p_profile_id
      and s.status = 'ACTIVE'
      and s.period_end >= public.app_today()
  );
$$;
