import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { markLeadsSeen } from '@/lib/engines/sale-leads';
import { fail, ok } from '@/lib/types';

export async function POST() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'SALE') {
    return NextResponse.json(fail('UNAUTHORIZED', 'Sale login required'), {
      status: 401,
    });
  }

  await markLeadsSeen();
  return NextResponse.json(ok({ seen: true }));
}
