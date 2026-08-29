import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getRequiredSecret } from '@/lib/security/secrets';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { fail, ok } from '@/lib/types';

export async function GET(request: Request) {
  const { t } = await getApiRouteContext();
  const secret = getRequiredSecret('CRON_SECRET');
  if (!secret) {
    return NextResponse.json(fail('MISCONFIGURED', t('MISCONFIGURED')), {
      status: 503,
    });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      fail('UNAUTHORIZED', t('UNAUTHORIZED.invalidCronSecret')),
      { status: 401 }
    );
  }

  const admin = createServiceClient();

  const { data, error } = await admin
    .rpc('expire_due_subscriptions')
    .maybeSingle<{
      expired_subscriptions: number;
      suspended_assets: number;
    }>();

  if (error) {
    return NextResponse.json(fail('EXPIRE_FAILED', error.message), {
      status: 500,
    });
  }

  const { data: purged, error: purgeError } = await admin.rpc(
    'purge_sepay_webhook_events'
  );
  if (purgeError) {
    console.error('[cron] webhook purge failed', purgeError.message);
  }

  return NextResponse.json(
    ok({
      expired: Number(data?.expired_subscriptions || 0),
      suspendedAssets: Number(data?.suspended_assets || 0),
      purgedWebhookEvents: Number(purged || 0),
    })
  );
}
