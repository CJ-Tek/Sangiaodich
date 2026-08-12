import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import {
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  createBooking,
  recordBookingPayment,
  recordOwnerPayout,
  submitToOwner,
} from '@/lib/engines/booking-service';
import { assertActiveSubscription } from '@/lib/engines/subscription-access';
import { fail, ok } from '@/lib/types';

async function requireActiveSale() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'SALE') {
    return {
      error: NextResponse.json(fail('UNAUTHORIZED', 'Sale only'), {
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

export async function POST(request: Request) {
  const gate = await requireActiveSale();
  if ('error' in gate) return gate.error;
  const { profile } = gate;

  const body = await request.json();
  const result = await createBooking({
    saleId: profile.id,
    assetId: String(body.assetId || ''),
    guestId: String(body.guestId || ''),
    checkIn: String(body.checkIn || ''),
    checkOut: String(body.checkOut || ''),
    listPrice: Number(body.listPrice || 0),
  });

  if ('error' in result && result.error) {
    const message =
      result.error === 'BELOW_FLOOR' && 'effectiveCost' in result
        ? `Giá bán dưới floor ${Number(result.effectiveCost).toLocaleString('vi-VN')}`
        : result.error === 'OVERLAP'
          ? 'Ngày đã được sale khác confirm — lịch đã khóa'
          : result.error === 'GUEST_DUPLICATE'
            ? 'Guest này đã có booking trùng ngày trên asset này'
            : result.error === 'SUBSCRIPTION_INACTIVE'
              ? 'Subscription hết hạn — gia hạn để tiếp tục'
              : String(result.error);
    const status = result.error === 'SUBSCRIPTION_INACTIVE' ? 403 : 400;
    return NextResponse.json(fail('BOOKING_CREATE_FAILED', message), {
      status,
    });
  }

  return NextResponse.json(ok({ booking: result.booking }));
}

export async function PATCH(request: Request) {
  const gate = await requireActiveSale();
  if ('error' in gate) return gate.error;
  const { profile } = gate;

  const body = await request.json();
  const bookingId = String(body.bookingId || '');
  const action = String(body.action || '');

  if (action === 'submit_to_owner' || action === 'confirm') {
    // `confirm` kept as alias for older clients — now = submit to owner (no inventory lock)
    const result = await submitToOwner({
      bookingId,
      saleId: profile.id,
      amountCollected: Number(body.amountCollected || 0),
    });
    if ('error' in result && result.error) {
      const message =
        result.error === 'BELOW_DEPOSIT' && 'minDeposit' in result
          ? `Cần thu tối thiểu 50% giá bán (${Number(result.minDeposit).toLocaleString('vi-VN')}) để gửi Owner`
          : result.error === 'OVERLAP'
            ? 'Ngày đã bị Sale khác chốt (CONFIRMED) — không gửi được'
            : String(result.error);
      return NextResponse.json(fail(String(result.error), message), {
        status: 400,
      });
    }
    return NextResponse.json(ok({ booking: result.booking }));
  }

  if (action === 'check_in') {
    const result = await checkInBooking(bookingId, profile.id);
    if ('error' in result && result.error) {
      return NextResponse.json(fail(String(result.error), String(result.error)), {
        status: 400,
      });
    }
    return NextResponse.json(ok({ booking: result.booking }));
  }

  if (action === 'check_out') {
    const result = await checkOutBooking(bookingId, profile.id);
    if ('error' in result && result.error) {
      return NextResponse.json(fail(String(result.error), String(result.error)), {
        status: 400,
      });
    }
    return NextResponse.json(ok({ booking: result.booking }));
  }

  if (action === 'cancel') {
    const result = await cancelBooking(bookingId, profile.id, {
      goodwillFullRefund: Boolean(body.goodwillFullRefund),
    });
    if ('error' in result && result.error) {
      return NextResponse.json(fail('CANCEL_FAILED', String(result.error)), {
        status: 400,
      });
    }
    return NextResponse.json(
      ok({ booking: result.booking, refund: result.refund })
    );
  }

  if (action === 'record_payment') {
    const result = await recordBookingPayment({
      bookingId,
      saleId: profile.id,
      amountCollected: Number(body.amountCollected || 0),
    });
    if ('error' in result && result.error) {
      const message =
        result.error === 'AMOUNT_REGRESSION'
          ? 'Số đã thu mới không được nhỏ hơn số đã ghi'
          : result.error === 'ABOVE_LIST'
            ? 'Không thu vượt giá bán'
            : String(result.error);
      return NextResponse.json(fail(String(result.error), message), {
        status: 400,
      });
    }
    return NextResponse.json(ok({ booking: result.booking }));
  }

  if (action === 'record_owner_payout') {
    const result = await recordOwnerPayout({
      bookingId,
      saleId: profile.id,
      ownerPaidAmount: Number(body.ownerPaidAmount || 0),
    });
    if ('error' in result && result.error) {
      const message =
        result.error === 'AMOUNT_REGRESSION'
          ? 'Số đã CK Owner không được nhỏ hơn số đã ghi'
          : result.error === 'ABOVE_OWNER_EARN'
            ? 'Không ghi nhận vượt phần Owner earn'
            : result.error === 'INVALID_STATUS'
              ? 'Không ghi nhận CK Owner ở trạng thái này'
              : String(result.error);
      return NextResponse.json(fail(String(result.error), message), {
        status: 400,
      });
    }
    return NextResponse.json(ok({ booking: result.booking }));
  }

  return NextResponse.json(fail('INVALID_ACTION', 'Unknown action'), {
    status: 400,
  });
}
