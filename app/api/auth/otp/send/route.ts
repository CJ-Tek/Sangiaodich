import { NextResponse } from 'next/server';
import { sendMockOtp, normalizePhone } from '@/lib/auth/otp';
import { rateLimit } from '@/lib/kv/rate-limit';
import { fail, ok } from '@/lib/types';

export async function POST(request: Request) {
  const body = await request.json();
  const phone = normalizePhone(String(body.phone || ''));
  if (!phone) {
    return NextResponse.json(fail('INVALID_PHONE', 'Số điện thoại không hợp lệ'), {
      status: 400,
    });
  }

  const rl = await rateLimit(`otp:send:${phone}`, 5, 60 * 15);
  if (!rl.success) {
    return NextResponse.json(fail('RATE_LIMIT', 'Too many OTP requests'), {
      status: 429,
    });
  }

  const result = await sendMockOtp(phone);
  if (!result.ok) {
    return NextResponse.json(fail('OTP_SEND_FAILED', result.message), {
      status: 500,
    });
  }

  return NextResponse.json(
    ok({ message: 'OTP sent (mock). Use code 000000 in development.' })
  );
}
