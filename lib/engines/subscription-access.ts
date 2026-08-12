import { createServiceClient } from '@/lib/supabase/server';
import { isSubscriptionActive } from '@/lib/engines/subscription';
import { todayDateOnly } from '@/lib/dates';

export type LatestSubscription = {
  status: string;
  period_start: string;
  period_end: string;
  amount: number;
} | null;

export async function getLatestSubscription(
  profileId: string
): Promise<LatestSubscription> {
  const admin = createServiceClient();
  const { data } = await admin
    .from('subscriptions')
    .select('status, period_start, period_end, amount')
    .eq('profile_id', profileId)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function profileHasActiveSubscription(
  profileId: string
): Promise<boolean> {
  const sub = await getLatestSubscription(profileId);
  if (!sub || sub.status !== 'ACTIVE') return false;
  return isSubscriptionActive({
    status: sub.status,
    periodEnd: sub.period_end,
  });
}

/** Throws if profile has no ACTIVE subscription covering today. */
export async function assertActiveSubscription(
  profileId: string
): Promise<void> {
  const active = await profileHasActiveSubscription(profileId);
  if (!active) {
    throw new Error('SUBSCRIPTION_INACTIVE');
  }
}

/** Create PENDING_PAYMENT row so Admin Users shows Mark paid target. */
export async function createPendingSubscription(input: {
  profileId: string;
  amount: number;
}) {
  const admin = createServiceClient();
  const today = todayDateOnly();
  const { error } = await admin.from('subscriptions').insert({
    profile_id: input.profileId,
    period_start: today,
    period_end: today,
    amount: input.amount,
    status: 'PENDING_PAYMENT',
  });
  if (error) throw new Error(error.message);
}
