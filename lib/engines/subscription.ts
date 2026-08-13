import { todayDateOnly } from '@/lib/dates';

export function isSubscriptionActive(input: {
  status: string;
  periodEnd: string;
  today?: string;
}): boolean {
  // Same calendar day as public.app_today() in the database, so the UI gate and
  // the RLS gate cannot disagree during the seven hours Vietnam is ahead of UTC.
  const today = input.today ?? todayDateOnly();
  return input.status === 'ACTIVE' && input.periodEnd >= today;
}
