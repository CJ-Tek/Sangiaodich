import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { fail, ok } from '@/lib/types';
import {
  createPaymentIntent,
  getIntentStatus,
  getPendingIntentForProfile,
} from '@/lib/engines/subscription-payment';
import type { SubscriptionPlanRole } from '@/lib/engines/subscription-plans';

export async function GET(request: Request) {
  const { t } = await getApiRouteContext();
  const profile = await getSessionProfile();
  if (!profile || (profile.role !== 'OWNER' && profile.role !== 'SALE')) {
    return NextResponse.json(
      fail('UNAUTHORIZED', t('UNAUTHORIZED.ownerSaleOnly')),
      { status: 401 }
    );
  }

  const intentId = new URL(request.url).searchParams.get('intentId');
  if (intentId) {
    const intent = await getIntentStatus({
      profileId: profile.id,
      intentId,
    });
    return NextResponse.json(ok({ intent }));
  }

  const pending = await getPendingIntentForProfile(profile.id);
  return NextResponse.json(ok({ pending }));
}

export async function POST(request: Request) {
  const { t } = await getApiRouteContext();
  const profile = await getSessionProfile();
  if (!profile || (profile.role !== 'OWNER' && profile.role !== 'SALE')) {
    return NextResponse.json(
      fail('UNAUTHORIZED', t('UNAUTHORIZED.ownerSaleOnly')),
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const planId = String(body.planId || '');
  if (!planId) {
    return NextResponse.json(fail('INVALID', t('planIdRequired')), {
      status: 400,
    });
  }

  try {
    const intent = await createPaymentIntent({
      profileId: profile.id,
      role: profile.role as SubscriptionPlanRole,
      planId,
    });
    return NextResponse.json(ok(intent));
  } catch (e) {
    const code = e instanceof Error ? e.message : 'CREATE_FAILED';
    const message =
      code === 'PLAN_NOT_FOUND'
        ? t('INVALID.planNotFound')
        : code === 'PLAN_ROLE_MISMATCH'
          ? t('INVALID.planRoleMismatch')
          : t('CREATE_FAILED');
    const status =
      code === 'PLAN_NOT_FOUND' || code === 'PLAN_ROLE_MISMATCH' ? 400 : 500;
    return NextResponse.json(fail(code, message), { status });
  }
}
