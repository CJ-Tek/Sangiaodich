-- Seed test users + reference data for local MVP
-- Password for all: password123
-- Mock OTP code: 000000

create extension if not exists pgcrypto;

-- Fixed UUIDs for seed users
-- admin:  11111111-1111-1111-1111-111111111111
-- owner:  22222222-2222-2222-2222-222222222222
-- sale:   33333333-3333-3333-3333-333333333333
-- saleX:  33333333-3333-3333-3333-333333333334  (expired)
-- guest:  44444444-4444-4444-4444-444444444444
-- guest2: 44444444-4444-4444-4444-444444444445

-- GoTrue scans token columns into Go strings — NULL causes login 500:
-- "converting NULL to string is unsupported". Always seed empty strings.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
) values
(
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'admin@vbnb.local',
  crypt('password123', gen_salt('bf')),
  now(), '+840000000001', now(),
  '{"provider":"email","providers":["email"],"role":"ADMIN"}',
  '{"full_name":"Admin VBNB","phone":"+840000000001"}',
  now(), now(),
  '', '', '', '', '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated',
  'owner@vbnb.local',
  crypt('password123', gen_salt('bf')),
  now(), '+840000000002', now(),
  '{"provider":"email","providers":["email"],"role":"OWNER"}',
  '{"full_name":"Owner Demo","phone":"+840000000002"}',
  now(), now(),
  '', '', '', '', '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333',
  'authenticated', 'authenticated',
  'sale@vbnb.local',
  crypt('password123', gen_salt('bf')),
  now(), '+840000000003', now(),
  '{"provider":"email","providers":["email"],"role":"SALE"}',
  '{"full_name":"Sale Active","phone":"+840000000003"}',
  now(), now(),
  '', '', '', '', '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333334',
  'authenticated', 'authenticated',
  'sale-expired@vbnb.local',
  crypt('password123', gen_salt('bf')),
  now(), '+840000000013', now(),
  '{"provider":"email","providers":["email"],"role":"SALE"}',
  '{"full_name":"Sale Expired","phone":"+840000000013"}',
  now(), now(),
  '', '', '', '', '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '44444444-4444-4444-4444-444444444444',
  'authenticated', 'authenticated',
  'guest@vbnb.local',
  crypt('password123', gen_salt('bf')),
  now(), '+840000000004', now(),
  '{"provider":"email","providers":["email"],"role":"GUEST"}',
  '{"full_name":"Guest Demo","phone":"+840000000004"}',
  now(), now(),
  '', '', '', '', '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '44444444-4444-4444-4444-444444444445',
  'authenticated', 'authenticated',
  'guest2@vbnb.local',
  crypt('password123', gen_salt('bf')),
  now(), '+840000000005', now(),
  '{"provider":"email","providers":["email"],"role":"GUEST"}',
  '{"full_name":"Guest Two","phone":"+840000000005"}',
  now(), now(),
  '', '', '', '', '', '', '', ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
select
  id, id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email', id::text, now(), now(), now()
from auth.users
where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333334',
  '44444444-4444-4444-4444-444444444444',
  '44444444-4444-4444-4444-444444444445'
)
on conflict do nothing;

-- Ensure profiles (trigger may have created)
insert into public.profiles (id, role, phone, email, full_name) values
  ('11111111-1111-1111-1111-111111111111', 'ADMIN', '+840000000001', 'admin@vbnb.local', 'Admin VBNB'),
  ('22222222-2222-2222-2222-222222222222', 'OWNER', '+840000000002', 'owner@vbnb.local', 'Owner Demo'),
  ('33333333-3333-3333-3333-333333333333', 'SALE', '+840000000003', 'sale@vbnb.local', 'Sale Active'),
  ('33333333-3333-3333-3333-333333333334', 'SALE', '+840000000013', 'sale-expired@vbnb.local', 'Sale Expired'),
  ('44444444-4444-4444-4444-444444444444', 'GUEST', '+840000000004', 'guest@vbnb.local', 'Guest Demo'),
  ('44444444-4444-4444-4444-444444444445', 'GUEST', '+840000000005', 'guest2@vbnb.local', 'Guest Two')
on conflict (id) do update set
  phone = excluded.phone,
  email = excluded.email,
  full_name = excluded.full_name;

-- Temporarily disable role immutability for seed role fix if needed
-- profiles already correct from insert

insert into public.platform_fee_settings (id, owner_monthly_fee, sale_monthly_fee, updated_by)
values (1, 200000, 200000, '11111111-1111-1111-1111-111111111111')
on conflict (id) do update set
  owner_monthly_fee = 200000,
  sale_monthly_fee = 200000;

