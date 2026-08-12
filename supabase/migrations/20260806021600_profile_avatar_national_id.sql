-- Sale/owner profile enrichment: avatar + national ID (CCCD)
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists national_id text;

create unique index if not exists profiles_national_id_unique
  on public.profiles (national_id)
  where national_id is not null and length(trim(national_id)) > 0;

-- Owner may read sale name/avatar for sales who booked their assets (settlements).
create policy profiles_owner_read_sale_on_own_assets on public.profiles
  for select using (
    public.current_role() = 'OWNER'
    and role = 'SALE'
    and exists (
      select 1
      from public.bookings b
      join public.assets a on a.id = b.asset_id
      where b.sale_id = profiles.id
        and a.owner_id = auth.uid()
    )
  );
