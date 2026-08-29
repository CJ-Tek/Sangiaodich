import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { rateLimit } from '@/lib/kv/rate-limit';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { fail, ok } from '@/lib/types';

export async function POST(request: Request) {
  const { t } = await getApiRouteContext();
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'GUEST') {
    return NextResponse.json(
      fail('UNAUTHORIZED', t('UNAUTHORIZED.guestLoginRequired')),
      { status: 401 }
    );
  }

  const body = await request.json();
  const assetId = String(body.assetId || '');
  if (!assetId) {
    return NextResponse.json(fail('INVALID', t('INVALID.assetIdRequired')), {
      status: 400,
    });
  }

  const rl = await rateLimit(`lead:${profile.id}:${assetId}`, 3, 60 * 60);
  if (!rl.success) {
    return NextResponse.json(fail('RATE_LIMIT', t('RATE_LIMIT.leads')), {
      status: 429,
    });
  }

  const admin = createServiceClient();
  const { data: asset } = await admin
    .from('assets')
    .select('id, status')
    .eq('id', assetId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!asset) {
    return NextResponse.json(
      fail('NOT_FOUND', t('NOT_FOUND.assetUnavailable')),
      { status: 404 }
    );
  }

  const { data: lead, error } = await admin
    .from('lead_requests')
    .insert({ asset_id: assetId, guest_id: profile.id })
    .select('id')
    .single();

  if (error || !lead) {
    return NextResponse.json(
      fail('CREATE_FAILED', error?.message || t('CREATE_FAILED')),
      { status: 500 }
    );
  }

  return NextResponse.json(ok({ leadId: lead.id }));
}
