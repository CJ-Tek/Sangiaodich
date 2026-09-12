-- Default UI mode is Đơn giản (simple) for new profiles.
alter table public.profiles
  alter column ui_mode set default 'simple';

-- Existing owner/sale accounts follow the new product default.
update public.profiles
set ui_mode = 'simple',
    updated_at = now()
where ui_mode is distinct from 'simple'
  and role in ('OWNER', 'SALE');
