-- Subscription plans (Admin-priced) + SePay payment intents / webhook audit

create type public.subscription_plan_role as enum ('OWNER', 'SALE');

create type public.subscription_payment_intent_status as enum (
  'PENDING',
  'PAID',
  'EXPIRED',
  'CANCELLED',
  'AMOUNT_MISMATCH'
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  role public.subscription_plan_role not null,
  months int not null check (months in (1, 3, 6, 12)),
  amount numeric(12, 0) not null check (amount > 0),
  label text not null default '',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role, months)
);

create table public.subscription_payment_intents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  payment_code text not null,
  amount numeric(12, 0) not null check (amount > 0),
  months int not null check (months in (1, 3, 6, 12)),
  status public.subscription_payment_intent_status not null default 'PENDING',
  expires_at timestamptz not null,
  paid_at timestamptz,
  sepay_transaction_id text,
  sepay_reference_code text,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  mismatch_amount numeric(12, 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payment_code)
);

create unique index subscription_payment_intents_sepay_tx_uidx
  on public.subscription_payment_intents (sepay_transaction_id)
  where sepay_transaction_id is not null;

create index subscription_payment_intents_profile_status_idx
  on public.subscription_payment_intents (profile_id, status);

create table public.sepay_webhook_events (
  id uuid primary key default gen_random_uuid(),
  sepay_id text not null unique,
  source text not null default 'bank_webhook',
  transfer_type text,
  transfer_amount numeric(12, 0),
  payment_code text,
  reference_code text,
  account_number text,
  raw_body jsonb not null,
  processed boolean not null default false,
  process_note text,
  created_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists plan_id uuid references public.subscription_plans (id) on delete set null,
  add column if not exists payment_intent_id uuid references public.subscription_payment_intents (id) on delete set null,
  add column if not exists activation_source text;

alter table public.platform_fee_settings
  add column if not exists payment_vietqr_bank text;

alter table public.subscription_plans enable row level security;
alter table public.subscription_payment_intents enable row level security;
alter table public.sepay_webhook_events enable row level security;

create policy subscription_plans_read on public.subscription_plans
  for select using (true);

create policy subscription_payment_intents_select_own on public.subscription_payment_intents
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'ADMIN'
    )
  );

-- Writes go through service role / API only (no insert/update policies for anon/auth)

-- Seed default plans (linear from 200k/month; Admin can edit)
insert into public.subscription_plans (role, months, amount, label, sort_order) values
  ('OWNER', 1, 200000, '1 tháng', 1),
  ('OWNER', 3, 600000, '3 tháng', 2),
  ('OWNER', 6, 1200000, '6 tháng', 3),
  ('OWNER', 12, 2400000, '1 năm', 4),
  ('SALE', 1, 200000, '1 tháng', 1),
  ('SALE', 3, 600000, '3 tháng', 2),
  ('SALE', 6, 1200000, '6 tháng', 3),
  ('SALE', 12, 2400000, '1 năm', 4)
on conflict (role, months) do nothing;
