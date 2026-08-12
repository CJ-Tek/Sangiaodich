import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifySePayIpnSecret } from '@/lib/sepay/verify';
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
  const sepayId = String(
    transaction.id || body.id || `ipn-${invoice}-${Date.now()}`
  );
  const amount = Number(
    transaction.transaction_amount || order.order_amount || 0
  );
  const txStatus = String(transaction.transaction_status || '');

  const admin = createServiceClient();
  const { error: insertErr } = await admin.from('sepay_webhook_events').insert({
    sepay_id: sepayId,
    source: 'gateway_ipn',
    transfer_type: 'in',
    transfer_amount: amount || null,
    payment_code: invoice ? invoice.toUpperCase() : null,
    reference_code: transaction.payment_id
      ? String(transaction.payment_id)
      : null,
    raw_body: body,
    processed: false,
  });

  if (insertErr?.code === '23505') {
    return NextResponse.json({ success: true });
  }

  let note = `IGNORED type=${notificationType} status=${txStatus}`;

  const paid =
    notificationType === 'ORDER_PAID' ||
    txStatus === 'COMPLETED' ||
    txStatus === 'SUCCESS';

  if (paid && invoice) {
    try {
      const result = await matchAndActivatePayment({
        paymentCode: invoice.toUpperCase(),
        transferAmount: amount,
        sepayTransactionId: sepayId,
        referenceCode: transaction.payment_id
          ? String(transaction.payment_id)
          : null,
        source: 'sepay_ipn',
      });
      note = result.note;
    } catch (e) {
      note = e instanceof Error ? e.message : 'PROCESS_ERROR';
      await admin
        .from('sepay_webhook_events')
        .update({ process_note: note })
        .eq('sepay_id', sepayId);
      return NextResponse.json({ success: false }, { status: 500 });
    }
  }

  await admin
    .from('sepay_webhook_events')
    .update({ processed: true, process_note: note })
    .eq('sepay_id', sepayId);

  return NextResponse.json({ success: true });
}
