import { createServiceClient } from '@/lib/supabase/server';
import { writeAudit } from '@/lib/auth/session';
import { todayDateOnly } from '@/lib/dates';
import type { UserRole } from '@/lib/types';
import type { SubscriptionPlan } from '@/lib/engines/subscription-plans';
import {
  AdminUserError,
  hardDeleteBlockedMessage,
  type AdminUserRow,
} from '@/lib/engines/admin-user-shared';

export type {
  AdminUserRow,
  AdminUserSub,
} from '@/lib/engines/admin-user-shared';
export {
  AdminUserError,
  hardDeleteBlockedMessage,
  matchesAdminUserSearch,
} from '@/lib/engines/admin-user-shared';

async function suspendOwnerActiveAssets(profileId: string) {
  const admin = createServiceClient();
  await admin
    .from('assets')
    .update({ status: 'SUSPENDED', updated_at: new Date().toISOString() })
    .eq('owner_id', profileId)
    .eq('status', 'ACTIVE');
}

export async function listAdminUsers(): Promise<{
  users: AdminUserRow[];
  plans: SubscriptionPlan[];
}> {
  const admin = createServiceClient();

  const { data: profiles, error: profilesErr } = await admin
    .from('profiles')
    .select(
      'id, role, full_name, phone, email, deleted_at, deleted_by, delete_reason'
    )
    .order('role');
  if (profilesErr) {
    throw new AdminUserError('LIST_FAILED', profilesErr.message);
  }

  const { data: subs } = await admin
    .from('subscriptions')
    .select('profile_id, status, period_end')
    .order('period_end', { ascending: false });

  const { data: plansRaw } = await admin
    .from('subscription_plans')
    .select(
      'id, role, months, amount, compare_at_amount, label, is_active, sort_order'
    )
    .eq('is_active', true)
    .order('sort_order');

  const latestSub = new Map<string, { status: string; period_end: string }>();
  for (const s of subs || []) {
    if (!latestSub.has(s.profile_id)) {
      latestSub.set(s.profile_id, {
        status: s.status,
        period_end: s.period_end,
      });
    }
  }

  const plans: SubscriptionPlan[] = (plansRaw || []).map((p) => ({
    ...p,
    role: p.role as 'OWNER' | 'SALE',
    amount: Number(p.amount),
    compare_at_amount:
      p.compare_at_amount == null ? null : Number(p.compare_at_amount),
    months: p.months as 1 | 3 | 6 | 12,
  }));

  const users: AdminUserRow[] = (profiles || []).map((u) => ({
    id: u.id,
    role: u.role as UserRole,
    full_name: u.full_name,
    phone: u.phone,
    email: u.email,
    deleted_at: u.deleted_at,
    deleted_by: u.deleted_by,
    delete_reason: u.delete_reason,
    subscription: latestSub.get(u.id) ?? null,
  }));

  return { users, plans };
}

export async function removeSubscription(input: {
  actorId: string;
  profileId: string;
}): Promise<{ subscriptionId: string; status: string }> {
  const admin = createServiceClient();
  const { data: target, error: targetErr } = await admin
    .from('profiles')
    .select('id, role, deleted_at')
    .eq('id', input.profileId)
    .maybeSingle();

  if (targetErr || !target) {
    throw new AdminUserError('NOT_FOUND', 'User not found');
  }
  if (target.deleted_at) {
    throw new AdminUserError('IN_TRASH', 'User đang trong trash');
  }
  if (target.role !== 'OWNER' && target.role !== 'SALE') {
    throw new AdminUserError(
      'INVALID_ROLE',
      'Chỉ gỡ subscription cho Owner/Sale'
    );
  }

  const { data: latest } = await admin
    .from('subscriptions')
    .select('id, status, period_end')
    .eq('profile_id', input.profileId)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) {
    throw new AdminUserError('NO_SUB', 'User chưa có subscription');
  }
  if (latest.status !== 'ACTIVE') {
    throw new AdminUserError(
      'NOT_ACTIVE',
      `Subscription hiện tại là ${latest.status}, không cần gỡ`
    );
  }

  const today = todayDateOnly();
  const { data: updated, error } = await admin
    .from('subscriptions')
    .update({
      status: 'EXPIRED',
      period_end: latest.period_end > today ? today : latest.period_end,
    })
    .eq('id', latest.id)
    .select('id, status')
    .single();

  if (error || !updated) {
    throw new AdminUserError(
      'UPDATE_FAILED',
      error?.message || 'Cannot expire subscription'
    );
  }

  if (target.role === 'OWNER') {
    await suspendOwnerActiveAssets(input.profileId);
  }

  await writeAudit(input.actorId, 'remove_subscription', {
    profileId: input.profileId,
    subscriptionId: updated.id,
  });

  return { subscriptionId: updated.id, status: updated.status };
}

