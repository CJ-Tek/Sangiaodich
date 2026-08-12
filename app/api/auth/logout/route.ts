import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fail, ok } from '@/lib/types';

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json(fail('LOGOUT_FAILED', error.message), {
      status: 500,
    });
  }
  return NextResponse.json(ok({ loggedOut: true }));
}
