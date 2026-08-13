import { NextResponse } from 'next/server';
import { verifySePayIpnSecret } from '@/lib/sepay/verify';
import { extractPaymentCode } from '@/lib/sepay/payment-code';
import {
  markSepayEventFailed,
  markSepayEventProcessed,
  recordSepayEvent,
} from '@/lib/sepay/event-log';
import { matchAndActivatePayment } from '@/lib/engines/subscription-payment';
import { getRequiredSecret, isProductionRuntime } from '@/lib/security/secrets';

/**
 * SePay Payment Gateway IPN.
 * Configure IPN URL to /api/webhooks/sepay/ipn with SECRET_KEY auth.
 * Env: SEPAY_IPN_SECRET (or SEPAY_MERCHANT_SECRET_KEY) — required in production.
 *
 * @see https://developer.sepay.vn/en/cong-thanh-toan/IPN
 */
export async function POST(request: Request) {
  const expected =
    getRequiredSecret('SEPAY_IPN_SECRET') ||
    getRequiredSecret('SEPAY_MERCHANT_SECRET_KEY');

  if (isProductionRuntime() && !expected) {
    return NextResponse.json(
      { success: false, message: 'SEPAY_IPN_SECRET is not configured' },
      { status: 503 }
    );
  }

  const headerSecret = request.headers.get('x-secret-key');

  if (!verifySePayIpnSecret({ headerSecret, expectedSecret: expected || '' })) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const notificationType = String(body.notification_type || '');
  const order = (body.order || {}) as Record<string, unknown>;
  const transaction = (body.transaction || {}) as Record<string, unknown>;

  const invoice = String(order.order_invoice_number || '');
  const paymentCode = extractPaymentCode({
    code: invoice,
    content: order.order_description,
  });

  // Deterministic id so a retry of the same notification dedupes instead of
  // creating a second event row.
  const sepayId = String(
    transaction.id || body.id || `ipn-${invoice}-${notificationType}`
  );
  const amount = Number(
    transaction.transaction_amount || order.order_amount || 0
  );
  const txStatus = String(transaction.transaction_status || '');
  const referenceCode = transaction.payment_id
    ? String(transaction.payment_id)
    : null;

  const { shouldProcess } = await recordSepayEvent({
    sepayId,
    source: 'gateway_ipn',
    transferType: 'in',
    transferAmount: amount || null,
    paymentCode,
    referenceCode,
    rawBody: body,
  });

  if (!shouldProcess) {
    return NextResponse.json({ success: true });
  }

  const paid =
    notificationType === 'ORDER_PAID' ||
    txStatus === 'COMPLETED' ||
    txStatus === 'SUCCESS';

  if (!paid) {
    await markSepayEventProcessed(
      sepayId,
      `IGNORED type=${notificationType} status=${txStatus}`
    );
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
      referenceCode,
      source: 'sepay_ipn',
    });

    if (result.activated) {
      await markSepayEventProcessed(sepayId, result.note);
    } else {
      await markSepayEventFailed(sepayId, result.note);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const note = e instanceof Error ? e.message : 'PROCESS_ERROR';
    console.error('sepay ipn match error', note);
    await markSepayEventFailed(sepayId, note);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
