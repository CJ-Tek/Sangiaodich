-- Guest may read the name/phone/avatar of sales who handled their own bookings.
-- Needed by the guest booking detail page: profiles_select_own_or_admin only
-- covers self, ADMIN, and SALE reading GUEST.
create policy profiles_guest_read_sale_on_own_bookings on public.profiles
  for select using (
    public.current_role() = 'GUEST'
    and role = 'SALE'
    and exists (
      select 1
      from public.bookings b
      where b.sale_id = profiles.id
        and b.guest_id = auth.uid()
    )
  );
