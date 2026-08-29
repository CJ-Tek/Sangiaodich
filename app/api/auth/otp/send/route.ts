import { NextResponse } from 'next/server';
import { normalizePhone, otpDeliveryMode, sendOtp } from '@/lib/auth/otp';
import { getApiErrorTranslator } from '@/lib/i18n/api-errors';
import { rateLimit } from '@/lib/kv/rate-limit';
import { fail, ok } from '@/lib/types';

export async function POST(request: Request) {
  const t = await getApiErrorTranslator();
  const body = await request.json();
  const phone = normalizePhone(String(body.phone || ''));
  if (!phone) {
    return NextResponse.json(fail('INVALID_PHONE', t('INVALID_PHONE')), {
      status: 400,
    });
  }

  const rl = await rateLimit(`otp:send:${phone}`, 5, 60 * 15);
  if (!rl.success) {
    return NextResponse.json(fail('RATE_LIMIT', t('RATE_LIMIT.otpSend')), {
      status: 429,
    });
  }

  const result = await sendOtp(phone);
  if (!result.ok) {
    return NextResponse.json(
      fail('OTP_SEND_FAILED', result.message || t('OTP_SEND_FAILED')),
      { status: 500 }
    );
  }

  const message =
    otpDeliveryMode() === 'zalo'
      ? 'Mã OTP đã gửi qua Zalo tới số điện thoại của bạn.'
      : 'OTP sent (mock). Use code 000000 in development.';

  return NextResponse.json(ok({ message }));
}
