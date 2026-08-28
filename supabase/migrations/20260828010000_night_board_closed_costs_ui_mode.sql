-- Shared night ledger: owner-closed nights, optional per-night cost, UI mode.
-- Inventory overlap for CONFIRMED stays is unchanged (bookings_no_confirmed_overlap).

create type public.ui_mode as enum ('simple', 'expert');

alter table public.profiles
  add column ui_mode public.ui_mode not null default 'expert';

comment on column public.profiles.ui_mode is
  'Presentation only. Inventory queries must never filter on this column.';

create table public.asset_closed_nights (
  asset_id uuid not null references public.assets (id) on delete cascade,
  night date not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  primary key (asset_id, night)
);

create index asset_closed_nights_night_idx on public.asset_closed_nights (night);

comment on table public.asset_closed_nights is
  'Owner-closed nights with no guest. Does not replace CONFIRMED inventory lock.';

create table public.asset_nightly_costs (
  asset_id uuid not null references public.assets (id) on delete cascade,
  night date not null,
  cost numeric(12, 0) not null check (cost >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id),
  primary key (asset_id, night)
);

create index asset_nightly_costs_night_idx on public.asset_nightly_costs (night);

comment on table public.asset_nightly_costs is
  'Optional per-night owner cost override. Missing night uses asset_costs WD/WE.';

alter table public.asset_closed_nights enable row level security;
alter table public.asset_nightly_costs enable row level security;

create policy asset_closed_nights_select on public.asset_closed_nights
  for select using (
    public.current_role() = 'ADMIN'
    or exists (
      select 1 from public.assets a
      where a.id = asset_id and a.owner_id = auth.uid()
    )
    or (
      public.current_role() = 'SALE'
      and public.has_active_subscription(auth.uid())
    )
  );

create policy asset_closed_nights_owner_write on public.asset_closed_nights
  for all using (
    exists (
      select 1 from public.assets a
      where a.id = asset_id
        and (a.owner_id = auth.uid() or public.current_role() = 'ADMIN')
    )
  )
  with check (
    exists (
      select 1 from public.assets a
      where a.id = asset_id
        and (a.owner_id = auth.uid() or public.current_role() = 'ADMIN')
    )
  );

create policy asset_nightly_costs_select on public.asset_nightly_costs
  for select using (
    public.current_role() = 'ADMIN'
    or exists (
      select 1 from public.assets a
      where a.id = asset_id and a.owner_id = auth.uid()
    )
    or (
      public.current_role() = 'SALE'
      and public.has_active_subscription(auth.uid())
    )
  );

create policy asset_nightly_costs_owner_write on public.asset_nightly_costs
  for all using (
    exists (
      select 1 from public.assets a
      where a.id = asset_id
        and (a.owner_id = auth.uid() or public.current_role() = 'ADMIN')
    )
  )
  with check (
    exists (
      select 1 from public.assets a
      where a.id = asset_id
        and (a.owner_id = auth.uid() or public.current_role() = 'ADMIN')
    )
  );

create or replace function public.reject_booking_on_closed_nights()
returns trigger
language plpgsql
as $$
begin
  if new.status in (
    'PENDING',
    'AWAITING_OWNER',
    'CONFIRMED',
    'CHECKED_IN',
    'CHECKED_OUT'
  ) then
    if exists (
      select 1
      from public.asset_closed_nights c
      where c.asset_id = new.asset_id
        and c.night >= new.check_in
        and c.night < new.check_out
    ) then
      raise exception 'closed_night_conflict'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger bookings_reject_closed_nights
  before insert or update of check_in, check_out, status, asset_id
  on public.bookings
  for each row
  execute function public.reject_booking_on_closed_nights();

grant select, insert, update, delete on public.asset_closed_nights
  to anon, authenticated, service_role;
grant select, insert, update, delete on public.asset_nightly_costs
  to anon, authenticated, service_role;
