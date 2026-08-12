import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { todayDateOnly } from '@/lib/dates';
import { activateSubscription } from '@/lib/engines/subscription-activate';
import type { SubscriptionPlanRole } from '@/lib/engines/subscription-plans';
import { mapSubscriptionPlan } from '@/lib/engines/subscription-plans';
import {
  buildVietQrUrl,
  canBuildVietQr,
  resolveVietQrBank,
} from '@/lib/sepay/vietqr';
import { mapPaymentInfo } from '@/lib/platform/payment-info';

const PAYMENT_CODE_PREFIX = 'VB';
const INTENT_TTL_HOURS = 24;

/** SePay-friendly code: VB + 8 alphanumeric (uppercase). */
export function generatePaymentCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += alphabet[bytes[i]! % alphabet.length];
  }
  return `${PAYMENT_CODE_PREFIX}${suffix}`;
}

export async function listActivePlansForRole(role: SubscriptionPlanRole) {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from('subscription_plans')
    .select(
      'id, role, months, amount, compare_at_amount, label, is_active, sort_order'
    )
    .eq('role', role)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(mapSubscriptionPlan);
}

/** Prefer active 1-month plan; else first by sort_order. Fallback 200_000. */
export async function getDefaultPlanAmount(
  role: SubscriptionPlanRole
): Promise<number> {
  const plans = await listActivePlansForRole(role);
  const monthly = plans.find((p) => p.months === 1);
  if (monthly) return monthly.amount;
  if (plans[0]) return plans[0].amount;
  return 200_000;
}

export async function listAllPlans() {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from('subscription_plans')
    .select(
      'id, role, months, amount, compare_at_amount, label, is_active, sort_order'
    )
    .order('role')
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data || []).map(mapSubscriptionPlan);
}

