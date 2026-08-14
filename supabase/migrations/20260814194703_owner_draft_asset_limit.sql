-- Keep 15 in sync with MAX_OWNER_DRAFT_ASSETS in config/asset-tags.ts
create index if not exists assets_owner_draft_idx
  on public.assets (owner_id)
  where status = 'DRAFT';

create or replace function public.enforce_owner_draft_asset_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  draft_count int;
begin
  if new.status is distinct from 'DRAFT' then
    return new;
  end if;

  -- Editing an existing draft does not consume another slot.
  if tg_op = 'UPDATE' and old.status = 'DRAFT' then
    return new;
  end if;

  select count(*) into draft_count
  from public.assets
  where owner_id = new.owner_id
    and status = 'DRAFT'
    and id is distinct from new.id;

  if draft_count >= 15 then
    raise exception 'DRAFT_LIMIT'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists assets_enforce_owner_draft_limit on public.assets;
create trigger assets_enforce_owner_draft_limit
  before insert or update of status, owner_id on public.assets
  for each row execute function public.enforce_owner_draft_asset_limit();
