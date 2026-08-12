-- Sale follow-up customers (manual CRM, not auto-linked to bookings)

create type public.saved_customer_channel as enum (
  'ZALO',
  'FACEBOOK',
  'PHONE',
  'OTHER'
);

create type public.saved_customer_intent as enum (
  'HOT',
  'WARM',
  'COLD'
);

create type public.saved_customer_status as enum (
  'ACTIVE',
  'CONVERTED',
  'ARCHIVED'
);

create table public.sale_saved_customers (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.profiles (id) on delete cascade,
  guest_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  phone text not null,
  channel public.saved_customer_channel not null default 'OTHER',
  intent_level public.saved_customer_intent not null default 'WARM',
  status public.saved_customer_status not null default 'ACTIVE',
  note text,
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  converted_booking_id uuid references public.bookings (id) on delete set null,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sale_saved_customers_full_name_nonempty check (length(trim(full_name)) > 0),
  constraint sale_saved_customers_phone_nonempty check (length(trim(phone)) > 0)
);

create index sale_saved_customers_sale_status_follow_idx
  on public.sale_saved_customers (sale_id, status, next_follow_up_at);

create index sale_saved_customers_sale_phone_idx
  on public.sale_saved_customers (sale_id, phone);

-- One ACTIVE saved customer per sale + phone
create unique index sale_saved_customers_sale_phone_active_uidx
  on public.sale_saved_customers (sale_id, phone)
  where status = 'ACTIVE';

alter table public.sale_saved_customers enable row level security;

create policy sale_saved_customers_sale_select on public.sale_saved_customers
  for select using (
    sale_id = auth.uid()
    or public.current_role() = 'ADMIN'
  );

create policy sale_saved_customers_sale_insert on public.sale_saved_customers
  for insert with check (
    sale_id = auth.uid()
    and public.current_role() = 'SALE'
    and public.has_active_subscription(auth.uid())
  );

create policy sale_saved_customers_sale_update on public.sale_saved_customers
  for update using (
    sale_id = auth.uid()
    or public.current_role() = 'ADMIN'
  );

create policy sale_saved_customers_sale_delete on public.sale_saved_customers
  for delete using (
    sale_id = auth.uid()
    or public.current_role() = 'ADMIN'
  );

grant select, insert, update, delete on public.sale_saved_customers
  to anon, authenticated, service_role;
