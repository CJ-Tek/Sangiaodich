import { createServiceClient } from '@/lib/supabase/server';
import type { SubscriptionPlanRole } from '@/lib/engines/subscription-plans';

/** Intents where money arrived but the amount did not match the plan price. */
export type MismatchIntentRow = {
  intentId: string;
  profileId: string;
  paymentCode: string;
  fullName: string;
  phone: string;
  role: SubscriptionPlanRole;
  expectedAmount: number;
  receivedAmount: number | null;
  months: number;
  updatedAt: string;
};

/** Deliveries that still need a human: no code, unknown code, or a failed run. */
export type UnresolvedEventRow = {
  id: string;
  sepayId: string;
  source: string;
  paymentCode: string | null;
  transferAmount: number | null;
  note: string | null;
  createdAt: string;
};

const EVENT_LIMIT = 50;

export async function listMismatchIntents(): Promise<MismatchIntentRow[]> {
  const admin = createServiceClient();
  const { data } = await admin
    .from('subscription_payment_intents')
    .select(
      'id, profile_id, payment_code, amount, mismatch_amount, months, updated_at, profiles!inner(full_name, phone, role)'
    )
    .eq('status', 'AMOUNT_MISMATCH')
    .order('updated_at', { ascending: false });

  return (data || []).map((row) => {
    const profile = firstRelated<{
      full_name: string | null;
      phone: string | null;
      role: string;
    }>(row.profiles);
    return {
      intentId: row.id,
      profileId: row.profile_id,
      paymentCode: row.payment_code,
      fullName: profile?.full_name || '—',
      phone: profile?.phone || '',
      role: (profile?.role === 'SALE' ? 'SALE' : 'OWNER') as SubscriptionPlanRole,
      expectedAmount: Number(row.amount),
      receivedAmount:
        row.mismatch_amount == null ? null : Number(row.mismatch_amount),
      months: row.months,
      updatedAt: row.updated_at,
    };
  });
}

export async function listUnresolvedEvents(): Promise<UnresolvedEventRow[]> {
  const admin = createServiceClient();
  const { data } = await admin
    .from('sepay_webhook_events')
    .select(
      'id, sepay_id, source, payment_code, transfer_amount, process_note, created_at'
    )
    .eq('processed', false)
    .order('created_at', { ascending: false })
    .limit(EVENT_LIMIT);

  return (data || []).map((row) => ({
    id: row.id,
    sepayId: row.sepay_id,
    source: row.source,
    paymentCode: row.payment_code,
    transferAmount:
      row.transfer_amount == null ? null : Number(row.transfer_amount),
    note: row.process_note,
    createdAt: row.created_at,
  }));
}

/** PostgREST returns an embedded row as an object or a single-item array. */
function firstRelated<T>(value: unknown): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return value as T;
}
