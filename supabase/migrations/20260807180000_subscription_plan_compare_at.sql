-- Marketing compare-at price for subscription plan discount badges.
-- amount remains the payable / SePay exact-match price.

alter table public.subscription_plans
  add column if not exists compare_at_amount numeric(12, 0)
    check (compare_at_amount is null or compare_at_amount > 0);

comment on column public.subscription_plans.compare_at_amount is
  'Optional list/compare price for UI discount badge. Payable amount stays in amount.';
