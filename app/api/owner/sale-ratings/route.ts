import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { upsertSaleRating } from '@/lib/engines/sale-ratings';
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

function messageFor(code: string): string {
  switch (code) {
    case 'INVALID_SCORE':
      return 'Điểm phải từ 1 đến 10';
    case 'NOT_CHECKED_OUT':
      return 'Chỉ đánh giá sau khi check-out';
    case 'FORBIDDEN':
      return 'Không phải booking của căn bạn';
    case 'LOCKED':
      return 'Đã gửi đánh giá — không sửa được';
    case 'NOT_FOUND':
      return 'Không tìm thấy booking';
    default:
      return code;
  }
}

async function handleUpsert(request: Request) {
  const gate = await requireActiveOwner();
  if ('error' in gate) return gate.error;
  const { profile } = gate;

  const body = await request.json();
  const result = await upsertSaleRating({
    bookingId: String(body.bookingId || ''),
    ownerId: profile.id,
    scorePayment: body.scorePayment,
    scoreHandling: body.scoreHandling,
    scoreCommunication: body.scoreCommunication,
    comment: body.comment != null ? String(body.comment) : null,
  });

  if ('error' in result) {
    const status =
      result.error === 'FORBIDDEN'
        ? 403
        : result.error === 'NOT_FOUND'
          ? 404
          : 400;
    return NextResponse.json(fail(result.error, messageFor(result.error)), {
      status,
    });
  }

  return NextResponse.json(ok({ rating: result.rating }));
}

export async function POST(request: Request) {
  return handleUpsert(request);
}

export async function PATCH(request: Request) {
  return handleUpsert(request);
}