export async function softDeleteUser(input: {
  actorId: string;
  profileId: string;
  reason?: string | null;
}): Promise<{ id: string; deleted_at: string }> {
  if (input.actorId === input.profileId) {
    throw new AdminUserError(
      'SELF_DELETE',
      'Không thể đưa chính tài khoản admin đang đăng nhập vào trash'
    );
  }

  const admin = createServiceClient();
  const { data: target, error: targetErr } = await admin
    .from('profiles')
    .select('id, role, deleted_at')
    .eq('id', input.profileId)
    .maybeSingle();

  if (targetErr || !target) {
    throw new AdminUserError('NOT_FOUND', 'User not found');
  }
  if (target.deleted_at) {
    throw new AdminUserError('ALREADY_TRASHED', 'User đã ở trong trash');
  }

  const deletedAt = new Date().toISOString();
  const reason = input.reason?.trim() || null;

  const { data: updated, error } = await admin
    .from('profiles')
    .update({
      deleted_at: deletedAt,
      deleted_by: input.actorId,
      delete_reason: reason,
      updated_at: deletedAt,
    })
    .eq('id', input.profileId)
    .is('deleted_at', null)
    .select('id, deleted_at')
    .maybeSingle();

  if (error) {
    throw new AdminUserError('UPDATE_FAILED', error.message);
  }
  if (!updated?.deleted_at) {
    throw new AdminUserError('RACE', 'Không thể soft delete (đã thay đổi)');
  }

  if (target.role === 'OWNER') {
    await suspendOwnerActiveAssets(input.profileId);
  }

  await writeAudit(input.actorId, 'soft_delete_user', {
    profileId: input.profileId,
    reason,
  });

  return { id: updated.id, deleted_at: updated.deleted_at };
}

export async function restoreUser(input: {
  actorId: string;
  profileId: string;
}): Promise<{ id: string }> {
  const admin = createServiceClient();
  const { data: target, error: targetErr } = await admin
    .from('profiles')
    .select('id, deleted_at')
    .eq('id', input.profileId)
    .maybeSingle();

  if (targetErr || !target) {
    throw new AdminUserError('NOT_FOUND', 'User not found');
  }
  if (!target.deleted_at) {
    throw new AdminUserError('NOT_IN_TRASH', 'User không nằm trong trash');
  }

  const { data: updated, error } = await admin
    .from('profiles')
    .update({
      deleted_at: null,
      deleted_by: null,
      delete_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.profileId)
    .not('deleted_at', 'is', null)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new AdminUserError('UPDATE_FAILED', error.message);
  }
  if (!updated) {
    throw new AdminUserError('RACE', 'Không thể restore (đã thay đổi)');
  }

  await writeAudit(input.actorId, 'restore_user', {
    profileId: input.profileId,
  });

  return { id: updated.id };
}

/** Policy: hard delete is permanently disabled. */
export function hardDeleteUser(_input?: {
  actorId?: string;
  profileId?: string;
}): never {
  throw new AdminUserError('HARD_DELETE_DISABLED', hardDeleteBlockedMessage());
}
