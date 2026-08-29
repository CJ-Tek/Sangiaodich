import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import {
  checkInBooking,
  checkOutBooking,
  ownerConfirmBooking,
  ownerRejectBooking,
} from '@/lib/engines/booking-service';
import { assertActiveSubscription } from '@/lib/engines/subscription-access';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { translateEngineError } from '@/lib/i18n/engine-error';
import { fail, ok } from '@/lib/types';

async function requireActiveOwner(
  t: Awaited<ReturnType<typeof import('@/lib/i18n/api-route-context').getApiRouteContext>>['t']
) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'OWNER') {
    return {
      error: NextResponse.json(fail('UNAUTHORIZED', t('UNAUTHORIZED.ownerOnly')), {
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

export async function PATCH(request: Request) {
  const { t } = await getApiRouteContext();
  const gate = await requireActiveOwner(t);
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
          ? t('OVERLAP.ownerConfirm')
          : result.error === 'CLOSED'
            ? t('CLOSED.ownerConfirm')
            : result.error === 'INVALID_STATUS'
              ? t('INVALID_STATUS.ownerConfirm')
              : result.error === 'FORBIDDEN'
                ? t('FORBIDDEN.notYourAssetGeneric')
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
          ? t('INVALID_STATUS.ownerConfirm')
          : result.error === 'FORBIDDEN'
            ? t('FORBIDDEN.notYourAssetGeneric')
            : String(result.error);
      return NextResponse.json(fail(String(result.error), message), {
        status: 400,
      });
    }
    return NextResponse.json(ok({ booking: result.booking }));
  }

  if (action === 'check_in') {
    const result = await checkInBooking({
      bookingId,
      ownerId: profile.id,
      guestPaidOwnerAmount:
        body.guestPaidOwnerAmount != null
          ? Number(body.guestPaidOwnerAmount)
          : undefined,
    });
    if ('error' in result && result.error) {
      const message =
        result.error === 'INVALID_STATUS'
          ? t('INVALID_STATUS.checkIn')
          : result.error === 'GUEST_BALANCE_DUE'
            ? t('GUEST_BALANCE_DUE')
            : result.error === 'AMOUNT_REGRESSION'
              ? t('AMOUNT_REGRESSION.checkIn')
              : result.error === 'ABOVE_REMAINDER'
                ? t('ABOVE_REMAINDER')
                : result.error === 'FORBIDDEN'
                  ? t('FORBIDDEN.notYourAssetBooking')
                  : String(result.error);
      return NextResponse.json(fail(String(result.error), message), {
        status: 400,
      });
    }
    return NextResponse.json(ok({ booking: result.booking }));
  }

  if (action === 'check_out') {
    const result = await checkOutBooking({
      bookingId,
      ownerId: profile.id,
    });
    if ('error' in result && result.error) {
      const message =
        result.error === 'INVALID_STATUS'
          ? t('INVALID_STATUS.checkOut')
          : result.error === 'FORBIDDEN'
            ? t('FORBIDDEN.notYourAssetBooking')
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
