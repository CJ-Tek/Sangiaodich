-- Owner rates Sale after CHECKED_OUT. Scores 1–10 on three criteria.

create table public.sale_ratings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  owner_id uuid not null references public.profiles (id),
  sale_id uuid not null references public.profiles (id),
  score_payment smallint not null,
  score_handling smallint not null,
  score_communication smallint not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sale_ratings_score_payment_range check (score_payment between 1 and 10),
  constraint sale_ratings_score_handling_range check (score_handling between 1 and 10),
  constraint sale_ratings_score_communication_range check (score_communication between 1 and 10)
);

create index sale_ratings_sale_idx on public.sale_ratings (sale_id, created_at desc);
create index sale_ratings_owner_idx on public.sale_ratings (owner_id);

create table public.sale_rating_aggregates (
  sale_id uuid primary key references public.profiles (id) on delete cascade,
  rating_count int not null default 0,
  avg_payment numeric(4,2) not null default 0,
  avg_handling numeric(4,2) not null default 0,
  avg_communication numeric(4,2) not null default 0,
  avg_overall numeric(4,2) not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.sale_ratings enable row level security;
alter table public.sale_rating_aggregates enable row level security;

create policy sale_ratings_owner_select on public.sale_ratings
  for select using ((select public.current_role()) = 'OWNER');

create policy sale_ratings_sale_select on public.sale_ratings
  for select using (
    (select public.current_role()) = 'SALE'
    and sale_id = (select auth.uid())
  );

create policy sale_ratings_admin_select on public.sale_ratings
  for select using ((select public.current_role()) = 'ADMIN');

create policy sale_ratings_owner_insert on public.sale_ratings
  for insert with check (
    (select public.current_role()) = 'OWNER'
    and owner_id = (select auth.uid())
    and exists (
      select 1
      from public.bookings b
      join public.assets a on a.id = b.asset_id
      where b.id = booking_id
        and b.status = 'CHECKED_OUT'
        and b.sale_id = sale_id
        and a.owner_id = (select auth.uid())
    )
  );

create policy sale_ratings_owner_update on public.sale_ratings
  for update using (
    (select public.current_role()) = 'OWNER'
    and owner_id = (select auth.uid())
    and created_at > now() - interval '7 days'
  )
  with check (
    owner_id = (select auth.uid())
    and created_at > now() - interval '7 days'
  );

create policy sale_rating_aggregates_owner_select on public.sale_rating_aggregates
  for select using ((select public.current_role()) = 'OWNER');

create policy sale_rating_aggregates_sale_select on public.sale_rating_aggregates
  for select using (
    (select public.current_role()) = 'SALE'
    and sale_id = (select auth.uid())
  );

create policy sale_rating_aggregates_admin_select on public.sale_rating_aggregates
  for select using ((select public.current_role()) = 'ADMIN');

create or replace function public.refresh_sale_rating_aggregate(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  select count(*) into n from public.sale_ratings where sale_id = p_sale_id;
  if coalesce(n, 0) = 0 then
    delete from public.sale_rating_aggregates where sale_id = p_sale_id;
    return;
  end if;

  insert into public.sale_rating_aggregates (
    sale_id,
    rating_count,
    avg_payment,
    avg_handling,
    avg_communication,
    avg_overall,
    updated_at
  )
  select
    p_sale_id,
    count(*)::int,
    round(avg(score_payment)::numeric, 2),
    round(avg(score_handling)::numeric, 2),
    round(avg(score_communication)::numeric, 2),
    round(avg((score_payment + score_handling + score_communication) / 3.0)::numeric, 2),
    now()
  from public.sale_ratings
  where sale_id = p_sale_id
  on conflict (sale_id) do update set
    rating_count = excluded.rating_count,
    avg_payment = excluded.avg_payment,
    avg_handling = excluded.avg_handling,
    avg_communication = excluded.avg_communication,
    avg_overall = excluded.avg_overall,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.refresh_sale_rating_aggregate(uuid)
  from public, anon, authenticated;
grant execute on function public.refresh_sale_rating_aggregate(uuid)
  to service_role;
