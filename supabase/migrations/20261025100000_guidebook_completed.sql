alter table public.profiles
  add column if not exists guidebook_completed text[] not null default '{}';

comment on column public.profiles.guidebook_completed is
  'Guidebook step ids the user has marked done. Empty array until they finish a step.';
