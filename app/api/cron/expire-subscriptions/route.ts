import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getRequiredSecret } from '@/lib/security/secrets';
import { fail, ok } from '@/lib/types';

export async function GET(request: Request) {
  const secret = getRequiredSecret('CRON_SECRET');
  if (!secret) {
    return NextResponse.json(
      fail('MISCONFIGURED', 'CRON_SECRET is not configured'),
      { status: 503 }
    );
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json(fail('UNAUTHORIZED', 'Invalid cron secret'), {
      status: 401,
    });
  }

  const admin = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: expired } = await admin
    .from('subscriptions')
    .select('id, profile_id, profiles!inner(role)')
    .eq('status', 'ACTIVE')
    .lt('period_end', today);

  let suspendedAssets = 0;
  for (const sub of expired || []) {
    await admin
      .from('subscriptions')
      .update({ status: 'EXPIRED' })
      .eq('id', sub.id);

    const role = (sub.profiles as { role?: string } | { role?: string }[]) &&
      !Array.isArray(sub.profiles)
      ? (sub.profiles as { role: string }).role
      : Array.isArray(sub.profiles)
        ? sub.profiles[0]?.role
        : undefined;

    if (role === 'OWNER') {
      const { data } = await admin
        .from('assets')
        .update({ status: 'SUSPENDED' })
        .eq('owner_id', sub.profile_id)
        .eq('status', 'ACTIVE')
        .select('id');
      suspendedAssets += data?.length || 0;
    }
  }

  return NextResponse.json(
    ok({ expired: expired?.length || 0, suspendedAssets })
  );
}
