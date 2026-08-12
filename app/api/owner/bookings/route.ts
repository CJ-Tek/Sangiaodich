import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import {
  ownerConfirmBooking,
  ownerRejectBooking,
} from '@/lib/engines/booking-service';
import { assertActiveSubscription } from '@/lib/engines/subscription-access';
import { fail, ok } from '@/lib/types';

async function requireActiveOwner() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'OWNER') {
    return {
      error: NextResponse.json(fail('UNAUTHORIZED', 'Owner only'), {
        status: 401,
      }),
    } as const;
  }
  try {
    await assertActiveSubscription(profile.id);
  } catch {
    return {
      error: NextResponse.json(
        fail(
          'SUBSCRIPTION_INACTIVE',
          'Subscription hết hạn — gia hạn để tiếp tục'
        ),
        { status: 403 }
      ),
    } as const;
  }
  return { profile } as const;
}

export async function PATCH(request: Request) {
  const gate = await requireActiveOwner();
  if ('error' in gate) return gate.error;
  const { profile } = gate;

  const body = await request.json();
  const bookingId = String(body.bookingId || '');
  const action = String(body.action || '');

  if (action === 'confirm') {
    const result = await ownerConfirmBooking({
      bookingId,
      ownerId: profile.id,
    });
    if ('error' in result && result.error) {
      const message =
        result.error === 'OVERLAP'
          ? 'Ngày đã được Sale khác chốt trước — không xác nhận được'
          : result.error === 'INVALID_STATUS'
            ? 'Booking không còn ở trạng thái chờ Owner'
            : result.error === 'FORBIDDEN'
              ? 'Không phải asset của bạn'
              : String(result.error);
      return NextResponse.json(fail(String(result.error), message), {
        status: 400,
      });
    }
    return NextResponse.json(ok({ booking: result.booking }));
  }

  if (action === 'reject') {
    const result = await ownerRejectBooking({
      bookingId,
      ownerId: profile.id,
      reason: body.reason ? String(body.reason) : undefined,
    });
    if ('error' in result && result.error) {
      const message =
        result.error === 'INVALID_STATUS'
          ? 'Booking không còn ở trạng thái chờ Owner'
          : result.error === 'FORBIDDEN'
            ? 'Không phải asset của bạn'
            : String(result.error);
      return NextResponse.json(fail(String(result.error), message), {
        status: 400,
      });
    }
    return NextResponse.json(
      ok({ booking: result.booking, refund: result.refund })
    );
  }

  return NextResponse.json(fail('INVALID_ACTION', 'Unknown action'), {
    status: 400,
  });
}
