-- Stay lifecycle after confirm: CHECKED_IN / CHECKED_OUT
-- Enum ADD VALUE must commit before the new labels are used in constraints.
alter type public.booking_status add value if not exists 'CHECKED_IN';
alter type public.booking_status add value if not exists 'CHECKED_OUT';

alter table public.bookings
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_out_at timestamptz;
