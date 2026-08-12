-- Singleton payment/fee settings row — required by Admin Fees save (update_fees).
-- Migrations alone did not insert id=1; seed may be skipped on some environments.
insert into public.platform_fee_settings (id, owner_monthly_fee, sale_monthly_fee)
values (1, 200000, 200000)
on conflict (id) do nothing;
