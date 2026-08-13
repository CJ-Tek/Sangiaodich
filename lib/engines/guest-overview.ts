import { createClient } from '@/lib/supabase/server';
import { todayDateOnly } from '@/lib/dates';

export type GuestTierProgress = {
  currentLabel: string;
  nextLabel: string | null;
  atMaxTier: boolean;
  progressBooks: number;
  progressGmv: number;
  neededBooks: number;
  neededGmv: number;
  remainingBooks: number;
  remainingGmv: number;
  /** 0-100, gated by whichever requirement is further behind. */
  percent: number;
};

export type GuestUpcomingBooking = {
  id: string;
  assetTitle: string;
  checkIn: string;
  checkOut: string;
  status: string;
};

export type GuestOverview = {
  lifetimeBooks: number;
  lifetimeGmv: number;
  tier: GuestTierProgress;
  upcoming: GuestUpcomingBooking | null;
};

const STAY_STATUSES = ['PENDING', 'AWAITING_OWNER', 'CONFIRMED', 'CHECKED_IN'];

/**
 * Rank-up needs both the book count and the GMV threshold, so the bar tracks
 * the requirement that is further behind. Showing only books would read 100%
 * while the guest still cannot rank up.
 */
export function tierProgressPercent(input: {
  progressBooks: number;
  progressGmv: number;
  neededBooks: number;
  neededGmv: number;
}): number {
  const ratios: number[] = [];
  if (input.neededBooks > 0) {
    ratios.push(input.progressBooks / input.neededBooks);
  }
  if (input.neededGmv > 0) {
    ratios.push(input.progressGmv / input.neededGmv);
  }
  if (!ratios.length) return 100;
  return Math.round(Math.min(1, Math.min(...ratios)) * 100);
}

export async function loadGuestOverview(
  guestId: string
): Promise<GuestOverview> {
  const db = await createClient();
  const today = todayDateOnly();

  const [{ data: state }, { data: tiers }, { data: upcomingRows }] =
    await Promise.all([
      db
        .from('guest_membership_states')
        .select('*, guest_membership_tiers(label, sort)')
        .eq('guest_id', guestId)
        .maybeSingle(),
      db
        .from('guest_membership_tiers')
        .select('id, sort, label, min_books, min_gmv')
        .order('sort'),
      db
        .from('bookings')
        .select('id, status, check_in, check_out, assets(title)')
        .eq('guest_id', guestId)
        .in('status', STAY_STATUSES)
        .gte('check_out', today)
        .order('check_in', { ascending: true })
        .limit(1),
    ]);

  const allTiers = (tiers || []).map((t) => ({
    sort: Number(t.sort),
    label: (t.label as string) || `Tier ${t.sort}`,
    minBooks: Number(t.min_books || 0),
    minGmv: Number(t.min_gmv || 0),
  }));

  const currentJoin = state?.guest_membership_tiers as
    | { label?: string; sort?: number }
    | { label?: string; sort?: number }[]
    | null;
  const current = Array.isArray(currentJoin) ? currentJoin[0] : currentJoin;
  const currentSort = current?.sort ?? allTiers[0]?.sort ?? 0;
  const next = allTiers.find((t) => t.sort === currentSort + 1) || null;

  const progressBooks = Number(state?.progress_books || 0);
  const progressGmv = Number(state?.progress_gmv || 0);
  const neededBooks = next?.minBooks ?? 0;
  const neededGmv = next?.minGmv ?? 0;

  const upcomingRow = (upcomingRows || [])[0];
  const upcomingAsset = upcomingRow?.assets as unknown as
    | { title?: string }
    | { title?: string }[]
    | null;
  const upcomingTitle = Array.isArray(upcomingAsset)
    ? upcomingAsset[0]?.title
    : upcomingAsset?.title;

  return {
    lifetimeBooks: Number(state?.lifetime_books || 0),
    lifetimeGmv: Number(state?.lifetime_gmv || 0),
    tier: {
      currentLabel:
        current?.label || allTiers[0]?.label || 'Tier 0',
      nextLabel: next?.label ?? null,
      atMaxTier: !next,
      progressBooks,
      progressGmv,
      neededBooks,
      neededGmv,
      remainingBooks: Math.max(0, neededBooks - progressBooks),
      remainingGmv: Math.max(0, neededGmv - progressGmv),
      percent: tierProgressPercent({
        progressBooks,
        progressGmv,
        neededBooks,
        neededGmv,
      }),
    },
    upcoming: upcomingRow
      ? {
          id: upcomingRow.id as string,
          assetTitle: upcomingTitle || 'Villa',
          checkIn: upcomingRow.check_in as string,
          checkOut: upcomingRow.check_out as string,
          status: upcomingRow.status as string,
        }
      : null,
  };
}
