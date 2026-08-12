import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { issueGuestInvoice } from '@/lib/engines/guest-invoice-issue';
import { assertActiveSubscription } from '@/lib/engines/subscription-access';
import { fail, ok } from '@/lib/types';

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'SALE') {
    return NextResponse.json(fail('UNAUTHORIZED', 'Sale only'), { status: 401 });
  }
  try {
    await assertActiveSubscription(profile.id);
  } catch {
    return NextResponse.json(
      fail('SUBSCRIPTION_INACTIVE', 'Subscription hết hạn — gia hạn để tiếp tục'),
      { status: 403 }
    );
  }

  const body = await request.json();
  const bookingId = String(body.bookingId || '');
  if (!bookingId) {
    return NextResponse.json(fail('INVALID', 'Thiếu bookingId'), { status: 400 });
  }

  const result = await issueGuestInvoice({
    bookingId,
    saleId: profile.id,
  });

  if ('error' in result) {
    const messages: Record<string, { status: number; message: string }> = {
      NOT_FOUND: { status: 404, message: 'Không tìm thấy booking' },
      FORBIDDEN: { status: 403, message: 'Không phải booking của bạn' },
      INVALID_STATUS: { status: 400, message: 'Booking này không xuất invoice' },
      ALREADY_PAID: { status: 400, message: 'Khách đã đủ giá bán' },
      NO_PAYOUT: {
        status: 400,
        message: 'Chưa cấu hình STK — vào Profile để điền tài khoản nhận tiền',
      },
      INSERT_FAILED: { status: 500, message: result.message || 'Không tạo được invoice' },
    };
    const errorCode = result.error;
    const meta =
      (errorCode ? messages[errorCode] : undefined) || {
        status: 500,
        message: 'Không tạo được invoice',
      };
    return NextResponse.json(fail(errorCode ?? 'UNKNOWN', meta.message), {
      status: meta.status,
    });
  }

  const origin = new URL(request.url).origin;
  return NextResponse.json(
    ok({
      token: result.token,
      expiresAt: result.expiresAt,
      url: `${origin}/pay/${result.token}`,
    })
  );
}
