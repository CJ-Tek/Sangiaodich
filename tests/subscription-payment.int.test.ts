import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { POST as deliverBankWebhook } from '@/app/api/webhooks/sepay/route';
import { createPaymentIntent } from '@/lib/engines/subscription-payment';
import {
  listMismatchIntents,
  listUnresolvedEvents,
} from '@/lib/engines/admin-payment-ops';
import { addCalendarMonths, todayDateOnly } from '@/lib/dates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * This suite creates and deletes real rows, so it only runs against a local
 * Supabase — never against a remote project that happens to be configured.
 */
const isLocalSupabase = /(localhost|127\.0\.0\.1)/.test(supabaseUrl);
const canRun = Boolean(supabaseUrl && serviceRoleKey && isLocalSupabase);

const runStamp = Date.now();
let sequence = 0;

let admin: SupabaseClient;
let plan: { id: string; months: number; amount: number };
let profileId: string;
const deliveredEventIds = new Set<string>();

describe.skipIf(!canRun)('sepay money-in → subscription (integration)', () => {
  beforeAll(async () => {
    process.env.SEPAY_WEBHOOK_API_KEY ||= 'sepay-integration-test-key';

    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data } = await admin
      .from('subscription_plans')
      .select('id, months, amount')
      .eq('role', 'OWNER')
      .eq('is_active', true)
      .order('sort_order')
      .limit(1)
      .maybeSingle();

    if (!data) {
      throw new Error('No active OWNER plan — run `npm run db:reset` first');
    }
    plan = { id: data.id, months: data.months, amount: Number(data.amount) };
  });

  beforeEach(async () => {
    const { data, error } = await admin.auth.admin.createUser({
      email: `sepay-int-${runStamp}-${(sequence += 1)}@vbnb.local`,
      password: randomUUID(),
      email_confirm: true,
      app_metadata: { role: 'OWNER' },
      user_metadata: { full_name: 'SePay Integration' },
    });
    if (error || !data.user) {
      throw new Error(error?.message || 'Cannot create test user');
    }
    profileId = data.user.id;
    await admin.rpc('sync_profile_role_from_auth', { p_user_id: profileId });
  });

  afterEach(async () => {
    if (deliveredEventIds.size) {
      await admin
        .from('sepay_webhook_events')
        .delete()
        .in('sepay_id', [...deliveredEventIds]);
      deliveredEventIds.clear();
    }
    // Profile, intents and subscriptions cascade from the auth user.
    if (profileId) await admin.auth.admin.deleteUser(profileId);
  });

  it('activates a subscription when the exact amount arrives', async () => {
    const intent = await createIntent();
    const sepayId = nextSepayId();

    const response = await deliver(
      bankTransfer({
        sepayId,
        amount: intent.amount,
        code: intent.paymentCode,
      })
    );

    expect(response.status).toBe(200);

    const subscription = await latestSubscription();
    expect(subscription?.status).toBe('ACTIVE');
    expect(subscription?.period_end).toBe(
      addCalendarMonths(todayDateOnly(), intent.months)
    );

    expect(await intentStatus(intent.intentId)).toBe('PAID');

    const event = await eventBySepayId(sepayId);
    expect(event?.processed).toBe(true);
    expect(event?.process_note).toBe('ACTIVATED');
  });

  it('ignores a replay of the same delivery', async () => {
    const intent = await createIntent();
    const payload = bankTransfer({
      sepayId: nextSepayId(),
      amount: intent.amount,
      code: intent.paymentCode,
    });

    await deliver(payload);
    const first = await latestSubscription();

    const replay = await deliver(payload);
    expect(replay.status).toBe(200);

    const after = await latestSubscription();
    expect(after?.period_end).toBe(first?.period_end);
    expect(await subscriptionCount()).toBe(1);
  });

  it('reprocesses a delivery whose earlier attempt never finished', async () => {
    const intent = await createIntent();
    const sepayId = nextSepayId();
    deliveredEventIds.add(sepayId);

    // An earlier attempt logged the event and then failed before activating.
    await admin.from('sepay_webhook_events').insert({
      sepay_id: sepayId,
      source: 'bank_webhook',
      transfer_type: 'in',
      transfer_amount: intent.amount,
      payment_code: intent.paymentCode,
      raw_body: {},
      processed: false,
      process_note: 'PROCESS_ERROR',
    });

    await deliver(
      bankTransfer({
        sepayId,
        amount: intent.amount,
        code: intent.paymentCode,
      })
    );

    expect(await intentStatus(intent.intentId)).toBe('PAID');
    expect((await latestSubscription())?.status).toBe('ACTIVE');

    const event = await eventBySepayId(sepayId);
    expect(event?.processed).toBe(true);
    expect(event?.process_note).toBe('ACTIVATED');
  });

  it('extends only once when two deliveries race for the same transfer', async () => {
    const intent = await createIntent();
    const sepayIds = [nextSepayId(), nextSepayId()];

    const responses = await Promise.all(
      sepayIds.map((sepayId) =>
        deliver(
          bankTransfer({
            sepayId,
            amount: intent.amount,
            code: intent.paymentCode,
          })
        )
      )
    );

    for (const response of responses) expect(response.status).toBe(200);

    const subscription = await latestSubscription();
    expect(subscription?.period_end).toBe(
      addCalendarMonths(todayDateOnly(), intent.months)
    );
    expect(await subscriptionCount()).toBe(1);

    const notes = await Promise.all(
      sepayIds.map(async (id) => (await eventBySepayId(id))?.process_note)
    );
    expect(notes.sort()).toEqual(['ACTIVATED', 'ALREADY_PAID']);
  });

  it('flags a wrong amount and surfaces it to admin instead of activating', async () => {
    const intent = await createIntent();
    const sepayId = nextSepayId();

    await deliver(
      bankTransfer({
        sepayId,
        amount: intent.amount - 1_000,
        code: intent.paymentCode,
      })
    );

    expect(await intentStatus(intent.intentId)).toBe('AMOUNT_MISMATCH');
    expect(await latestSubscription()).toBeNull();

    const event = await eventBySepayId(sepayId);
    expect(event?.processed).toBe(false);

    const mismatches = await listMismatchIntents();
    expect(mismatches.some((row) => row.intentId === intent.intentId)).toBe(
      true
    );

    const unresolved = await listUnresolvedEvents();
    expect(unresolved.some((row) => row.sepayId === sepayId)).toBe(true);
  });

  it('still activates when the correct amount follows a mismatch', async () => {
    const intent = await createIntent();

    await deliver(
      bankTransfer({
        sepayId: nextSepayId(),
        amount: intent.amount + 5_000,
        code: intent.paymentCode,
      })
    );

    const sepayId = nextSepayId();
    await deliver(
      bankTransfer({
        sepayId,
        amount: intent.amount,
        code: intent.paymentCode,
      })
    );

    expect(await intentStatus(intent.intentId)).toBe('PAID');
    expect((await latestSubscription())?.status).toBe('ACTIVE');

    const event = await eventBySepayId(sepayId);
    expect(event?.process_note).toBe('ACTIVATED_FROM_AMOUNT_MISMATCH');
  });

  it('reads the payment code from the raw transfer content', async () => {
    const intent = await createIntent();
    const sepayId = nextSepayId();

    await deliver(
      bankTransfer({
        sepayId,
        amount: intent.amount,
        code: null,
        content: `CT DEN:001 NGUYEN VAN A CHUYEN TIEN ${intent.paymentCode} GD 12345`,
      })
    );

    expect(await intentStatus(intent.intentId)).toBe('PAID');
    expect((await eventBySepayId(sepayId))?.process_note).toBe('ACTIVATED');
  });

  it('keeps an unknown payment code open for manual handling', async () => {
    const sepayId = nextSepayId();

    await deliver(
      bankTransfer({ sepayId, amount: plan.amount, code: 'VBZZZZZZZZ' })
    );

    const event = await eventBySepayId(sepayId);
    expect(event?.processed).toBe(false);
    expect(event?.process_note).toBe('INTENT_NOT_FOUND');
    expect(await latestSubscription()).toBeNull();
  });

  it('ignores outgoing transfers', async () => {
    const sepayId = nextSepayId();

    await deliver(
      bankTransfer({
        sepayId,
        amount: plan.amount,
        code: 'VBZZZZZZZZ',
        transferType: 'out',
      })
    );

    const event = await eventBySepayId(sepayId);
    expect(event?.processed).toBe(true);
    expect(event?.process_note).toBe('NOT_INCOMING');
  });

  it('adds a renewal on top of the current period end', async () => {
    const first = await createIntent();
    await deliver(
      bankTransfer({
        sepayId: nextSepayId(),
        amount: first.amount,
        code: first.paymentCode,
      })
    );

    const second = await createIntent();
    const sepayId = nextSepayId();
    await deliver(
      bankTransfer({
        sepayId,
        amount: second.amount,
        code: second.paymentCode,
      })
    );

    const expected = addCalendarMonths(
      addCalendarMonths(todayDateOnly(), first.months),
      second.months
    );
    expect((await latestSubscription())?.period_end).toBe(expected);
    expect(await subscriptionCount()).toBe(1);
    expect((await eventBySepayId(sepayId))?.process_note).toBe('EXTENDED');
  });
});

