-- Guest remainder at check-in may go to Owner (Case A). Sale invoices stay SALE.

alter table public.bookings
  add column if not exists guest_paid_owner_amount numeric(12,0) not null default 0;

comment on column public.bookings.guest_paid_owner_amount is
  'Cumulative amount Guest transferred directly to Owner (≤ list − amount_collected). Distinct from owner_paid_amount (Sale → Owner).';

alter table public.guest_invoices
  add column if not exists payee text not null default 'SALE',
  add column if not exists issued_by uuid references public.profiles (id);

alter table public.guest_invoices
  drop constraint if exists guest_invoices_payee_check;

alter table public.guest_invoices
  add constraint guest_invoices_payee_check check (payee in ('SALE', 'OWNER'));

comment on column public.guest_invoices.payee is
  'Who receives the Guest transfer on this invoice link: SALE (deposit/full) or OWNER (remainder at check-in).';

drop policy if exists guest_invoices_sale_insert on public.guest_invoices;
create policy guest_invoices_sale_insert on public.guest_invoices
  for insert with check (
    public.current_role() = 'SALE'
    and sale_id = auth.uid()
    and payee = 'SALE'
  );

drop policy if exists guest_invoices_owner_select on public.guest_invoices;
create policy guest_invoices_owner_select on public.guest_invoices
  for select using (
    public.current_role() = 'OWNER'
    and payee = 'OWNER'
    and exists (
      select 1
      from public.bookings b
      join public.assets a on a.id = b.asset_id
      where b.id = guest_invoices.booking_id
        and a.owner_id = auth.uid()
    )
  );

drop policy if exists guest_invoices_owner_insert on public.guest_invoices;
create policy guest_invoices_owner_insert on public.guest_invoices
  for insert with check (
    public.current_role() = 'OWNER'
    and payee = 'OWNER'
    and issued_by = auth.uid()
    and exists (
      select 1
      from public.bookings b
      join public.assets a on a.id = b.asset_id
      where b.id = guest_invoices.booking_id
        and a.owner_id = auth.uid()
    )
  );
