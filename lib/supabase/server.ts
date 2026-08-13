import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Memoized per request, never across requests: the client is bound to the
 * caller's cookies, so a module-level instance would leak sessions between
 * users. Layout, page and nested components all resolve a client, and each
 * uncached call builds a full Postgrest/Auth/Realtime/Storage stack.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — ignore.
          }
        },
      },
    }
  );
});

function buildServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

// Typed off the non-generic wrapper: reading it off `createSupabaseClient`
// resolves its type parameters to their defaults and every `.from()` collapses
// to `never`.
let serviceClient: ReturnType<typeof buildServiceClient> | null = null;

/**
 * Service-role client — bypasses RLS. Use only after explicit authz checks,
 * or for cron/webhooks/OTP admin Auth APIs. Prefer `createClient()` + RLS for reads.
 *
 * Shared process-wide: it carries no session (`persistSession: false`) and no
 * refresh timer, while call chains such as booking cancel or subscription
 * activation would otherwise build one full client per helper they call.
 */
export function createServiceClient() {
  if (!serviceClient) {
    serviceClient = buildServiceClient();
  }
  return serviceClient;
}
