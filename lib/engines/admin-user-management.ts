import { createServiceClient } from '@/lib/supabase/server';
import { writeAudit } from '@/lib/auth/session';
import { todayDateOnly } from '@/lib/dates';
import { escapeIlikePattern, vnPhoneSearchVariants } from '@/lib/phone/vn-search';
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

const PROFILE_COLUMNS =
  'id, role, full_name, phone, email, deleted_at, deleted_by, delete_reason';

export const ADMIN_USERS_PAGE_SIZE = 25;

export const ADMIN_USER_TABS = [
  'OWNER',
  'SALE',
  'GUEST',
  'ADMIN',
  'TRASH',
] as const;

export type AdminUserTab = (typeof ADMIN_USER_TABS)[number];

export type AdminUsersPage = {
  users: AdminUserRow[];
  plans: SubscriptionPlan[];
  tab: AdminUserTab;
  q: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  counts: Record<AdminUserTab, number>;
};

export function parseAdminUserTab(raw?: string | null): AdminUserTab {
  const value = String(raw || '').toUpperCase();
  return ADMIN_USER_TABS.includes(value as AdminUserTab)
    ? (value as AdminUserTab)
    : 'OWNER';
}

/** Same fields as matchesAdminUserSearch, expressed for the database. */
function searchFilter(q: string): string | null {
  const trimmed = q.trim();
  if (!trimmed) return null;

  const escaped = escapeIlikePattern(trimmed);
  const parts = [`full_name.ilike.%${escaped}%`, `email.ilike.%${escaped}%`];
  for (const variant of vnPhoneSearchVariants(trimmed)) {
    parts.push(`phone.ilike.%${escapeIlikePattern(variant)}%`);
  }
  return parts.join(',');
}

/**
 * The trash tab is the soft-deleted rows of every role; the others are one live
 * role each.
 */
async function countTab(
  admin: ReturnType<typeof createServiceClient>,
  tab: AdminUserTab,
  filter: string | null
): Promise<number> {
  const base = admin.from('profiles').select('id', {
    count: 'exact',
    head: true,
  });
  let query =
    tab === 'TRASH'
      ? base.not('deleted_at', 'is', null)
      : base.eq('role', tab).is('deleted_at', null);
  if (filter) query = query.or(filter);
  const { count } = await query;
  return count || 0;
}

export async function listAdminUsers(input?: {
  tab?: string | null;
  q?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<AdminUsersPage> {
  const admin = createServiceClient();
  const tab = parseAdminUserTab(input?.tab);
  const q = (input?.q || '').trim();
  const pageSize = Math.min(
    Math.max(input?.pageSize ?? ADMIN_USERS_PAGE_SIZE, 1),
    100
  );
  const filter = searchFilter(q);

  const counts = Object.fromEntries(
    await Promise.all(
      ADMIN_USER_TABS.map(
        async (t) => [t, await countTab(admin, t, filter)] as const
      )
    )
  ) as Record<AdminUserTab, number>;

  const total = counts[tab];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(input?.page ?? 1, 1), totalPages);
  const from = (page - 1) * pageSize;

  let listQuery = admin.from('profiles').select(PROFILE_COLUMNS);
  listQuery =
    tab === 'TRASH'
      ? listQuery.not('deleted_at', 'is', null)
      : listQuery.eq('role', tab).is('deleted_at', null);
  if (filter) listQuery = listQuery.or(filter);

  const { data: profiles, error: profilesErr } = await listQuery
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);
  if (profilesErr) {
    throw new AdminUserError('LIST_FAILED', profilesErr.message);
  }

  const pageIds = (profiles || []).map((u) => u.id);

  // Only the subscriptions of the rows actually rendered.
  const { data: subs } = pageIds.length
    ? await admin
        .from('subscriptions')
        .select('profile_id, status, period_end')
        .in('profile_id', pageIds)
        .order('period_end', { ascending: false })
        .limit(pageIds.length * 20)
    : { data: [] };

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

  return {
    users,
    plans,
    tab,
    q,
    page,
    pageSize,
    total,
    totalPages,
    counts,
  };
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
    throw new AdminUserError('IN_TRASH', 'IN_TRASH');
  }
  if (target.role !== 'OWNER' && target.role !== 'SALE') {
    throw new AdminUserError('INVALID_ROLE', 'INVALID_ROLE');
  }

  const { data: latest } = await admin
    .from('subscriptions')
    .select('id, status, period_end')
    .eq('profile_id', input.profileId)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) {
    throw new AdminUserError('NO_SUB', 'NO_SUB');
  }
  if (latest.status !== 'ACTIVE') {
    throw new AdminUserError('NOT_ACTIVE', latest.status);
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
    throw new AdminUserError('SELF_DELETE', 'SELF_DELETE');
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
    throw new AdminUserError('ALREADY_TRASHED', 'ALREADY_TRASHED');
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
    throw new AdminUserError('RACE_SOFT_DELETE', 'RACE_SOFT_DELETE');
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
    throw new AdminUserError('NOT_IN_TRASH', 'NOT_IN_TRASH');
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
    throw new AdminUserError('RACE_RESTORE', 'RACE_RESTORE');
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
