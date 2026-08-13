-- Leads move from fan-out to watermark.
--
-- lead_notifications grew as leads × active sales. At 200 leads a day and 5,000
-- sales that is a million rows a day, and every one of them said the same thing:
-- this lead exists. Nothing but "how far have I read" was per-sale, so that is
-- all this keeps — one row per sale — and the feed is derived at read time.

create table if not exists public.sale_lead_reads (
  sale_id uuid primary key references public.profiles (id) on delete cascade,
  seen_through timestamptz not null default '-infinity',
  updated_at timestamptz not null default now()
);

alter table public.sale_lead_reads enable row level security;

-- Reads and writes go through the RPCs below; the policy is a backstop in case
-- a future caller reaches for the table directly.
create policy sale_lead_reads_select_own on public.sale_lead_reads
  for select using (sale_id = (select auth.uid()));

-- The app never wrote read_at, so this normally carries nothing. It exists so
-- the migration is not lossy where read state does happen to be set.
insert into public.sale_lead_reads (sale_id, seen_through)
select sale_id, max(read_at)
from public.lead_notifications
where read_at is not null
group by sale_id
on conflict (sale_id) do update
  set seen_through = greatest(sale_lead_reads.seen_through, excluded.seen_through);

/**
 * Start of the membership a sale is paying for, as the instant leads become
 * visible to them.
 *
 * Renewal extends the existing subscription row and keeps its period_start, so
 * this is the start of continuous membership; lapsing and re-subscribing opens
 * a new window instead. Returns null when the caller is not a sale in good
 * standing, which empties every feed built on it.
 */
create or replace function public.sale_lead_window(p_sale_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select min(s.period_start)::timestamp at time zone 'Asia/Ho_Chi_Minh'
  from public.subscriptions s
  join public.profiles p on p.id = s.profile_id
  where s.profile_id = p_sale_id
    and p.role = 'SALE'
    and p.deleted_at is null
    and s.status = 'ACTIVE'
    and s.period_end >= public.app_today();
$$;

create or replace function public.sale_lead_feed(
  p_limit int default 50,
  p_before timestamptz default null
)
returns table (
  lead_id uuid,
  lead_created_at timestamptz,
  unread boolean,
  asset_title text,
  asset_slug text,
  asset_location text,
  guest_name text,
  guest_phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id,
    l.created_at,
    l.created_at > coalesce(r.seen_through, '-infinity'::timestamptz),
    a.title,
    a.slug,
    a.location,
    g.full_name,
    g.phone
  from public.lead_requests l
  join public.assets a on a.id = l.asset_id
  join public.profiles g on g.id = l.guest_id
  left join public.sale_lead_reads r on r.sale_id = (select auth.uid())
  where l.created_at >= public.sale_lead_window((select auth.uid()))
    and (p_before is null or l.created_at < p_before)
  order by l.created_at desc
  limit least(greatest(p_limit, 1), 200);
$$;

/**
 * Unread total, deliberately capped: a badge only needs to know whether the
 * number is past "99+", and counting an unread backlog in full would be the
 * same unbounded scan the fan-out table was hiding.
 */
create or replace function public.sale_unread_lead_count(p_cap int default 99)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from (
    select 1
    from public.lead_requests l
    left join public.sale_lead_reads r on r.sale_id = (select auth.uid())
    where l.created_at >= public.sale_lead_window((select auth.uid()))
      and l.created_at > coalesce(r.seen_through, '-infinity'::timestamptz)
    limit greatest(p_cap, 1) + 1
  ) capped;
$$;

create or replace function public.mark_leads_seen()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale uuid := auth.uid();
  v_seen timestamptz;
begin
  -- Anyone without a live sale membership has an empty feed, so there is
  -- nothing for them to have seen.
  if v_sale is null or public.sale_lead_window(v_sale) is null then
    return null;
  end if;

  insert into public.sale_lead_reads (sale_id, seen_through, updated_at)
  values (v_sale, now(), now())
  on conflict (sale_id) do update
    set seen_through = greatest(sale_lead_reads.seen_through, excluded.seen_through),
        updated_at = now()
  returning seen_through into v_seen;

  return v_seen;
end;
$$;

-- The feed hands out guest phone numbers, so it stays behind the membership
-- check inside it: callable by a signed-in user, never anonymously.
revoke all on function public.sale_lead_feed(int, timestamptz) from public, anon;
revoke all on function public.sale_unread_lead_count(int) from public, anon;
revoke all on function public.mark_leads_seen() from public, anon;
grant execute on function public.sale_lead_feed(int, timestamptz)
  to authenticated, service_role;
grant execute on function public.sale_unread_lead_count(int)
  to authenticated, service_role;
grant execute on function public.mark_leads_seen() to authenticated, service_role;

-- Only reached from inside the definer functions above, which run as owner.
revoke all on function public.sale_lead_window(uuid)
  from public, anon, authenticated;
grant execute on function public.sale_lead_window(uuid) to service_role;

drop function if exists public.fanout_lead_notifications(uuid);
drop table if exists public.lead_notifications;
