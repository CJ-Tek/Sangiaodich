import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifySePayWebhookSignature } from '@/lib/sepay/verify';
import { matchAndActivatePayment } from '@/lib/engines/subscription-payment';
import { getRequiredSecret, isProductionRuntime } from '@/lib/security/secrets';

/**
 * SePay bank webhook — money-in notifications.
 * Configure at my.sepay.vn with HMAC-SHA256 auth.
 * Env: SEPAY_WEBHOOK_SECRET (required in production)
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = getRequiredSecret('SEPAY_WEBHOOK_SECRET');

  if (isProductionRuntime() && !secret) {
    return NextResponse.json(
      { success: false, message: 'SEPAY_WEBHOOK_SECRET is not configured' },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get('authorization') || '';
  const apiKey = getRequiredSecret('SEPAY_WEBHOOK_API_KEY');
  const hmac = secret
    ? verifySePayWebhookSignature({
        rawBody,
        signatureHeader: request.headers.get('x-sepay-signature'),
        timestampHeader: request.headers.get('x-sepay-timestamp'),
        secret,
      })
    : ({ ok: false, reason: 'SECRET_MISSING' } as const);

  // API key fallback only outside production (local/dev dual auth).
  const apiKeyOk =
    !isProductionRuntime() &&
    Boolean(apiKey) &&
    (authHeader === `Apikey ${apiKey}` || authHeader === `Bearer ${apiKey}`);

  if (!hmac.ok && !apiKeyOk) {
    return NextResponse.json(
      { success: false, message: hmac.ok ? 'Unauthorized' : hmac.reason },
      { status: 401 }
    );
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const sepayId = String(data.id ?? '');
  if (!sepayId) {
    return NextResponse.json(
      { success: false, message: 'Missing id' },
      { status: 400 }
    );
  }

  const admin = createServiceClient();

  // Dedup — insert event; if conflict, already processed
  const { error: insertErr } = await admin.from('sepay_webhook_events').insert({
    sepay_id: sepayId,
    source: 'bank_webhook',
    transfer_type: data.transferType ? String(data.transferType) : null,
    transfer_amount:
      data.transferAmount != null ? Number(data.transferAmount) : null,
    payment_code: data.code ? String(data.code).toUpperCase() : null,
    reference_code: data.referenceCode
      ? String(data.referenceCode)
      : null,
    account_number: data.accountNumber
      ? String(data.accountNumber)
      : null,
    raw_body: data,
    processed: false,
  });

  if (insertErr) {
    if (insertErr.code === '23505') {
      return NextResponse.json({ success: true });
    }
    console.error('sepay webhook log error', insertErr.message);
  }

  const transferType = String(data.transferType || '');
  const code = data.code ? String(data.code).toUpperCase() : '';
  const amount = Number(data.transferAmount || 0);

  let note = 'IGNORED';
  if (transferType === 'in' && code) {
    try {
      const result = await matchAndActivatePayment({
        paymentCode: code,
        transferAmount: amount,
        sepayTransactionId: sepayId,
        referenceCode: data.referenceCode
          ? String(data.referenceCode)
          : null,
        source: 'sepay_webhook',
      });
      note = result.note;
    } catch (e) {
      note = e instanceof Error ? e.message : 'PROCESS_ERROR';
      console.error('sepay match error', note);
      await admin
        .from('sepay_webhook_events')
        .update({ process_note: note })
        .eq('sepay_id', sepayId);
      return NextResponse.json(
        { success: false, message: 'Internal error' },
        { status: 500 }
      );
    }
  } else {
    note = !code ? 'NO_PAYMENT_CODE' : 'NOT_INCOMING';
  }

  await admin
    .from('sepay_webhook_events')
    .update({ processed: true, process_note: note })
    .eq('sepay_id', sepayId);

  return NextResponse.json({ success: true });
}
