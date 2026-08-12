import { createServiceClient } from '@/lib/supabase/server';
import { addCalendarMonths, todayDateOnly } from '@/lib/dates';
import { isSubscriptionActive } from '@/lib/engines/subscription';

export type ActivationSource = 'admin' | 'sepay_webhook' | 'sepay_ipn';

export type ActivateSubscriptionInput = {
  profileId: string;
  months: number;
  amount: number;
  planId?: string | null;
  paymentIntentId?: string | null;
  source: ActivationSource;
  markedPaidBy?: string | null;
};

export type ActivateSubscriptionResult = {
  subscriptionId: string;
  periodStart: string;
  periodEnd: string;
  extended: boolean;
};

/**
 * Activate or extend subscription by calendar months.
 * If currently ACTIVE and period_end >= today → extend from period_end.
 * Otherwise start from today.
 */
export async function activateSubscription(
  input: ActivateSubscriptionInput
): Promise<ActivateSubscriptionResult> {
  const admin = createServiceClient();
  const today = todayDateOnly();

  const { data: latest } = await admin
    .from('subscriptions')
    .select('id, status, period_start, period_end')
    .eq('profile_id', input.profileId)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  const canExtend =
    latest &&
    latest.status === 'ACTIVE' &&
    isSubscriptionActive({
      status: latest.status,
      periodEnd: latest.period_end,
      today,
    });

  const periodStart = canExtend ? latest.period_start : today;
  const baseEnd = canExtend ? latest.period_end : today;
  const periodEnd = addCalendarMonths(baseEnd, input.months);

  if (canExtend && latest) {
    const { data, error } = await admin
      .from('subscriptions')
      .update({
        period_end: periodEnd,
        amount: input.amount,
        plan_id: input.planId ?? null,
        payment_intent_id: input.paymentIntentId ?? null,
        activation_source: input.source,
        marked_paid_by: input.markedPaidBy ?? null,
        marked_paid_at: new Date().toISOString(),
      })
      .eq('id', latest.id)
      .select('id')
      .single();
    if (error) throw new Error(error.message);

    await reactivateOwnerAssets(input.profileId);
    await closePendingPaymentRows(input.profileId, latest.id);

    return {
      subscriptionId: data.id,
      periodStart,
      periodEnd,
      extended: true,
    };
  }

  const { data, error } = await admin
    .from('subscriptions')
    .insert({
      profile_id: input.profileId,
      period_start: periodStart,
      period_end: periodEnd,
      amount: input.amount,
      status: 'ACTIVE',
      plan_id: input.planId ?? null,
      payment_intent_id: input.paymentIntentId ?? null,
      activation_source: input.source,
      marked_paid_by: input.markedPaidBy ?? null,
      marked_paid_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await reactivateOwnerAssets(input.profileId);
  await closePendingPaymentRows(input.profileId, data.id);

  return {
    subscriptionId: data.id,
    periodStart,
    periodEnd,
    extended: false,
  };
}

async function reactivateOwnerAssets(profileId: string) {
  const admin = createServiceClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', profileId)
    .single();
  if (profile?.role !== 'OWNER') return;
  await admin
    .from('assets')
    .update({ status: 'ACTIVE' })
    .eq('owner_id', profileId)
    .eq('status', 'SUSPENDED');
}

/** Mark leftover PENDING_PAYMENT rows as EXPIRED so UI shows ACTIVE. */
async function closePendingPaymentRows(
  profileId: string,
  keepSubscriptionId: string
) {
  const admin = createServiceClient();
  await admin
    .from('subscriptions')
    .update({ status: 'EXPIRED' })
    .eq('profile_id', profileId)
    .eq('status', 'PENDING_PAYMENT')
    .neq('id', keepSubscriptionId);
}
