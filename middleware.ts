import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const ROLE_PREFIX: Record<string, string> = {
  '/admin': 'ADMIN',
  '/owner': 'OWNER',
  '/sale': 'SALE',
};

/** Redirect while preserving cookies that updateSession may have refreshed. */
function redirectWithSession(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
  params?: Record<string, string>
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    redirectResponse.cookies.set(name, value, options);
  });
  return redirectResponse;
}

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
    return redirectWithSession(request, supabaseResponse, '/login', {
      next: path,
    });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, deleted_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.deleted_at) {
    return redirectWithSession(request, supabaseResponse, '/login', {
      error: 'account_trashed',
    });
  }

  const required = ROLE_PREFIX[protectedPrefix];
  if (!profile || profile.role !== required) {
    return redirectWithSession(request, supabaseResponse, '/');
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
