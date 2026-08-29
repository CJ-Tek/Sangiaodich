import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import {
  cancelBooking,
  createBooking,
  recordBookingPayment,
  recordOwnerPayout,
  submitToOwner,
} from '@/lib/engines/booking-service';
import { assertActiveSubscription } from '@/lib/engines/subscription-access';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { translateEngineError } from '@/lib/i18n/engine-error';
import { fail, ok } from '@/lib/types';

async function requireActiveSale(
  t: Awaited<ReturnType<typeof import('@/lib/i18n/api-route-context').getApiRouteContext>>['t']
) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'SALE') {
    return {
      error: NextResponse.json(fail('UNAUTHORIZED', t('UNAUTHORIZED.saleOnly')), {
        status: 401,
      }),
    } as const;
  }
  try {
    await assertActiveSubscription(profile.id);
  } catch {
    return {
      error: NextResponse.json(
        fail('SUBSCRIPTION_INACTIVE', t('SUBSCRIPTION_INACTIVE')),
        { status: 403 }
      ),
    } as const;
  }
  return { profile } as const;
}

function bookingCreateMessage(
  t: Awaited<ReturnType<typeof import('@/lib/i18n/api-route-context').getApiRouteContext>>['t'],
  result: { error: string; effectiveCost?: number },
  formatAmount: (n: number) => string
) {
  if (result.error === 'BELOW_FLOOR' && 'effectiveCost' in result) {
    return translateEngineError(t, 'BELOW_FLOOR', {
      amount: formatAmount(Number(result.effectiveCost)),
    });
  }
  if (result.error === 'OVERLAP') {
    return t('BOOKING_CREATE_FAILED.overlap');
  }
  if (result.error === 'CLOSED') {
    return t('BOOKING_CREATE_FAILED.closed');
  }
  if (result.error === 'GUEST_DUPLICATE') {
    return t('BOOKING_CREATE_FAILED.guestDuplicate');
  }
  if (result.error === 'SUBSCRIPTION_INACTIVE') {
    return t('SUBSCRIPTION_INACTIVE');
  }
  return t('BOOKING_CREATE_FAILED.generic');
}

export async function POST(request: Request) {
  const { t, formatAmount } = await getApiRouteContext();
  const gate = await requireActiveSale(t);
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
    const message = bookingCreateMessage(t, result, formatAmount);
    const status = result.error === 'SUBSCRIPTION_INACTIVE' ? 403 : 400;
    return NextResponse.json(fail('BOOKING_CREATE_FAILED', message), {
      status,
    });
  }

  return NextResponse.json(ok({ booking: result.booking }));
}

export async function PATCH(request: Request) {
  const { t, formatAmount } = await getApiRouteContext();
  const gate = await requireActiveSale(t);
  if ('error' in gate) return gate.error;
  const { profile } = gate;

  const body = await request.json();
  const bookingId = String(body.bookingId || '');
  const action = String(body.action || '');

  if (action === 'submit_to_owner' || action === 'confirm') {
    const result = await submitToOwner({
      bookingId,
      saleId: profile.id,
      amountCollected: Number(body.amountCollected || 0),
    });
    if ('error' in result && result.error) {
      const message =
        result.error === 'NO_OWNER_EARN'
          ? t('NO_OWNER_EARN')
          : result.error === 'BELOW_OWNER_PAYOUT' && 'minOwnerPayout' in result
            ? t('BELOW_OWNER_PAYOUT', {
                amount: formatAmount(Number(result.minOwnerPayout)),
              })
            : result.error === 'BELOW_DEPOSIT' && 'minDeposit' in result
              ? t('BELOW_DEPOSIT', {
                  amount: formatAmount(Number(result.minDeposit)),
                })
              : result.error === 'OVERLAP'
                ? t('OVERLAP.submitConfirmed')
                : result.error === 'CLOSED'
                  ? t('CLOSED.submit')
                  : String(result.error);
      return NextResponse.json(fail(String(result.error), message), {
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
      return NextResponse.json(
        fail('CANCEL_FAILED', t('CANCEL_FAILED')),
        { status: 400 }
      );
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
          ? t('AMOUNT_REGRESSION.payment')
          : result.error === 'ABOVE_LIST'
            ? t('ABOVE_LIST')
            : result.error === 'LOCKED_AFTER_CONFIRM'
              ? t('LOCKED_AFTER_CONFIRM')
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
          ? t('AMOUNT_REGRESSION.ownerPayout')
          : result.error === 'ABOVE_OWNER_EARN'
            ? t('ABOVE_OWNER_EARN')
            : result.error === 'INVALID_STATUS'
              ? t('INVALID_STATUS.ownerPayout')
              : String(result.error);
      return NextResponse.json(fail(String(result.error), message), {
        status: 400,
      });
    }
    return NextResponse.json(ok({ booking: result.booking }));
  }

  return NextResponse.json(fail('INVALID_ACTION', t('INVALID_ACTION')), {
    status: 400,
  });
}
