-- Platform offline payment instructions (shown on Owner/Sale subscription)
alter table public.platform_fee_settings
  add column if not exists payment_bank_name text,
  add column if not exists payment_account_name text,
  add column if not exists payment_account_number text,
  add column if not exists payment_qr_image_url text,
  add column if not exists payment_transfer_note text,
  add column if not exists payment_contact text;
