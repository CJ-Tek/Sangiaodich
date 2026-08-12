import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { fail, ok } from '@/lib/types';
import {
  createPaymentIntent,
  getPendingIntentForProfile,
} from '@/lib/engines/subscription-payment';
import type { SubscriptionPlanRole } from '@/lib/engines/subscription-plans';

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile || (profile.role !== 'OWNER' && profile.role !== 'SALE')) {
    return NextResponse.json(fail('UNAUTHORIZED', 'Owner/Sale only'), {
      status: 401,
    });
  }

  const pending = await getPendingIntentForProfile(profile.id);
  return NextResponse.json(ok({ pending }));
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || (profile.role !== 'OWNER' && profile.role !== 'SALE')) {
    return NextResponse.json(fail('UNAUTHORIZED', 'Owner/Sale only'), {
      status: 401,
    });
  }

  const body = await request.json().catch(() => ({}));
  const planId = String(body.planId || '');
  if (!planId) {
    return NextResponse.json(fail('INVALID', 'planId required'), {
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
    const msg = e instanceof Error ? e.message : 'CREATE_FAILED';
    const status =
      msg === 'PLAN_NOT_FOUND' || msg === 'PLAN_ROLE_MISMATCH' ? 400 : 500;
    return NextResponse.json(fail(msg, msg), { status });
  }
}
