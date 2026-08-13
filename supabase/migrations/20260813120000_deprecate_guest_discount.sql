-- Guest tiers no longer grant a percentage discount; ranking stays.
-- Columns are kept (not dropped) so historical bookings remain readable and
-- the change can be rolled back without data loss.

comment on column public.guest_membership_tiers.discount_percent is
  'DEPRECATED (2026-08-13): guest tiers no longer discount price. No longer read or written by the app; kept for history and rollback.';

comment on column public.bookings.guest_discount_percent_snapshot is
  'DEPRECATED (2026-08-13): always written as 0 for new bookings. Older rows keep the value that was in effect, though it never changed guestPay.';
