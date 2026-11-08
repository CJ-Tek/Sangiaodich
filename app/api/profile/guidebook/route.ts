import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { isGuideStepId, type GuideRole } from '@/lib/guide/chapters';
import { createClient } from '@/lib/supabase/server';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { fail, ok } from '@/lib/types';

const GUIDE_ROLES = new Set<GuideRole>(['OWNER', 'SALE', 'GUEST']);

export async function PATCH(request: Request) {
  const { t } = await getApiRouteContext();
  const profile = await getSessionProfile();
  if (!profile || !GUIDE_ROLES.has(profile.role as GuideRole)) {
    return NextResponse.json(fail('UNAUTHORIZED', t('UNAUTHORIZED.loginRequired')), {
      status: 401,
    });
  }
  const role = profile.role as GuideRole;
  const body = await request.json().catch(() => null);
  const stepId = typeof body?.stepId === 'string' ? body.stepId.trim() : '';
  if (!stepId || !isGuideStepId(role, stepId)) {
    return NextResponse.json(fail('INVALID', t('INVALID.guidebookStep')), { status: 400 });
  }

  const completed = profile.guidebookCompleted.includes(stepId)
    ? profile.guidebookCompleted
    : [...profile.guidebookCompleted, stepId];

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      guidebook_completed: completed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id);
  if (error) {
    return NextResponse.json(fail('UPDATE_FAILED', error.message), { status: 400 });
  }
  return NextResponse.json(ok({ guidebookCompleted: completed }));
}
