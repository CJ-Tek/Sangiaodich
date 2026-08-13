-- Retention for sepay_webhook_events.
--
-- Every SePay delivery is stored with its full `raw_body jsonb` and kept
-- forever, so the table only ever grows. Processed deliveries past the window
-- are replay material, not operational data.

create index if not exists sepay_webhook_events_processed_created_at_idx
  on public.sepay_webhook_events (processed, created_at);

create or replace function public.purge_sepay_webhook_events(
  p_keep_days int default 90,
  p_batch_size int default 20000
)
returns bigint
language sql
security definer
set search_path = public
as $$
  with victims as (
    select ctid
    from public.sepay_webhook_events
    where processed = true
      and created_at < now() - make_interval(days => greatest(p_keep_days, 1))
    order by created_at
    limit greatest(p_batch_size, 1)
  ),
  deleted as (
    delete from public.sepay_webhook_events e
    using victims v
    where e.ctid = v.ctid
    returning 1
  )
  select count(*)::bigint from deleted;
$$;

comment on function public.purge_sepay_webhook_events(int, int) is
  'Deletes one bounded batch of processed deliveries so a backlog cannot hold a long lock. Unprocessed rows are a work queue and are never touched.';

revoke all on function public.purge_sepay_webhook_events(int, int)
  from public, anon, authenticated;
grant execute on function public.purge_sepay_webhook_events(int, int) to service_role;
