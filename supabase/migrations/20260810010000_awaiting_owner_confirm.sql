-- Owner-confirm flow: AWAITING_OWNER does NOT lock inventory (same as PENDING).
alter type public.booking_status add value if not exists 'AWAITING_OWNER';

alter table public.bookings
  add column if not exists submitted_to_owner_at timestamptz,
  add column if not exists owner_confirmed_at timestamptz,
  add column if not exists owner_rejected_at timestamptz,
  add column if not exists owner_reject_reason text;

comment on column public.bookings.submitted_to_owner_at is
  'Sale sent booking to Owner for confirm (status AWAITING_OWNER)';
comment on column public.bookings.owner_confirmed_at is
  'Owner confirmed receipt / locked inventory';
