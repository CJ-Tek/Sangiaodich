import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/types';

function toUserRole(value: unknown): UserRole | null {
  if (value === 'ADMIN') return 'ADMIN';
  if (value === 'OWNER') return 'OWNER';
  if (value === 'SALE') return 'SALE';
  if (value === 'GUEST') return 'GUEST';
  return null;
}

/**
 * Lightweight auth lookup for public pages.
 * Reads role from Supabase Auth metadata and avoids querying `profiles`.
 */
export async function getSessionRoleHint(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return null;

  return (
    toUserRole(user.app_metadata?.role) ??
    toUserRole(user.user_metadata?.role) ??
    'GUEST'
  );
}
