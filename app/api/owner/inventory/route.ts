import { NextResponse } from 'next/server';
import { assertActiveSubscription } from '@/lib/engines/subscription-access';
import {
  setAssetNightClosed,
  setAssetNightlyCost,
} from '@/lib/engines/owner-inventory';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { requireActiveRole, translateEngineError } from '@/lib/i18n/engine-error';
import { fail, ok } from '@/lib/types';

export async function PATCH(request: Request) {
  const { t } = await getApiRouteContext();
  const gate = await requireActiveRole('OWNER', t);
  if ('error' in gate) return gate.error;
  const { profile } = gate;
  const body = await request.json();
  const assetId = String(body.assetId || '');
  const night = String(body.night || '');
  const action = String(body.action || '');

  if (action === 'close' || action === 'open') {
    const result = await setAssetNightClosed({
      ownerId: profile.id,
      assetId,
      night,
      closed: action === 'close',
    });
    if (result.error) {
      return NextResponse.json(
        fail(result.error, translateEngineError(t, result.error)),
        { status: 400 }
      );
    }
    return NextResponse.json(ok({ night, closed: action === 'close' }));
  }

  if (action === 'set_cost') {
    const raw = body.cost;
    const cost =
      raw === null || raw === undefined || raw === ''
        ? null
        : Number(raw);
    if (cost != null && (!Number.isFinite(cost) || cost < 0)) {
      return NextResponse.json(fail('INVALID_COST', t('INVALID_COST')), {
        status: 400,
      });
    }
    const result = await setAssetNightlyCost({
      ownerId: profile.id,
      assetId,
      night,
      cost,
    });
    if (result.error) {
      return NextResponse.json(
        fail(result.error, translateEngineError(t, result.error)),
        { status: 400 }
      );
    }
    return NextResponse.json(ok({ night, cost }));
  }

  return NextResponse.json(fail('INVALID_ACTION', t('INVALID_ACTION')), {
    status: 400,
  });
}