function nextSepayId(): string {
  sequence += 1;
  return `int-${runStamp}-${sequence}`;
}

function createIntent() {
  return createPaymentIntent({ profileId, role: 'OWNER', planId: plan.id });
}

function bankTransfer(input: {
  sepayId: string;
  amount: number;
  code?: string | null;
  content?: string;
  transferType?: string;
}) {
  return {
    id: input.sepayId,
    gateway: 'MBBank',
    transactionDate: '2026-08-13 10:00:00',
    accountNumber: '0999999999',
    code: input.code ?? null,
    content: input.content ?? `CT DEN ${input.code ?? ''}`,
    transferType: input.transferType ?? 'in',
    transferAmount: input.amount,
    referenceCode: `FT${input.sepayId}`,
  };
}

async function deliver(payload: Record<string, unknown>) {
  deliveredEventIds.add(String(payload.id));
  return deliverBankWebhook(
    new Request('http://localhost/api/webhooks/sepay', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Apikey ${process.env.SEPAY_WEBHOOK_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })
  );
}

async function latestSubscription() {
  const { data } = await admin
    .from('subscriptions')
    .select('status, period_start, period_end')
    .eq('profile_id', profileId)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function subscriptionCount() {
  const { count } = await admin
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId);
  return count;
}

async function intentStatus(intentId: string) {
  const { data } = await admin
    .from('subscription_payment_intents')
    .select('status')
    .eq('id', intentId)
    .maybeSingle();
  return data?.status;
}

async function eventBySepayId(sepayId: string) {
  const { data } = await admin
    .from('sepay_webhook_events')
    .select('processed, process_note')
    .eq('sepay_id', sepayId)
    .maybeSingle();
  return data;
}
