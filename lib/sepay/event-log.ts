import { createServiceClient } from '@/lib/supabase/server';

export type SepayEventSource = 'bank_webhook' | 'gateway_ipn';

export type SepayEventInput = {
  sepayId: string;
  source: SepayEventSource;
  transferType?: string | null;
  transferAmount?: number | null;
  paymentCode?: string | null;
  referenceCode?: string | null;
  accountNumber?: string | null;
  rawBody: unknown;
};

/**
 * Log the raw SePay delivery and report whether activation should run.
 * A duplicate id is only skipped once the earlier delivery finished: SePay
 * retries after a failed run must be reprocessed, otherwise a received transfer
 * is dropped for good.
 */
export async function recordSepayEvent(
  input: SepayEventInput
): Promise<{ shouldProcess: boolean }> {
  const admin = createServiceClient();

  const { error } = await admin.from('sepay_webhook_events').insert({
    sepay_id: input.sepayId,
    source: input.source,
    transfer_type: input.transferType ?? null,
    transfer_amount: input.transferAmount ?? null,
    payment_code: input.paymentCode || null,
    reference_code: input.referenceCode || null,
    account_number: input.accountNumber || null,
    raw_body: input.rawBody,
    processed: false,
  });

  if (!error) return { shouldProcess: true };

  if (error.code !== '23505') {
    console.error('sepay event log error', error.message);
    return { shouldProcess: true };
  }

  const { data: existing } = await admin
    .from('sepay_webhook_events')
    .select('processed')
    .eq('sepay_id', input.sepayId)
    .maybeSingle();

  return { shouldProcess: !existing?.processed };
}

export async function markSepayEventProcessed(sepayId: string, note: string) {
  await updateSepayEvent(sepayId, { processed: true, process_note: note });
}

export async function markSepayEventFailed(sepayId: string, note: string) {
  await updateSepayEvent(sepayId, { processed: false, process_note: note });
}

async function updateSepayEvent(
  sepayId: string,
  patch: { processed: boolean; process_note: string }
) {
  const admin = createServiceClient();
  const { error } = await admin
    .from('sepay_webhook_events')
    .update(patch)
    .eq('sepay_id', sepayId);
  if (error) console.error('sepay event update error', error.message);
}
