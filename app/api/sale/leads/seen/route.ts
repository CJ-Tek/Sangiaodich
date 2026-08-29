import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { markLeadsSeen } from '@/lib/engines/sale-leads';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { fail, ok } from '@/lib/types';

export async function POST() {
  const { t } = await getApiRouteContext();
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'SALE') {
    return NextResponse.json(
      fail('UNAUTHORIZED', t('UNAUTHORIZED.saleLoginRequired')),
      { status: 401 }
    );
  }

  await markLeadsSeen();
  return NextResponse.json(ok({ seen: true }));
}
