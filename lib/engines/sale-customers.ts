import { createServiceClient } from '@/lib/supabase/server';
import { fetchAllPages, fetchByIds } from '@/lib/supabase/query-guard';
import { normalizePhone } from '@/lib/auth/otp';
import {
  bookingNetPaid,
  remainingToNextRank,
  sumNetPaid,
} from '@/lib/engines/sale-customer-stats';
import {
  digitsOnly,
  escapeIlikePattern,
  vnPhoneSearchVariants,
} from '@/lib/phone/vn-search';

export type SavedCustomerChannel = 'ZALO' | 'FACEBOOK' | 'PHONE' | 'OTHER';
export type SavedCustomerIntent = 'HOT' | 'WARM' | 'COLD';
export type SavedCustomerStatus = 'ACTIVE' | 'CONVERTED' | 'ARCHIVED';

export type SavedCustomerRow = {
  id: string;
  sale_id: string;
  guest_id: string | null;
  full_name: string;
  phone: string;
  channel: SavedCustomerChannel;
  intent_level: SavedCustomerIntent;
  status: SavedCustomerStatus;
  note: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  converted_booking_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
};

const CHANNELS: SavedCustomerChannel[] = [
  'ZALO',
  'FACEBOOK',
  'PHONE',
  'OTHER',
];
const INTENTS: SavedCustomerIntent[] = ['HOT', 'WARM', 'COLD'];
const STATUSES: SavedCustomerStatus[] = ['ACTIVE', 'CONVERTED', 'ARCHIVED'];

export function parseChannel(raw: unknown): SavedCustomerChannel {
  const v = String(raw || 'OTHER').toUpperCase();
  return CHANNELS.includes(v as SavedCustomerChannel)
    ? (v as SavedCustomerChannel)
    : 'OTHER';
}

export function parseIntent(raw: unknown): SavedCustomerIntent {
  const v = String(raw || 'WARM').toUpperCase();
  return INTENTS.includes(v as SavedCustomerIntent)
    ? (v as SavedCustomerIntent)
    : 'WARM';
}

export function parseSavedStatus(raw: unknown): SavedCustomerStatus | null {
  const v = String(raw || '').toUpperCase();
  return STATUSES.includes(v as SavedCustomerStatus)
    ? (v as SavedCustomerStatus)
    : null;
}

export async function listSavedCustomers(input: {
  saleId: string;
  status?: SavedCustomerStatus | null;
  q?: string | null;
  due?: 'overdue' | 'today' | 'week' | null;
  limit?: number;
  offset?: number;
}) {
  const admin = createServiceClient();
  let query = admin
    .from('sale_saved_customers')
    .select('*')
    .eq('sale_id', input.saleId)
    .order('next_follow_up_at', { ascending: true, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (input.status) {
    query = query.eq('status', input.status);
  }

  if (input.q?.trim()) {
    const q = input.q.trim();
    const parts = [`full_name.ilike.%${escapeIlikePattern(q)}%`];
    const phoneVariants = digitsOnly(q)
      ? vnPhoneSearchVariants(q)
      : [q];
    for (const v of phoneVariants) {
      parts.push(`phone.ilike.%${escapeIlikePattern(v)}%`);
    }
    query = query.or(parts.join(','));
  }

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const tomorrow = new Date(todayStart);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  if (input.due === 'overdue') {
    query = query
      .not('next_follow_up_at', 'is', null)
      .lt('next_follow_up_at', todayStart.toISOString());
  } else if (input.due === 'today') {
    query = query
      .gte('next_follow_up_at', todayStart.toISOString())
      .lt('next_follow_up_at', tomorrow.toISOString());
  } else if (input.due === 'week') {
    query = query
      .gte('next_follow_up_at', todayStart.toISOString())
      .lt('next_follow_up_at', weekEnd.toISOString());
  }

  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { customers: (data || []) as SavedCustomerRow[] };
}

export async function createSavedCustomer(input: {
  saleId: string;
  fullName: string;
  phone: string;
  channel?: unknown;
  intentLevel?: unknown;
  note?: string | null;
  nextFollowUpAt?: string | null;
  guestId?: string | null;
}) {
  const phone = normalizePhone(input.phone);
  if (!phone) return { error: 'INVALID_PHONE' as const };
  const fullName = String(input.fullName || '').trim();
  if (!fullName) return { error: 'INVALID_NAME' as const };

  const admin = createServiceClient();
  const { data: dup } = await admin
    .from('sale_saved_customers')
    .select('id')
    .eq('sale_id', input.saleId)
    .eq('phone', phone)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  if (dup) return { error: 'DUPLICATE_PHONE' as const, existingId: dup.id };

  const { data, error } = await admin
    .from('sale_saved_customers')
    .insert({
      sale_id: input.saleId,
      guest_id: input.guestId || null,
      full_name: fullName,
      phone,
      channel: parseChannel(input.channel),
      intent_level: parseIntent(input.intentLevel),
      note: input.note?.trim() || null,
      next_follow_up_at: input.nextFollowUpAt || null,
      last_contact_at: new Date().toISOString(),
      status: 'ACTIVE',
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'DUPLICATE_PHONE' as const };
    }
    return { error: error.message };
  }
  return { customer: data as SavedCustomerRow };
}

export async function updateSavedCustomer(input: {
  saleId: string;
  id: string;
  fullName?: string;
  phone?: string;
  channel?: unknown;
  intentLevel?: unknown;
  note?: string | null;
  nextFollowUpAt?: string | null;
  status?: SavedCustomerStatus;
  markContacted?: boolean;
}) {
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from('sale_saved_customers')
    .select('*')
    .eq('id', input.id)
    .eq('sale_id', input.saleId)
    .maybeSingle();
  if (!existing) return { error: 'NOT_FOUND' as const };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.fullName !== undefined) {
    const fullName = String(input.fullName || '').trim();
    if (!fullName) return { error: 'INVALID_NAME' as const };
    patch.full_name = fullName;
  }

  if (input.phone !== undefined) {
    const phone = normalizePhone(input.phone);
    if (!phone) return { error: 'INVALID_PHONE' as const };
    if (phone !== existing.phone && existing.status === 'ACTIVE') {
      const { data: dup } = await admin
        .from('sale_saved_customers')
        .select('id')
        .eq('sale_id', input.saleId)
        .eq('phone', phone)
        .eq('status', 'ACTIVE')
        .neq('id', input.id)
        .maybeSingle();
      if (dup) return { error: 'DUPLICATE_PHONE' as const, existingId: dup.id };
    }
    patch.phone = phone;
  }

  if (input.channel !== undefined) patch.channel = parseChannel(input.channel);
  if (input.intentLevel !== undefined) {
    patch.intent_level = parseIntent(input.intentLevel);
  }
  if (input.note !== undefined) patch.note = input.note?.trim() || null;
  if (input.nextFollowUpAt !== undefined) {
    patch.next_follow_up_at = input.nextFollowUpAt || null;
  }
  if (input.status) patch.status = input.status;
  if (input.markContacted) {
    patch.last_contact_at = new Date().toISOString();
  }

  const { data, error } = await admin
    .from('sale_saved_customers')
    .update(patch)
    .eq('id', input.id)
    .eq('sale_id', input.saleId)
    .select('*')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') return { error: 'DUPLICATE_PHONE' as const };
    return { error: error.message };
  }
  if (!data) return { error: 'NOT_FOUND' as const };
  return { customer: data as SavedCustomerRow };
}

