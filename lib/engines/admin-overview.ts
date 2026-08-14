import { createServiceClient } from '@/lib/supabase/server';
import { parseYearMonth } from '@/lib/dates';

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

type OverviewCounts = {
  guests: number;
  owners: number;
  sales: number;
  active_paid_users: number;
  revenue_all: number;
  revenue_month: number;
};

export async function loadAdminOverviewStats(): Promise<AdminOverviewStats> {
  const admin = createServiceClient();
  const { yearMonth, startIso, endIso } = parseYearMonth();

  const [assets, pending, firmBookings, completedBookings, leads, counts] =
    await Promise.all([
      admin
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'DRAFT'),
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
      admin
        .rpc('admin_overview_counts', { p_start: startIso, p_end: endIso })
        .maybeSingle<OverviewCounts>(),
    ]);

  if (counts.error) throw new Error(counts.error.message);
  const totals = counts.data;

  return {
    pendingAssets: pending.count || 0,
    totalAssets: assets.count || 0,
    firmBookings: firmBookings.count || 0,
    completedBookings: completedBookings.count || 0,
    leadRequests: leads.count || 0,
    revenueAll: Number(totals?.revenue_all || 0),
    revenueMonth: Number(totals?.revenue_month || 0),
    yearMonth,
    activePaidUsers: Number(totals?.active_paid_users || 0),
    guests: Number(totals?.guests || 0),
    owners: Number(totals?.owners || 0),
    sales: Number(totals?.sales || 0),
  };
}
