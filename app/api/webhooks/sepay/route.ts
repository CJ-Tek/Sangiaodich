import { NextResponse } from 'next/server';
import { verifySePayWebhookSignature } from '@/lib/sepay/verify';
import { extractPaymentCode } from '@/lib/sepay/payment-code';
import {
  markSepayEventFailed,
  markSepayEventProcessed,
  recordSepayEvent,
} from '@/lib/sepay/event-log';
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

  const transferType = String(data.transferType || '');
  const amount = Number(data.transferAmount || 0);
  const paymentCode = extractPaymentCode({
    code: data.code,
    content: data.content,
  });

  const { shouldProcess } = await recordSepayEvent({
    sepayId,
    source: 'bank_webhook',
    transferType: transferType || null,
    transferAmount: data.transferAmount != null ? amount : null,
    paymentCode,
    referenceCode: data.referenceCode ? String(data.referenceCode) : null,
    accountNumber: data.accountNumber ? String(data.accountNumber) : null,
    rawBody: data,
  });

  if (!shouldProcess) {
    return NextResponse.json({ success: true });
  }

  if (transferType !== 'in') {
    await markSepayEventProcessed(sepayId, 'NOT_INCOMING');
    return NextResponse.json({ success: true });
  }

  if (!paymentCode) {
    await markSepayEventFailed(sepayId, 'NO_PAYMENT_CODE');
    return NextResponse.json({ success: true });
  }

  try {
    const result = await matchAndActivatePayment({
      paymentCode,
      transferAmount: amount,
      sepayTransactionId: sepayId,
      referenceCode: data.referenceCode ? String(data.referenceCode) : null,
      source: 'sepay_webhook',
    });

    if (result.activated) {
      await markSepayEventProcessed(sepayId, result.note);
    } else {
      await markSepayEventFailed(sepayId, result.note);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const note = e instanceof Error ? e.message : 'PROCESS_ERROR';
    console.error('sepay match error', note);
    await markSepayEventFailed(sepayId, note);
    return NextResponse.json(
      { success: false, message: 'Internal error' },
      { status: 500 }
    );
  }
}
