import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { searchGuestProfiles } from '@/lib/engines/sale-guest-search';
import { fail, ok } from '@/lib/types';

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'SALE') {
    return NextResponse.json(fail('UNAUTHORIZED', 'Sale login required'), {
      status: 401,
    });
  }

  const q = new URL(request.url).searchParams.get('q') || '';
  const guests = await searchGuestProfiles(q);

  return NextResponse.json(ok({ guests }));
}
