-- VBNB initial schema
create extension if not exists btree_gist;
create extension if not exists pgcrypto;

create type public.user_role as enum ('ADMIN', 'OWNER', 'SALE', 'GUEST');
create type public.asset_status as enum (
  'DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'INACTIVE', 'SUSPENDED'
);
create type public.booking_status as enum (
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED'
);
create type public.subscription_status as enum ('ACTIVE', 'EXPIRED', 'PENDING_PAYMENT');
create type public.lead_status as enum ('OPEN', 'CLOSED');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  phone text unique,
  email text,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_fee_settings (
  id int primary key default 1 check (id = 1),
  owner_monthly_fee numeric(12,0) not null default 200000,
  sale_monthly_fee numeric(12,0) not null default 200000,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount numeric(12,0) not null,
  status public.subscription_status not null default 'PENDING_PAYMENT',
  marked_paid_by uuid references public.profiles (id),
  marked_paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index subscriptions_profile_idx on public.subscriptions (profile_id, status);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null default '',
  location text not null default '',
  capacity int not null default 2,
  amenities text[] not null default '{}',
  status public.asset_status not null default 'DRAFT',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_status_idx on public.assets (status);
create index assets_owner_idx on public.assets (owner_id);

create table public.asset_images (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.asset_costs (
  asset_id uuid primary key references public.assets (id) on delete cascade,
  cost_weekday numeric(12,0) not null,
  cost_weekend numeric(12,0) not null,
  updated_at timestamptz not null default now()
);

create table public.sale_price_templates (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.profiles (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete cascade,
  price_weekday numeric(12,0) not null,
  price_weekend numeric(12,0) not null,
  unique (sale_id, asset_id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete restrict,
  sale_id uuid not null references public.profiles (id) on delete restrict,
  guest_id uuid not null references public.profiles (id) on delete restrict,
  status public.booking_status not null default 'PENDING',
  check_in date not null,
  check_out date not null,
  list_price numeric(12,0) not null,
  amount_collected numeric(12,0),
  base_cost_snapshot numeric(12,0),
  effective_cost_snapshot numeric(12,0),
  list_price_snapshot numeric(12,0),
  sale_discount_percent_snapshot numeric(5,2),
  guest_discount_percent_snapshot numeric(5,2),
  owner_earn_snapshot numeric(12,0),
  sale_margin_snapshot numeric(12,0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  cancelled_at timestamptz,
  constraint bookings_dates_valid check (check_out > check_in)
);

create index bookings_asset_dates_idx on public.bookings (asset_id, check_in, check_out);
create index bookings_sale_idx on public.bookings (sale_id);
create index bookings_guest_idx on public.bookings (guest_id);

-- Post-confirm stay statuses keep inventory locked
alter table public.bookings
  add constraint bookings_no_confirmed_overlap
  exclude using gist (
    asset_id with =,
    daterange(check_in, check_out, '[)') with &&
  )
  where (status in ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'));

create table public.lead_requests (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  guest_id uuid not null references public.profiles (id) on delete cascade,
  status public.lead_status not null default 'OPEN',
  created_at timestamptz not null default now()
);

create index lead_requests_created_idx on public.lead_requests (created_at desc);

create table public.lead_notifications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead_requests (id) on delete cascade,
  sale_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (lead_id, sale_id)
);

create index lead_notifications_sale_idx on public.lead_notifications (sale_id, created_at desc);

create table public.sale_membership_tiers (
  id uuid primary key default gen_random_uuid(),
  sort int not null,
  min_lifetime_cost_volume numeric(14,0) not null,
  cost_discount_percent numeric(5,2) not null default 0,
  label text not null default ''
);

create table public.sale_membership_states (
  sale_id uuid primary key references public.profiles (id) on delete cascade,
  current_tier_id uuid references public.sale_membership_tiers (id),
  lifetime_cost_volume numeric(14,0) not null default 0,
  updated_at timestamptz not null default now()
);

create table public.guest_membership_tiers (
  id uuid primary key default gen_random_uuid(),
  sort int not null,
  min_books int not null default 0,
  min_gmv numeric(14,0) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  label text not null default ''
);

create table public.guest_membership_states (
  guest_id uuid primary key references public.profiles (id) on delete cascade,
  current_tier_id uuid references public.guest_membership_tiers (id),
  progress_books int not null default 0,
  progress_gmv numeric(14,0) not null default 0,
  lifetime_books int not null default 0,
  lifetime_gmv numeric(14,0) not null default 0,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.dev_otp_codes (
  phone text primary key,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Helpers
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

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
      and s.period_end >= current_date
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, phone, email, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'GUEST'),
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent clients from changing role
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Role is immutable';
  end if;
  return new;
end;
$$;

create trigger profiles_role_immutable
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- RLS
alter table public.profiles enable row level security;
alter table public.platform_fee_settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.assets enable row level security;
alter table public.asset_images enable row level security;
alter table public.asset_costs enable row level security;
alter table public.sale_price_templates enable row level security;
alter table public.bookings enable row level security;
alter table public.lead_requests enable row level security;
alter table public.lead_notifications enable row level security;
alter table public.sale_membership_tiers enable row level security;
alter table public.sale_membership_states enable row level security;
alter table public.guest_membership_tiers enable row level security;
alter table public.guest_membership_states enable row level security;
alter table public.audit_logs enable row level security;
alter table public.dev_otp_codes enable row level security;

-- profiles
create policy profiles_select_own_or_admin on public.profiles
  for select using (
    id = auth.uid()
    or public.current_role() = 'ADMIN'
    or (
      public.current_role() = 'SALE'
      and public.has_active_subscription(auth.uid())
      and role = 'GUEST'
    )
  );

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid());

-- fees: anyone authenticated can read; admin write via service role / server
create policy fee_settings_read on public.platform_fee_settings
  for select using (true);

-- subscriptions
create policy subscriptions_select on public.subscriptions
  for select using (
    profile_id = auth.uid() or public.current_role() = 'ADMIN'
  );

-- assets public ACTIVE metadata
create policy assets_public_active on public.assets
  for select using (
    status = 'ACTIVE'
    or owner_id = auth.uid()
    or public.current_role() = 'ADMIN'
    or (
      public.current_role() = 'SALE'
      and public.has_active_subscription(auth.uid())
    )
  );

create policy assets_owner_insert on public.assets
  for insert with check (
    owner_id = auth.uid() and public.current_role() = 'OWNER'
  );

create policy assets_owner_update on public.assets
  for update using (
    owner_id = auth.uid() or public.current_role() = 'ADMIN'
  );

-- images follow asset visibility
create policy asset_images_select on public.asset_images
  for select using (
    exists (
      select 1 from public.assets a
      where a.id = asset_id
        and (
          a.status = 'ACTIVE'
          or a.owner_id = auth.uid()
          or public.current_role() = 'ADMIN'
          or (public.current_role() = 'SALE' and public.has_active_subscription(auth.uid()))
        )
    )
  );

create policy asset_images_owner_write on public.asset_images
  for all using (
    exists (
      select 1 from public.assets a
      where a.id = asset_id and (a.owner_id = auth.uid() or public.current_role() = 'ADMIN')
    )
  );

-- costs: never for guest; sale needs active sub; owner own; admin
create policy asset_costs_select on public.asset_costs
  for select using (
    public.current_role() = 'ADMIN'
    or exists (select 1 from public.assets a where a.id = asset_id and a.owner_id = auth.uid())
    or (
      public.current_role() = 'SALE'
      and public.has_active_subscription(auth.uid())
    )
  );

create policy asset_costs_owner_write on public.asset_costs
  for all using (
    exists (
      select 1 from public.assets a
      where a.id = asset_id and (a.owner_id = auth.uid() or public.current_role() = 'ADMIN')
    )
  );

-- sale price templates
create policy sale_templates_own on public.sale_price_templates
  for all using (sale_id = auth.uid());

-- bookings
create policy bookings_select on public.bookings
  for select using (
    guest_id = auth.uid()
    or sale_id = auth.uid()
    or public.current_role() = 'ADMIN'
    or exists (
      select 1 from public.assets a
      where a.id = asset_id and a.owner_id = auth.uid()
    )
  );

create policy bookings_sale_insert on public.bookings
  for insert with check (
    sale_id = auth.uid()
    and public.current_role() = 'SALE'
    and public.has_active_subscription(auth.uid())
  );

create policy bookings_sale_update on public.bookings
  for update using (
    sale_id = auth.uid() or public.current_role() = 'ADMIN'
  );

-- Public free/busy: dates only (locked stay statuses). No price/PII columns.
create or replace function public.asset_confirmed_ranges(p_asset_id uuid)
returns table (check_in date, check_out date)
language sql
stable
security definer
set search_path = public
as $$
  select b.check_in, b.check_out
  from public.bookings b
  where b.asset_id = p_asset_id
    and b.status in ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT');
$$;

grant execute on function public.asset_confirmed_ranges(uuid) to anon, authenticated;

-- API roles need table privileges; RLS still enforces row access.
-- Without these, PostgREST returns 403 (permission denied) even for service_role.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;
grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;
grant execute on all functions in schema public
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables
  to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences
  to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions
  to anon, authenticated, service_role;

-- leads
create policy lead_requests_guest_insert on public.lead_requests
  for insert with check (
    guest_id = auth.uid() and public.current_role() = 'GUEST'
  );

create policy lead_requests_select on public.lead_requests
  for select using (
    guest_id = auth.uid()
    or public.current_role() = 'ADMIN'
    or (
      public.current_role() = 'SALE'
      and public.has_active_subscription(auth.uid())
    )
  );

create policy lead_notifications_sale on public.lead_notifications
  for select using (
    sale_id = auth.uid() or public.current_role() = 'ADMIN'
  );

-- membership tiers readable by authenticated
create policy sale_tiers_read on public.sale_membership_tiers for select using (true);
create policy guest_tiers_read on public.guest_membership_tiers for select using (true);

create policy sale_membership_state_select on public.sale_membership_states
  for select using (sale_id = auth.uid() or public.current_role() = 'ADMIN');

create policy guest_membership_state_select on public.guest_membership_states
  for select using (guest_id = auth.uid() or public.current_role() = 'ADMIN');

create policy audit_admin_select on public.audit_logs
  for select using (public.current_role() = 'ADMIN');

-- Storage bucket for asset images (public read of objects)
insert into storage.buckets (id, name, public)
values ('asset-images', 'asset-images', true)
on conflict (id) do nothing;

create policy asset_images_storage_public_read on storage.objects
  for select using (bucket_id = 'asset-images');

create policy asset_images_storage_owner_upload on storage.objects
  for insert with check (
    bucket_id = 'asset-images'
    and auth.role() = 'authenticated'
  );
