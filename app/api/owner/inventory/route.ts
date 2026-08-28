import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { assertActiveSubscription } from '@/lib/engines/subscription-access';
import {
  setAssetNightClosed,
  setAssetNightlyCost,
} from '@/lib/engines/owner-inventory';
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

function messageFor(code: string) {
  if (code === 'PAST_NIGHT') return 'Không sửa đêm đã qua';
  if (code === 'LOCKED') return 'Đêm đã khóa booking — không đóng được';
  if (code === 'HOLD') return 'Đêm đang giữ chỗ — không đóng được';
  if (code === 'FORBIDDEN' || code === 'NOT_FOUND') {
    return 'Không phải căn của bạn';
  }
  if (code === 'INVALID_DATE') return 'Ngày không hợp lệ';
  return code;
}

export async function PATCH(request: Request) {
  const gate = await requireActiveOwner();
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
      return NextResponse.json(fail(result.error, messageFor(result.error)), {
        status: 400,
      });
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
      return NextResponse.json(fail('INVALID_COST', 'Giá đêm không hợp lệ'), {
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
      return NextResponse.json(fail(result.error, messageFor(result.error)), {
        status: 400,
      });
    }
    return NextResponse.json(ok({ night, cost }));
  }

  return NextResponse.json(fail('INVALID_ACTION', 'Unknown action'), {
    status: 400,
  });
}