export async function convertSavedCustomer(input: {
  saleId: string;
  id: string;
  bookingId?: string | null;
}) {
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from('sale_saved_customers')
    .select('*')
    .eq('id', input.id)
    .eq('sale_id', input.saleId)
    .maybeSingle();
  if (!existing) return { error: 'NOT_FOUND' as const };
  if (existing.status === 'CONVERTED') {
    return { customer: existing as SavedCustomerRow };
  }

  let bookingId = input.bookingId || null;
  if (bookingId) {
    const { data: booking } = await admin
      .from('bookings')
      .select('id, sale_id, status')
      .eq('id', bookingId)
      .eq('sale_id', input.saleId)
      .maybeSingle();
    if (!booking) return { error: 'BOOKING_NOT_FOUND' as const };
    if (
      booking.status !== 'CONFIRMED' &&
      booking.status !== 'CHECKED_IN' &&
      booking.status !== 'CHECKED_OUT'
    ) {
      return { error: 'BOOKING_NOT_CLOSED' as const };
    }
  }

  const { data, error } = await admin
    .from('sale_saved_customers')
    .update({
      status: 'CONVERTED',
      converted_booking_id: bookingId,
      converted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('sale_id', input.saleId)
    .select('*')
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: 'NOT_FOUND' as const };
  return { customer: data as SavedCustomerRow };
}

export type ClosedCustomerCard = {
  guestId: string;
  fullName: string;
  phone: string;
  bookingCount: number;
  totalPaidNet: number;
  tierLabel: string;
  remainingBooks: number | null;
  remainingGmv: number | null;
  nextTierLabel: string | null;
  atMaxTier: boolean;
  lastCheckIn: string | null;
};

export type CancelledCustomerCard = {
  guestId: string;
  fullName: string;
  phone: string;
  cancelCount: number;
  lastCancelledAt: string | null;
  lastRefundAmount: number;
  lastKeptAmount: number;
  lastAssetTitle: string | null;
};

type BookingGuestRow = {
  guest_id: string;
  status: string;
  check_in: string;
  amount_collected: number | null;
  refund_amount: number | null;
  refund_kept_amount: number | null;
  cancelled_at: string | null;
  profiles: { full_name: string; phone: string } | null;
  assets: { title: string } | null;
};

function loadGuestStates(
  admin: ReturnType<typeof createServiceClient>,
  guestIds: string[]
) {
  return fetchByIds(guestIds, (chunk) =>
    admin
      .from('guest_membership_states')
      .select(
        'guest_id, progress_books, progress_gmv, current_tier_id, guest_membership_tiers(sort, label, min_books, min_gmv)'
      )
      .in('guest_id', chunk)
      .limit(chunk.length)
  );
}

export async function loadClosedCustomersForSale(
  saleId: string
): Promise<ClosedCustomerCard[]> {
  const admin = createServiceClient();
  // Totals are grouped per guest, so a truncated read would understate the
  // amounts these cards are ranked by.
  const bookings = await fetchAllPages((from, to) =>
    admin
      .from('bookings')
      .select(
        'guest_id, status, check_in, amount_collected, refund_amount, profiles!bookings_guest_id_fkey(full_name, phone)'
      )
      .eq('sale_id', saleId)
      .in('status', ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'])
      .order('id', { ascending: true })
      .range(from, to)
  );

  const rows = (bookings || []) as unknown as BookingGuestRow[];
  if (!rows.length) return [];

  const byGuest = new Map<
    string,
    {
      fullName: string;
      phone: string;
      bookings: Array<{
        amountCollected: number | null;
        refundAmount: number | null;
        checkIn: string;
      }>;
    }
  >();

  for (const b of rows) {
    const g = byGuest.get(b.guest_id) || {
      fullName: b.profiles?.full_name || 'Guest',
      phone: b.profiles?.phone || '',
      bookings: [],
    };
    g.bookings.push({
      amountCollected: b.amount_collected,
      refundAmount: b.refund_amount,
      checkIn: b.check_in,
    });
    byGuest.set(b.guest_id, g);
  }

  const guestIds = [...byGuest.keys()];
  const [states, { data: tiers }] = await Promise.all([
    loadGuestStates(admin, guestIds),
    admin
      .from('guest_membership_tiers')
      .select('id, sort, label, min_books, min_gmv')
      .order('sort'),
  ]);

  const allTiers = (tiers || []).map((t) => ({
    id: t.id as string,
    sort: t.sort as number,
    label: (t.label as string) || `Tier ${t.sort}`,
    minBooks: Number(t.min_books),
    minGmv: Number(t.min_gmv),
  }));

  const stateByGuest = new Map(
    (states || []).map((s) => [s.guest_id as string, s])
  );

  const cards: ClosedCustomerCard[] = [];
  for (const [guestId, g] of byGuest) {
    const state = stateByGuest.get(guestId);
    const tierJoin = state?.guest_membership_tiers as
      | {
          sort?: number;
          label?: string;
          min_books?: number;
          min_gmv?: number;
        }
      | {
          sort?: number;
          label?: string;
          min_books?: number;
          min_gmv?: number;
        }[]
      | null;
    const currentTier = Array.isArray(tierJoin) ? tierJoin[0] : tierJoin;
    const currentSort = currentTier?.sort ?? allTiers[0]?.sort ?? 0;
    const remaining = remainingToNextRank({
      currentSort,
      progressBooks: Number(state?.progress_books || 0),
      progressGmv: Number(state?.progress_gmv || 0),
      tiers: allTiers,
    });
    const lastCheckIn = g.bookings
      .map((b) => b.checkIn)
      .sort()
      .at(-1);

    cards.push({
      guestId,
      fullName: g.fullName,
      phone: g.phone,
      bookingCount: g.bookings.length,
      totalPaidNet: sumNetPaid(g.bookings),
      tierLabel: currentTier?.label || allTiers[0]?.label || 'Tier 0',
      remainingBooks: remaining.remainingBooks,
      remainingGmv: remaining.remainingGmv,
      nextTierLabel: remaining.nextLabel,
      atMaxTier: remaining.atMaxTier,
      lastCheckIn: lastCheckIn || null,
    });
  }

  cards.sort((a, b) => b.totalPaidNet - a.totalPaidNet);
  return cards;
}

export async function loadCancelledCustomersForSale(
  saleId: string
): Promise<CancelledCustomerCard[]> {
  const admin = createServiceClient();
  // cancelCount is a group-by, so every cancellation has to be seen.
  const bookings = await fetchAllPages((from, to) =>
    admin
      .from('bookings')
      .select(
        'guest_id, cancelled_at, refund_amount, refund_kept_amount, profiles!bookings_guest_id_fkey(full_name, phone), assets(title)'
      )
      .eq('sale_id', saleId)
      .eq('status', 'CANCELLED')
      .order('cancelled_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, to)
  );

  const rows = (bookings || []) as unknown as BookingGuestRow[];
  if (!rows.length) return [];

  const byGuest = new Map<string, CancelledCustomerCard>();
  for (const b of rows) {
    const existing = byGuest.get(b.guest_id);
    if (existing) {
      existing.cancelCount += 1;
      continue;
    }
    byGuest.set(b.guest_id, {
      guestId: b.guest_id,
      fullName: b.profiles?.full_name || 'Guest',
      phone: b.profiles?.phone || '',
      cancelCount: 1,
      lastCancelledAt: b.cancelled_at,
      lastRefundAmount: Number(b.refund_amount || 0),
      lastKeptAmount: Number(b.refund_kept_amount || 0),
      lastAssetTitle: b.assets?.title || null,
    });
  }

  return [...byGuest.values()];
}

export { bookingNetPaid, normalizePhone };
