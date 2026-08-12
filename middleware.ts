import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const ROLE_PREFIX: Record<string, string> = {
  '/admin': 'ADMIN',
  '/owner': 'OWNER',
  '/sale': 'SALE',
};

function logMiddlewarePerf(input: {
  path: string;
  outcome: 'pass' | 'redirect_login' | 'redirect_root' | 'redirect_trashed';
  sessionMs: number;
  profileMs: number;
  totalMs: number;
}) {
  console.info(
    `[perf] ${JSON.stringify({
      scope: 'middleware',
      ...input,
    })}`
  );
}

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
  const startedAt = Date.now();
  const sessionStartedAt = Date.now();
  const { supabase, userId, supabaseResponse } = await updateSession(request);
  const sessionMs = Date.now() - sessionStartedAt;
  const path = request.nextUrl.pathname;

  const protectedPrefix = Object.keys(ROLE_PREFIX).find((p) =>
    path.startsWith(p)
  );

  if (!protectedPrefix) {
    logMiddlewarePerf({
      path,
      outcome: 'pass',
      sessionMs,
      profileMs: 0,
      totalMs: Date.now() - startedAt,
    });
    return supabaseResponse;
  }

  if (!userId) {
    logMiddlewarePerf({
      path,
      outcome: 'redirect_login',
      sessionMs,
      profileMs: 0,
      totalMs: Date.now() - startedAt,
    });
    return redirectWithSession(request, supabaseResponse, '/login', {
      next: path,
    });
  }

  const profileStartedAt = Date.now();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, deleted_at')
    .eq('id', userId)
    .maybeSingle();
  const profileMs = Date.now() - profileStartedAt;

  if (profile?.deleted_at) {
    logMiddlewarePerf({
      path,
      outcome: 'redirect_trashed',
      sessionMs,
      profileMs,
      totalMs: Date.now() - startedAt,
    });
    return redirectWithSession(request, supabaseResponse, '/login', {
      error: 'account_trashed',
    });
  }

  const required = ROLE_PREFIX[protectedPrefix];
  if (!profile || profile.role !== required) {
    logMiddlewarePerf({
      path,
      outcome: 'redirect_root',
      sessionMs,
      profileMs,
      totalMs: Date.now() - startedAt,
    });
    return redirectWithSession(request, supabaseResponse, '/');
  }

  logMiddlewarePerf({
    path,
    outcome: 'pass',
    sessionMs,
    profileMs,
    totalMs: Date.now() - startedAt,
  });
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/owner/:path*',
    '/sale/:path*',
  ],
};
