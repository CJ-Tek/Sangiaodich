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
import {
  PAYMENT_CODE_ALPHABET,
  PAYMENT_CODE_LENGTH,
  PAYMENT_CODE_PREFIX,
} from '@/lib/sepay/payment-code';
import {
  buildActivationNote,
  decidePaymentMatch,
} from '@/lib/engines/subscription-payment-match';

const INTENT_TTL_HOURS = 24;

/** SePay-friendly code: VB + 8 alphanumeric (uppercase). */
export function generatePaymentCode(): string {
  const bytes = randomBytes(PAYMENT_CODE_LENGTH);
  let suffix = '';
  for (let i = 0; i < PAYMENT_CODE_LENGTH; i++) {
    suffix += PAYMENT_CODE_ALPHABET[bytes[i]! % PAYMENT_CODE_ALPHABET.length];
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

  // Earlier intents stay claimable: a user who already transferred against an
  // older QR before switching plans must still get that plan activated.
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

/** Scoped by profile so a client cannot poll someone else's intent. */
export async function getIntentStatus(input: {
  profileId: string;
  intentId: string;
}): Promise<{ status: string; paid: boolean } | null> {
  const admin = createServiceClient();
  const { data } = await admin
    .from('subscription_payment_intents')
    .select('status')
    .eq('id', input.intentId)
    .eq('profile_id', input.profileId)
    .maybeSingle();

  if (!data) return null;
  return { status: data.status, paid: data.status === 'PAID' };
}

export type PaymentMatchInput = {
  paymentCode: string;
  transferAmount: number;
  sepayTransactionId: string;
  referenceCode?: string | null;
  source: 'sepay_webhook' | 'sepay_ipn';
};

export type PaymentMatchResult = {
  matched: boolean;
  activated: boolean;
  note: string;
  subscriptionId?: string;
};

/**
 * Match a SePay bank webhook / IPN delivery to an intent and activate it.
 * Exact amount is required; the intent is claimed before activation so a retry
 * or a concurrent delivery of the same transfer cannot extend the period twice.
 */
export async function matchAndActivatePayment(
  input: PaymentMatchInput
): Promise<PaymentMatchResult> {
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

  const decision = decidePaymentMatch({
    intentStatus: intent.status,
    expectedAmount: Number(intent.amount),
    transferAmount: Number(input.transferAmount),
  });

  if (decision.action === 'ALREADY_PAID') {
    return {
      matched: true,
      activated: true,
      note: decision.note,
      subscriptionId: intent.subscription_id || undefined,
    };
  }

  if (decision.action === 'AMOUNT_MISMATCH') {
    await flagAmountMismatch(intent.id, input);
    return { matched: true, activated: false, note: decision.note };
  }

  const claim = await claimIntent(intent.id, input);
  if (claim !== 'CLAIMED') {
    return { matched: true, activated: true, note: claim };
  }

  try {
    const result = await activateSubscription({
      profileId: intent.profile_id,
      months: intent.months,
      amount: Number(intent.amount),
      planId: intent.plan_id,
      paymentIntentId: intent.id,
      source: input.source,
    });

    await admin
      .from('subscription_payment_intents')
      .update({
        subscription_id: result.subscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', intent.id);

    return {
      matched: true,
      activated: true,
      note: buildActivationNote({
        extended: result.extended,
        claimedFromStatus: intent.status,
      }),
      subscriptionId: result.subscriptionId,
    };
  } catch (e) {
    await releaseIntentClaim(intent.id, intent.status);
    throw e;
  }
}

/**
 * Flip the intent to PAID only while it is not already PAID, so the winner of a
 * race is the single caller allowed to extend the subscription.
 */
async function claimIntent(
  intentId: string,
  input: PaymentMatchInput
): Promise<'CLAIMED' | 'ALREADY_PAID' | 'DUPLICATE_TRANSACTION'> {
  const admin = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('subscription_payment_intents')
    .update({
      status: 'PAID',
      paid_at: now,
      sepay_transaction_id: String(input.sepayTransactionId),
      sepay_reference_code: input.referenceCode || null,
      updated_at: now,
    })
    .eq('id', intentId)
    .neq('status', 'PAID')
    .select('id')
    .maybeSingle();

  if (error) {
    // The partial unique index on sepay_transaction_id means this transfer was
    // already applied to another intent.
    if (error.code === '23505') return 'DUPLICATE_TRANSACTION';
    throw new Error(error.message);
  }

  return data ? 'CLAIMED' : 'ALREADY_PAID';
}

/** Hand the intent back so a SePay retry can activate it after a failed run. */
async function releaseIntentClaim(intentId: string, previousStatus: string) {
  const admin = createServiceClient();
  const { error } = await admin
    .from('subscription_payment_intents')
    .update({
      status: previousStatus,
      paid_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', intentId);
  if (error) console.error('sepay claim release error', error.message);
}

async function flagAmountMismatch(intentId: string, input: PaymentMatchInput) {
  const admin = createServiceClient();
  const { error } = await admin
    .from('subscription_payment_intents')
    .update({
      status: 'AMOUNT_MISMATCH',
      mismatch_amount: input.transferAmount,
      sepay_reference_code: input.referenceCode || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', intentId);
  if (error) console.error('sepay mismatch flag error', error.message);
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
