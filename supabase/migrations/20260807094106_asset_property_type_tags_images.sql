-- Property type (Villa | Căn hộ) + bedrooms/bathrooms + searchable tags
create type public.property_type as enum ('VILLA', 'APARTMENT');

alter table public.assets
  add column property_type public.property_type not null default 'VILLA',
  add column bedrooms int not null default 1,
  add column bathrooms int not null default 1,
  add column tags text[] not null default '{}';

alter table public.assets
  add constraint assets_bedrooms_positive check (bedrooms >= 0),
  add constraint assets_bathrooms_positive check (bathrooms >= 0);

create index assets_property_type_idx on public.assets (property_type);
create index assets_tags_gin_idx on public.assets using gin (tags);

comment on column public.assets.property_type is 'VILLA = villa/nhà riêng; APARTMENT = căn hộ';
comment on column public.assets.tags is 'Whitelist tags from config/asset-tags.ts (vị trí, view, đối tượng…)';
