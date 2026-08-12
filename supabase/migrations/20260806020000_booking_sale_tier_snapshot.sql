-- Snapshot sale membership tier at confirm time for owner settlement history.
alter table public.bookings
  add column if not exists sale_tier_id_snapshot uuid
    references public.sale_membership_tiers (id),
  add column if not exists sale_tier_label_snapshot text;
