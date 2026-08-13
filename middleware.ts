import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const ROLE_PREFIX: Record<string, string> = {
  '/admin': 'ADMIN',
  '/owner': 'OWNER',
  '/sale': 'SALE',
};

/** Opt-in: this used to write a line per request, including static assets. */
const PERF_LOG_ENABLED = process.env.MIDDLEWARE_PERF_LOG === '1';

function logMiddlewarePerf(input: {
  path: string;
  outcome: 'pass' | 'redirect_login' | 'redirect_root' | 'redirect_trashed';
  sessionMs: number;
  profileMs: number;
  totalMs: number;
}) {
  if (!PERF_LOG_ENABLED) return;
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
  const { supabase, userId, role, supabaseResponse } =
    await updateSession(request);
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

  // The role gate reads the JWT, so a wrong-role request never touches the
  // database.
  if (role !== ROLE_PREFIX[protectedPrefix]) {
    logMiddlewarePerf({
      path,
      outcome: 'redirect_root',
      sessionMs,
      profileMs: 0,
      totalMs: Date.now() - startedAt,
    });
    return redirectWithSession(request, supabaseResponse, '/');
  }

  // Soft delete leaves the auth session valid, and several admin pages have no
  // requireRole of their own, so this stays the only gate that revokes a
  // trashed account immediately. It is a primary-key lookup.
  const profileStartedAt = Date.now();
  const { data: profile } = await supabase
    .from('profiles')
    .select('deleted_at')
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

  if (!profile) {
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