export type CreateIntentResult = {
  intentId: string;
  paymentCode: string;
  amount: number;
  months: number;
  planId: string;
  planLabel: string;
  expiresAt: string;
  qrUrl: string | null;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export async function createPaymentIntent(input: {
  profileId: string;
  role: SubscriptionPlanRole;
  planId: string;
}): Promise<CreateIntentResult> {
  const admin = createServiceClient();

  const { data: plan, error: planErr } = await admin
    .from('subscription_plans')
    .select('id, role, months, amount, label, is_active')
    .eq('id', input.planId)
    .maybeSingle();
  if (planErr) throw new Error(planErr.message);
  if (!plan || !plan.is_active) throw new Error('PLAN_NOT_FOUND');
  if (plan.role !== input.role) throw new Error('PLAN_ROLE_MISMATCH');

  // Cancel other pending intents for this profile
  await admin
    .from('subscription_payment_intents')
    .update({
      status: 'CANCELLED',
      updated_at: new Date().toISOString(),
    })
    .eq('profile_id', input.profileId)
    .eq('status', 'PENDING');

  const expiresAt = new Date(
    Date.now() + INTENT_TTL_HOURS * 60 * 60 * 1000
  ).toISOString();

  let paymentCode = generatePaymentCode();
  let inserted: {
    id: string;
    payment_code: string;
    amount: number;
    months: number;
    expires_at: string;
  } | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await admin
      .from('subscription_payment_intents')
      .insert({
        profile_id: input.profileId,
        plan_id: plan.id,
        payment_code: paymentCode,
        amount: plan.amount,
        months: plan.months,
        status: 'PENDING',
        expires_at: expiresAt,
      })
      .select('id, payment_code, amount, months, expires_at')
      .single();

    if (!error && data) {
      inserted = {
        id: data.id,
        payment_code: data.payment_code,
        amount: Number(data.amount),
        months: data.months,
        expires_at: data.expires_at,
      };
      break;
    }
    if (error?.code === '23505') {
      paymentCode = generatePaymentCode();
      continue;
    }
    throw new Error(error?.message || 'CREATE_INTENT_FAILED');
  }
  if (!inserted) throw new Error('CREATE_INTENT_FAILED');

  const { data: fees } = await admin
    .from('platform_fee_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const payment = mapPaymentInfo(fees);

  const bank = resolveVietQrBank(payment);
  const qrUrl = canBuildVietQr(payment)
    ? buildVietQrUrl({
        accountNumber: payment.accountNumber,
        bank,
        amount: inserted.amount,
        description: inserted.payment_code,
      })
    : null;

  return {
    intentId: inserted.id,
    paymentCode: inserted.payment_code,
    amount: inserted.amount,
    months: inserted.months,
    planId: plan.id,
    planLabel: plan.label || '',
    expiresAt: inserted.expires_at,
    qrUrl,
    bankName: payment.bankName,
    accountName: payment.accountName,
    accountNumber: payment.accountNumber,
  };
}

export async function getPendingIntentForProfile(profileId: string) {
  const admin = createServiceClient();
  const now = new Date().toISOString();

  // Expire stale
  await admin
    .from('subscription_payment_intents')
    .update({ status: 'EXPIRED', updated_at: now })
    .eq('profile_id', profileId)
    .eq('status', 'PENDING')
    .lt('expires_at', now);

  const { data } = await admin
    .from('subscription_payment_intents')
    .select(
      'id, plan_id, payment_code, amount, months, status, expires_at, created_at'
    )
    .eq('profile_id', profileId)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const { data: fees } = await admin
    .from('platform_fee_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  const payment = mapPaymentInfo(fees);
  const bank = resolveVietQrBank(payment);
  const amount = Number(data.amount);
  const qrUrl = canBuildVietQr(payment)
    ? buildVietQrUrl({
        accountNumber: payment.accountNumber,
        bank,
        amount,
        description: data.payment_code,
      })
    : null;

  return {
    intentId: data.id,
    planId: data.plan_id,
    paymentCode: data.payment_code,
    amount,
    months: data.months as 1 | 3 | 6 | 12,
    expiresAt: data.expires_at,
    qrUrl,
    bankName: payment.bankName,
    accountName: payment.accountName,
    accountNumber: payment.accountNumber,
  };
}

/**
 * Match SePay bank webhook / IPN to a pending intent.
 * Exact amount required — mismatch leaves intent pending (or marks AMOUNT_MISMATCH note).
 */
export async function matchAndActivatePayment(input: {
  paymentCode: string;
  transferAmount: number;
  sepayTransactionId: string;
  referenceCode?: string | null;
  source: 'sepay_webhook' | 'sepay_ipn';
}): Promise<{
  matched: boolean;
  activated: boolean;
  note: string;
  subscriptionId?: string;
}> {
  const admin = createServiceClient();
  const code = input.paymentCode.trim().toUpperCase();

  const { data: intent } = await admin
    .from('subscription_payment_intents')
    .select('*')
    .eq('payment_code', code)
    .maybeSingle();

  if (!intent) {
    return { matched: false, activated: false, note: 'INTENT_NOT_FOUND' };
  }

  if (intent.status === 'PAID') {
    return {
      matched: true,
      activated: true,
      note: 'ALREADY_PAID',
      subscriptionId: intent.subscription_id || undefined,
    };
  }

  if (intent.status !== 'PENDING') {
    return {
      matched: true,
      activated: false,
      note: `INTENT_STATUS_${intent.status}`,
    };
  }

  if (new Date(intent.expires_at).getTime() < Date.now()) {
    await admin
      .from('subscription_payment_intents')
      .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
      .eq('id', intent.id);
    return { matched: true, activated: false, note: 'INTENT_EXPIRED' };
  }

  const expected = Number(intent.amount);
  if (Number(input.transferAmount) !== expected) {
    await admin
      .from('subscription_payment_intents')
      .update({
        status: 'AMOUNT_MISMATCH',
        mismatch_amount: input.transferAmount,
        sepay_transaction_id: String(input.sepayTransactionId),
        sepay_reference_code: input.referenceCode || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', intent.id);
    return {
      matched: true,
      activated: false,
      note: `AMOUNT_MISMATCH expected=${expected} got=${input.transferAmount}`,
    };
  }

  const result = await activateSubscription({
    profileId: intent.profile_id,
    months: intent.months,
    amount: expected,
    planId: intent.plan_id,
    paymentIntentId: intent.id,
    source: input.source,
  });

  await admin
    .from('subscription_payment_intents')
    .update({
      status: 'PAID',
      paid_at: new Date().toISOString(),
      sepay_transaction_id: String(input.sepayTransactionId),
      sepay_reference_code: input.referenceCode || null,
      subscription_id: result.subscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', intent.id);

  return {
    matched: true,
    activated: true,
    note: result.extended ? 'EXTENDED' : 'ACTIVATED',
    subscriptionId: result.subscriptionId,
  };
}

/** Used by register — still create PENDING_PAYMENT placeholder. */
export async function ensurePendingSubscriptionRow(input: {
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
