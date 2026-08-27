-- Owner-set Sale cost discount ladder per asset.
-- Empty table = 0%. App compares checkout count > min_checked_out_count.

create table public.asset_sale_discount_rules (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  sort int not null default 0,
  min_checked_out_count int not null,
  cost_discount_percent numeric(5,2) not null,
  created_at timestamptz not null default now(),
  unique (asset_id, min_checked_out_count),
  constraint asset_sale_discount_min_count
    check (min_checked_out_count >= 0),
  constraint asset_sale_discount_percent_range
    check (cost_discount_percent >= 0 and cost_discount_percent <= 100)
);

create index asset_sale_discount_rules_asset_idx
  on public.asset_sale_discount_rules (asset_id, sort);

alter table public.asset_sale_discount_rules enable row level security;

create policy asset_sale_discount_rules_select on public.asset_sale_discount_rules
  for select using (
    public.current_role() = 'ADMIN'
    or exists (
      select 1 from public.assets a
      where a.id = asset_id and a.owner_id = auth.uid()
    )
    or (
      public.current_role() = 'SALE'
      and public.has_active_subscription(auth.uid())
    )
  );

create policy asset_sale_discount_rules_owner_write on public.asset_sale_discount_rules
  for all using (
    exists (
      select 1 from public.assets a
      where a.id = asset_id
        and (a.owner_id = auth.uid() or public.current_role() = 'ADMIN')
    )
  )
  with check (
    exists (
      select 1 from public.assets a
      where a.id = asset_id
        and (a.owner_id = auth.uid() or public.current_role() = 'ADMIN')
    )
  );
