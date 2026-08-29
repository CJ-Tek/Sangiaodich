import { NextResponse } from 'next/server';
import { getApiErrorTranslator } from '@/lib/i18n/api-errors';
import { createClient } from '@/lib/supabase/server';
import { fail, ok } from '@/lib/types';

export async function POST() {
  const t = await getApiErrorTranslator();
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json(
      fail('LOGOUT_FAILED', error.message || t('LOGOUT_FAILED')),
      { status: 500 }
    );
  }
  return NextResponse.json(ok({ loggedOut: true }));
}
