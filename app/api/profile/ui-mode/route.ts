import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { parseUiMode } from '@/lib/engines/ui-mode';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { fail, ok } from '@/lib/types';

export async function PATCH(request: Request) {
  const { t } = await getApiRouteContext();
  const profile = await getSessionProfile();
  if (!profile || (profile.role !== 'OWNER' && profile.role !== 'SALE')) {
    return NextResponse.json(fail('UNAUTHORIZED', t('UNAUTHORIZED.ownerSaleOnly')), {
      status: 401,
    });
  }
  const body = await request.json();
  const uiMode = parseUiMode(body.uiMode);
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ ui_mode: uiMode, updated_at: new Date().toISOString() })
    .eq('id', profile.id);
  if (error) {
    return NextResponse.json(fail('UPDATE_FAILED', error.message), {
      status: 400,
    });
  }
  return NextResponse.json(ok({ uiMode }));
}
