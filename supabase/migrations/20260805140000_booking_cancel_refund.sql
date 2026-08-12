-- Offline deposit refund ledger on guest/sale cancel (Firm-style policy)
alter table public.bookings
  add column if not exists refund_amount numeric(12,0),
  add column if not exists refund_kept_amount numeric(12,0),
  add column if not exists refund_percent numeric(5,2),
  add column if not exists cancellation_policy text,
  add column if not exists cancel_reason text;

comment on column public.bookings.refund_amount is 'Amount sale should return to guest (offline)';
comment on column public.bookings.refund_kept_amount is 'Deposit retained per policy / goodwill';
comment on column public.bookings.refund_percent is 'Refund percent applied at cancel time';
comment on column public.bookings.cancellation_policy is 'Policy code snapshot e.g. FIRM';
comment on column public.bookings.cancel_reason is 'POLICY | GOODWILL';
