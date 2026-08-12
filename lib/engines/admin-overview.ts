import { createServiceClient } from '@/lib/supabase/server';
import { parseYearMonth, todayDateOnly } from '@/lib/dates';
import { isSubscriptionActive } from '@/lib/engines/subscription';

export type AdminOverviewStats = {
  pendingAssets: number;
  totalAssets: number;
  firmBookings: number;
  completedBookings: number;
  leadRequests: number;
  revenueAll: number;
  revenueMonth: number;
  yearMonth: string;
  activePaidUsers: number;
  guests: number;
  owners: number;
  sales: number;
};

function amountOf(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function inRange(iso: string | null | undefined, startMs: number, endMs: number) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t >= startMs && t < endMs;
}

export async function loadAdminOverviewStats(): Promise<AdminOverviewStats> {
  const admin = createServiceClient();
  const today = todayDateOnly();
  const { yearMonth, startIso, endIso } = parseYearMonth();
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();

  const [
    assets,
    pending,
    firmBookings,
    completedBookings,
    leads,
    profilesRes,
    subsRes,
    intentsRes,
    markPaidRes,
  ] = await Promise.all([
    admin.from('assets').select('*', { count: 'exact', head: true }),
    admin
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING_REVIEW'),
    admin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'CONFIRMED'),
    admin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['CHECKED_IN', 'CHECKED_OUT']),
    admin.from('lead_requests').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('id, role, deleted_at'),
    admin
      .from('subscriptions')
      .select('profile_id, status, period_end')
      .order('period_end', { ascending: false }),
    admin
      .from('subscription_payment_intents')
      .select('amount, paid_at')
      .eq('status', 'PAID'),
    admin.from('audit_logs').select('payload, created_at').eq('action', 'mark_paid'),
  ]);

  const alive = (profilesRes.data || []).filter((p) => !p.deleted_at);
  const guests = alive.filter((p) => p.role === 'GUEST').length;
  const owners = alive.filter((p) => p.role === 'OWNER').length;
  const sales = alive.filter((p) => p.role === 'SALE').length;

  const latest = new Map<string, { status: string; period_end: string }>();
  for (const s of subsRes.data || []) {
    if (!latest.has(s.profile_id)) {
      latest.set(s.profile_id, {
        status: s.status,
        period_end: s.period_end,
      });
    }
  }

  let activePaidUsers = 0;
  for (const p of alive) {
    if (p.role !== 'OWNER' && p.role !== 'SALE') continue;
    const sub = latest.get(p.id);
    if (
      sub &&
      isSubscriptionActive({
        status: sub.status,
        periodEnd: sub.period_end,
        today,
      })
    ) {
      activePaidUsers += 1;
    }
  }

  let revenueAll = 0;
  let revenueMonth = 0;

  for (const row of intentsRes.data || []) {
    const amt = amountOf(row.amount);
    revenueAll += amt;
    if (inRange(row.paid_at, startMs, endMs)) revenueMonth += amt;
  }

  for (const row of markPaidRes.data || []) {
    const payload = row.payload as { amount?: unknown } | null;
    const amt = amountOf(payload?.amount);
    revenueAll += amt;
    if (inRange(row.created_at, startMs, endMs)) revenueMonth += amt;
  }

  return {
    pendingAssets: pending.count || 0,
    totalAssets: assets.count || 0,
    firmBookings: firmBookings.count || 0,
    completedBookings: completedBookings.count || 0,
    leadRequests: leads.count || 0,
    revenueAll,
    revenueMonth,
    yearMonth,
    activePaidUsers,
    guests,
    owners,
    sales,
  };
}
