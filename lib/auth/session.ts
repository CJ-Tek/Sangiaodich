import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/types';

export type SessionProfile = {
  id: string;
  role: UserRole;
  phone: string | null;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  national_id: string | null;
};

export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select(
      'id, role, phone, email, full_name, avatar_url, national_id, deleted_at'
    )
    .eq('id', user.id)
    .maybeSingle();

  if (!data || data.deleted_at) return null;

  return {
    id: data.id,
    role: data.role,
    phone: data.phone,
    email: data.email,
    full_name: data.full_name,
    avatar_url: data.avatar_url,
    national_id: data.national_id,
  } as SessionProfile;
}

export async function requireRole(roles: UserRole[]): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile || !roles.includes(profile.role)) {
    throw new Error('UNAUTHORIZED');
  }
  return profile;
}

export async function writeAudit(
  actorId: string,
  action: string,
  payload: Record<string, unknown>
) {
  const admin = createServiceClient();
  await admin.from('audit_logs').insert({
    actor_id: actorId,
    action,
    payload,
  });
}
