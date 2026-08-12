-- Owner bank payout (Sale → Owner) + booking payout tracking
alter table public.profiles
  add column if not exists payout_bank_name text,
  add column if not exists payout_account_name text,
  add column if not exists payout_account_number text,
  add column if not exists payout_vietqr_bank text,
  add column if not exists payout_qr_image_url text,
  add column if not exists payout_note text;

alter table public.bookings
  add column if not exists owner_paid_amount numeric(12,0) not null default 0,
  add column if not exists owner_paid_at timestamptz,
  add column if not exists owner_payout_bank_name_snapshot text,
  add column if not exists owner_payout_account_name_snapshot text,
  add column if not exists owner_payout_account_number_snapshot text;

comment on column public.profiles.payout_account_number is
  'Owner receiving STK — applies to all assets of this owner';
comment on column public.bookings.owner_paid_amount is
  'Cumulative amount Sale marked as transferred to Owner (≤ owner_earn_snapshot)';

-- Sale may read owner contact + payout for owners of assets they booked.
create policy profiles_sale_read_owner_on_booked_assets on public.profiles
  for select using (
    public.current_role() = 'SALE'
    and role = 'OWNER'
    and exists (
      select 1
      from public.bookings b
      join public.assets a on a.id = b.asset_id
      where b.sale_id = auth.uid()
        and a.owner_id = profiles.id
    )
  );
