import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { upsertSaleRating } from '@/lib/engines/sale-ratings';
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

async function handleUpsert(request: Request) {
  const { t } = await getApiRouteContext();
  const gate = await requireActiveOwner(t);
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
    return NextResponse.json(
      fail(
        result.error,
        result.error === 'FORBIDDEN'
          ? t('FORBIDDEN.notYourAssetBooking')
          : translateEngineError(t, result.error)
      ),
      { status }
    );
  }

  return NextResponse.json(ok({ rating: result.rating }));
}

export async function POST(request: Request) {
  return handleUpsert(request);
}

export async function PATCH(request: Request) {
  return handleUpsert(request);
}
