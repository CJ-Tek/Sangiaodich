-- Guest invoice links (Sale → Guest). Public page reads via service role.
create table public.guest_invoices (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  sale_id uuid not null references public.profiles (id),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  payout_bank_name_snapshot text,
  payout_account_name_snapshot text,
  payout_account_number_snapshot text,
  payout_vietqr_bank_snapshot text,
  payout_qr_image_url_snapshot text,
  created_at timestamptz not null default now()
);

create index guest_invoices_token_idx on public.guest_invoices (token);
create index guest_invoices_booking_idx on public.guest_invoices (booking_id, issued_at desc);

comment on table public.guest_invoices is
  'Shareable Guest pay links. 15-minute warning window; does not lock inventory.';

alter table public.guest_invoices enable row level security;

create policy guest_invoices_sale_select on public.guest_invoices
  for select using (
    public.current_role() = 'SALE' and sale_id = auth.uid()
  );

create policy guest_invoices_sale_insert on public.guest_invoices
  for insert with check (
    public.current_role() = 'SALE' and sale_id = auth.uid()
  );