insert into public.subscriptions (profile_id, period_start, period_end, amount, status, marked_paid_by, marked_paid_at)
values
  ('22222222-2222-2222-2222-222222222222', current_date - 5, current_date + 25, 200000, 'ACTIVE', '11111111-1111-1111-1111-111111111111', now()),
  ('33333333-3333-3333-3333-333333333333', current_date - 5, current_date + 25, 200000, 'ACTIVE', '11111111-1111-1111-1111-111111111111', now()),
  ('33333333-3333-3333-3333-333333333334', current_date - 40, current_date - 10, 200000, 'EXPIRED', '11111111-1111-1111-1111-111111111111', now() - interval '40 days');

-- Legacy platform ladder (no longer used for Sale cost pricing; Owner sets
-- per-asset rules in asset_sale_discount_rules). Kept for sale_membership_states FK.
insert into public.sale_membership_tiers (
  id, sort, min_lifetime_cost_volume, min_checked_out_count, cost_discount_percent, label
) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa0', 0, 0, 0, 0, '0%'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 1, 0, 20, 3, 'Trên 20 lần'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 2, 0, 50, 5, 'Trên 50 lần')
on conflict do nothing;

insert into public.guest_membership_tiers (id, sort, min_books, min_gmv, label) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb0', 0, 0, 0, 'Tier 0'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 1, 3, 50000000, 'Tier 1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 2, 7, 150000000, 'Tier 2')
on conflict do nothing;

insert into public.sale_membership_states (sale_id, current_tier_id, lifetime_cost_volume)
values
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa0', 0),
  ('33333333-3333-3333-3333-333333333334', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa0', 0)
on conflict do nothing;

insert into public.guest_membership_states (guest_id, current_tier_id)
values
  ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb0'),
  ('44444444-4444-4444-4444-444444444445', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb0')
on conflict do nothing;

insert into public.assets (id, owner_id, slug, title, description, location, capacity, bedrooms, bathrooms, property_type, amenities, tags, status)
values
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'villa-bien-xanh',
    'Villa Biển Xanh',
    'Villa gần biển, không gian rộng, phù hợp gia đình.',
    'Hồ Tràm, BR-VT',
    8,
    4,
    3,
    'VILLA',
    '{}',
    array['near_beach', 'private_pool', 'wifi', 'air_con', 'kitchen', 'family', 'parking'],
    'ACTIVE'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'villa-doi-gio',
    'Villa Đồi Gió',
    'Villa view đồi, đang chờ duyệt.',
    'Đà Lạt',
    6,
    3,
    2,
    'VILLA',
    '{}',
    array['mountain_view', 'quiet_suburb', 'wifi', 'heater', 'couple'],
    'PENDING_REVIEW'
  );

insert into public.asset_costs (asset_id, cost_weekday, cost_weekend) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 2500000, 3200000),
  ('aaaaaaaa-0000-0000-0000-000000000002', 1800000, 2200000);

insert into public.asset_images (asset_id, url, sort_order) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200', 0),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200', 1),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', 0);

