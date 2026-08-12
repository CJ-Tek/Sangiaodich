import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { fail, ok } from '@/lib/types';

/**
 * Build SePay Payment Gateway checkout form fields when merchant env is set.
 * Client posts the returned fields to checkoutUrl.
 * Env: SEPAY_MERCHANT_ID, SEPAY_MERCHANT_SECRET_KEY, SEPAY_PG_ENV=sandbox|production
 */
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || (profile.role !== 'OWNER' && profile.role !== 'SALE')) {
    return NextResponse.json(fail('UNAUTHORIZED', 'Owner/Sale only'), {
      status: 401,
    });
  }

  const merchantId = process.env.SEPAY_MERCHANT_ID || '';
  const secretKey = process.env.SEPAY_MERCHANT_SECRET_KEY || '';
  if (!merchantId || !secretKey) {
    return NextResponse.json(
      fail(
        'GATEWAY_NOT_CONFIGURED',
        'Chưa cấu hình SePay Payment Gateway (SEPAY_MERCHANT_ID / SECRET)'
      ),
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const paymentCode = String(body.paymentCode || '').toUpperCase();
  const amount = Number(body.amount || 0);
  if (!paymentCode || !amount) {
    return NextResponse.json(fail('INVALID', 'paymentCode and amount required'), {
      status: 400,
    });
  }

  try {
    const { SePayPgClient } = await import('sepay-pg-node');
    const env =
      process.env.SEPAY_PG_ENV === 'production' ? 'production' : 'sandbox';
    const client = new SePayPgClient({
      env,
      merchant_id: merchantId,
      secret_key: secretKey,
    });

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      '';
    const returnPath =
      profile.role === 'OWNER'
        ? '/owner/subscription'
        : '/sale/settings';
    const successUrl = origin
      ? `${origin}${returnPath}${profile.role === 'OWNER' ? '?paid=1' : '?tab=subscription&paid=1'}`
      : undefined;

    const fields = client.checkout.initOneTimePaymentFields({
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: paymentCode,
      order_amount: amount,
      currency: 'VND',
      order_description: `Subscription ${paymentCode}`,
      customer_id: profile.id,
      success_url: successUrl,
      cancel_url: successUrl,
      error_url: successUrl,
    });
    const checkoutUrl = client.checkout.initCheckoutUrl();

    return NextResponse.json(ok({ checkoutUrl, fields }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'GATEWAY_ERROR';
    return NextResponse.json(fail('GATEWAY_ERROR', msg), { status: 500 });
  }
}
