import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { updateSession } from '@/lib/supabase/middleware';
import { routing } from '@/lib/i18n/routing';
import {
  localeFromPath,
  stripLocalePrefix,
  withLocalePath,
} from '@/lib/i18n/locale-path';

const intlMiddleware = createIntlMiddleware(routing);

const ROLE_PREFIX: Record<string, string> = {
  '/admin': 'ADMIN',
  '/owner': 'OWNER',
  '/sale': 'SALE',
};

/** Opt-in: this used to write a line per request, including static assets. */
const PERF_LOG_ENABLED = process.env.MIDDLEWARE_PERF_LOG === '1';

function logProxyPerf(input: {
  path: string;
  outcome: 'pass' | 'redirect_login' | 'redirect_root' | 'redirect_trashed';
  sessionMs: number;
  profileMs: number;
  totalMs: number;
}) {
  if (!PERF_LOG_ENABLED) return;
  console.info(
    `[perf] ${JSON.stringify({
      scope: 'proxy',
      ...input,
    })}`
  );
}

/** Redirect while preserving cookies that updateSession may have refreshed. */
function redirectWithSession(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
  locale: string,
  params?: Record<string, string>
) {
  const url = request.nextUrl.clone();
  url.pathname = withLocalePath(pathname, locale as 'vi' | 'en');
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

function mergeIntlCookies(
  target: NextResponse,
  source: NextResponse
): NextResponse {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });
  return target;
}

export async function proxy(request: NextRequest) {
  const startedAt = Date.now();
  const intlResponse = intlMiddleware(request);
  if (intlResponse.headers.get('location')) {
    return intlResponse;
  }

  const sessionStartedAt = Date.now();
  const { supabase, userId, role, supabaseResponse } =
    await updateSession(request);
  const sessionMs = Date.now() - sessionStartedAt;
  const path = request.nextUrl.pathname;
  const locale = localeFromPath(path);
  const strippedPath = stripLocalePrefix(path);

  const protectedPrefix = Object.keys(ROLE_PREFIX).find((p) =>
    strippedPath.startsWith(p)
  );

  if (!protectedPrefix) {
    logProxyPerf({
      path,
      outcome: 'pass',
      sessionMs,
      profileMs: 0,
      totalMs: Date.now() - startedAt,
    });
    return mergeIntlCookies(intlResponse, supabaseResponse);
  }

  if (!userId) {
    logProxyPerf({
      path,
      outcome: 'redirect_login',
      sessionMs,
      profileMs: 0,
      totalMs: Date.now() - startedAt,
    });
    return redirectWithSession(request, supabaseResponse, '/login', locale, {
      next: strippedPath,
    });
  }

  if (role !== ROLE_PREFIX[protectedPrefix]) {
    logProxyPerf({
      path,
      outcome: 'redirect_root',
      sessionMs,
      profileMs: 0,
      totalMs: Date.now() - startedAt,
    });
    return redirectWithSession(request, supabaseResponse, '/', locale);
  }

  const profileStartedAt = Date.now();
  const { data: profile } = await supabase
    .from('profiles')
    .select('deleted_at')
    .eq('id', userId)
    .maybeSingle();
  const profileMs = Date.now() - profileStartedAt;

  if (profile?.deleted_at) {
    logProxyPerf({
      path,
      outcome: 'redirect_trashed',
      sessionMs,
      profileMs,
      totalMs: Date.now() - startedAt,
    });
    return redirectWithSession(request, supabaseResponse, '/login', locale, {
      error: 'account_trashed',
    });
  }

  if (!profile) {
    logProxyPerf({
      path,
      outcome: 'redirect_root',
      sessionMs,
      profileMs,
      totalMs: Date.now() - startedAt,
    });
    return redirectWithSession(request, supabaseResponse, '/', locale);
  }

  logProxyPerf({
    path,
    outcome: 'pass',
    sessionMs,
    profileMs,
    totalMs: Date.now() - startedAt,
  });
  return mergeIntlCookies(intlResponse, supabaseResponse);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