-- Extra Owner Demo listings (ids 003–012) for marketplace / owner dashboard
insert into public.assets (id, owner_id, slug, title, description, location, capacity, bedrooms, bathrooms, property_type, amenities, tags, status, rejection_reason)
values
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'villa-phu-quoc-sunset',
    'Villa Phú Quốc Sunset',
    'Villa sát biển, hồ bơi vô cực, hoàng hôn nhìn thẳng vịnh Dương Đông.',
    'Dương Đông, Phú Quốc',
    10, 5, 4, 'VILLA', '{}',
    array['beachfront','sea_view','private_pool','wifi','air_con','kitchen','family','luxury','parking'],
    'ACTIVE', null
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000004',
    '22222222-2222-2222-2222-222222222222',
    'villa-hoi-an-ancient',
    'Villa Hội An Ancient',
    'Nhà vườn phong cách phố cổ, cách chợ đêm 8 phút đi bộ.',
    'Hội An',
    8, 4, 3, 'VILLA', '{}',
    array['near_center','near_landmark','garden','wifi','air_con','kitchen','couple','local_style','self_checkin'],
    'ACTIVE', null
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000005',
    '22222222-2222-2222-2222-222222222222',
    'villa-nha-trang-bay',
    'Villa Nha Trang Bay',
    'Villa lớn view vịnh, phù hợp nhóm bạn và team building.',
    'Trần Phú, Nha Trang',
    12, 6, 5, 'VILLA', '{}',
    array['near_beach','sea_view','private_pool','bbq','wifi','sound_system','kitchen','friends','team_building','parking'],
    'ACTIVE', null
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000006',
    '22222222-2222-2222-2222-222222222222',
    'villa-sapa-terrace',
    'Villa Sapa Terrace',
    'View ruộng bậc thang, lò sưởi, yên tĩnh cho cặp đôi và remote work.',
    'Sa Pa',
    6, 3, 2, 'VILLA', '{}',
    array['mountain_view','quiet_suburb','balcony','wifi','heater','kitchen','couple','remote_work','rustic'],
    'ACTIVE', null
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000007',
    '22222222-2222-2222-2222-222222222222',
    'villa-vung-tau-ocean',
    'Villa Vũng Tàu Ocean',
    'Compound sát Bãi Sau, hồ bơi riêng, đậu xe rộng cho đoàn gia đình.',
    'Bãi Sau, Vũng Tàu',
    14, 7, 6, 'VILLA', '{}',
    array['near_beach','private_pool','bbq','wifi','air_con','kitchen','family','friends','parking','compound'],
    'ACTIVE', null
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000008',
    '22222222-2222-2222-2222-222222222222',
    'can-ho-saigon-sky',
    'Căn hộ Saigon Sky',
    'Căn hộ 2PN trung tâm Q.1, view thành phố, self check-in.',
    'Quận 1, TP.HCM',
    4, 2, 2, 'APARTMENT', '{}',
    array['in_center','city_view','balcony','wifi','air_con','washer','remote_work','minimal','self_checkin'],
    'ACTIVE', null
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000009',
    '22222222-2222-2222-2222-222222222222',
    'villa-ba-vi-forest',
    'Villa Ba Vì Forest',
    'Nháp — villa rừng thông, sân BBQ, đang bổ sung ảnh.',
    'Ba Vì, Hà Nội',
    16, 8, 6, 'VILLA', '{}',
    array['near_mountain','quiet_suburb','garden','bbq','wifi','kitchen','team_building','pet_friendly','parking'],
    'DRAFT', null
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000010',
    '22222222-2222-2222-2222-222222222222',
    'villa-can-tho-song',
    'Villa Cần Thơ Sông',
    'Bên sông Hậu, gần chợ nổi, chờ admin duyệt.',
    'Ninh Kiều, Cần Thơ',
    8, 4, 3, 'VILLA', '{}',
    array['near_lake','near_market','garden','wifi','air_con','kitchen','family','local_style','parking'],
    'PENDING_REVIEW', null
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000011',
    '22222222-2222-2222-2222-222222222222',
    'villa-mui-ne-dunes',
    'Villa Mũi Né Dunes',
    'Tạm ngưng nhận booking mùa thấp điểm.',
    'Mũi Né, Phan Thiết',
    10, 5, 4, 'VILLA', '{}',
    array['near_beach','private_pool','wifi','air_con','kitchen','family','parking'],
    'INACTIVE', null
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000012',
    '22222222-2222-2222-2222-222222222222',
    'villa-tam-dao-pine',
    'Villa Tam Đảo Pine',
    'Bị từ chối — thiếu ảnh phòng ngủ và mô tả check-in.',
    'Tam Đảo, Vĩnh Phúc',
    6, 3, 2, 'VILLA', '{}',
    array['mountain_view','quiet_suburb','wifi','heater','couple'],
    'REJECTED',
    'Thiếu ảnh phòng ngủ và hướng dẫn check-in.'
  );

insert into public.asset_costs (asset_id, cost_weekday, cost_weekend) values
  ('aaaaaaaa-0000-0000-0000-000000000003', 4500000, 5800000),
  ('aaaaaaaa-0000-0000-0000-000000000004', 2800000, 3600000),
  ('aaaaaaaa-0000-0000-0000-000000000005', 5200000, 6800000),
  ('aaaaaaaa-0000-0000-0000-000000000006', 2200000, 2900000),
  ('aaaaaaaa-0000-0000-0000-000000000007', 6000000, 7500000),
  ('aaaaaaaa-0000-0000-0000-000000000008', 1600000, 2100000),
  ('aaaaaaaa-0000-0000-0000-000000000009', 3800000, 4900000),
  ('aaaaaaaa-0000-0000-0000-000000000010', 2000000, 2600000),
  ('aaaaaaaa-0000-0000-0000-000000000011', 3200000, 4100000),
  ('aaaaaaaa-0000-0000-0000-000000000012', 1900000, 2400000);

insert into public.asset_images (asset_id, url, sort_order) values
  ('aaaaaaaa-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200', 0),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200', 1),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', 0),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200', 0),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200', 1),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200', 0),
  ('aaaaaaaa-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200', 0),
  ('aaaaaaaa-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200', 0),
  ('aaaaaaaa-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200', 0),
  ('aaaaaaaa-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?w=1200', 0),
  ('aaaaaaaa-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200', 0),
  ('aaaaaaaa-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', 0);
