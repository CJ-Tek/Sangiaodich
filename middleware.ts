import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const ROLE_PREFIX: Record<string, string> = {
  '/admin': 'ADMIN',
  '/owner': 'OWNER',
  '/sale': 'SALE',
};

export async function middleware(request: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const protectedPrefix = Object.keys(ROLE_PREFIX).find((p) =>
    path.startsWith(p)
  );

  if (!protectedPrefix) {
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, deleted_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.deleted_at) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'account_trashed');
    return NextResponse.redirect(url);
  }

  const required = ROLE_PREFIX[protectedPrefix];
  if (!profile || profile.role !== required) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/owner/:path*',
    '/sale/:path*',
    '/me/:path*',
    '/login',
  ],
};
