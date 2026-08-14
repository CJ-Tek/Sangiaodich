import { createServiceClient } from '@/lib/supabase/server';
import { fetchAllPages } from '@/lib/supabase/query-guard';
import { hasConfirmedConflict, INVENTORY_LOCK_STATUSES } from '@/lib/engines/inventory';
import {
  applyGuestConfirmProgress,
  applyGuestProgress,
  applySaleConfirmVolume,
  recomputeGuestFromCollectedAmounts,
  resolveSaleVolumeTier,
  type GuestTier,
  type SaleTier,
} from '@/lib/engines/membership';
import { previewPricing, minOwnerDepositToConfirm } from '@/lib/engines/pricing';
import { computeCancelRefund } from '@/lib/engines/cancellation';
import { profileHasActiveSubscription } from '@/lib/engines/subscription-access';
import { isPastDateOnly } from '@/lib/dates';
import {
  resolveSaleCostDiscountPercent,
  resolveSaleMembership,
} from '@/lib/engines/sale-pricing';

/**
 * The date filters already narrow these reads to overlapping rows, so any row
 * that comes back is a conflict and a page of them answers the question. The
 * cap only keeps a pathological asset from pulling an unbounded set.
 */
const OVERLAP_PROBE_LIMIT = 50;

export async function saleHasActiveSub(saleId: string): Promise<boolean> {
  return profileHasActiveSubscription(saleId);
}

export async function createBooking(input: {
  saleId: string;
  assetId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  listPrice: number;
}) {
  const admin = createServiceClient();
  if (!(await saleHasActiveSub(input.saleId))) {
    return { error: 'SUBSCRIPTION_INACTIVE' as const };
  }

  if (!input.checkIn || !input.checkOut || input.checkOut <= input.checkIn) {
    return { error: 'INVALID_DATES' as const };
  }
  if (isPastDateOnly(input.checkIn)) {
    return { error: 'PAST_CHECK_IN' as const };
  }

  const { data: asset } = await admin
    .from('assets')
    .select('id, status')
    .eq('id', input.assetId)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  if (!asset) return { error: 'ASSET_UNAVAILABLE' as const };

  const { data: costs } = await admin
    .from('asset_costs')
    .select('cost_weekday, cost_weekend')
    .eq('asset_id', input.assetId)
    .maybeSingle();
  if (!costs) return { error: 'NO_COSTS' as const };

  const saleDiscount = await resolveSaleCostDiscountPercent(input.saleId);
  const pricing = previewPricing({
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    costWeekday: Number(costs.cost_weekday),
    costWeekend: Number(costs.cost_weekend),
    listSelling: input.listPrice,
    saleCostDiscountPercent: saleDiscount,
  });

  if (input.listPrice < pricing.effectiveCost) {
    return {
      error: 'BELOW_FLOOR' as const,
      effectiveCost: pricing.effectiveCost,
    };
  }

  const candidate = { checkIn: input.checkIn, checkOut: input.checkOut };

  // Stays are half-open [check_in, check_out), so only rows starting before the
  // candidate ends and ending after it starts can overlap. Without this the read
  // grew with the villa's whole booking history.
  const { data: confirmed } = await admin
    .from('bookings')
    .select('check_in, check_out')
    .eq('asset_id', input.assetId)
    .in('status', [...INVENTORY_LOCK_STATUSES])
    .lt('check_in', input.checkOut)
    .gt('check_out', input.checkIn)
    .limit(OVERLAP_PROBE_LIMIT);

  if (
    hasConfirmedConflict(
      candidate,
      (confirmed || []).map((b) => ({
        checkIn: b.check_in,
        checkOut: b.check_out,
      }))
    )
  ) {
    return { error: 'OVERLAP' as const };
  }

  const { data: guestExisting } = await admin
    .from('bookings')
    .select('check_in, check_out, status')
    .eq('asset_id', input.assetId)
    .eq('guest_id', input.guestId)
    .in('status', ['PENDING', 'AWAITING_OWNER', ...INVENTORY_LOCK_STATUSES])
    .lt('check_in', input.checkOut)
    .gt('check_out', input.checkIn)
    .limit(OVERLAP_PROBE_LIMIT);

  if (
    hasConfirmedConflict(
      candidate,
      (guestExisting || []).map((b) => ({
        checkIn: b.check_in,
        checkOut: b.check_out,
      }))
    )
  ) {
    return { error: 'GUEST_DUPLICATE' as const };
  }

  const { data: booking, error } = await admin
    .from('bookings')
    .insert({
      asset_id: input.assetId,
      sale_id: input.saleId,
      guest_id: input.guestId,
      check_in: input.checkIn,
      check_out: input.checkOut,
      list_price: input.listPrice,
      base_cost_snapshot: pricing.baseCost,
      effective_cost_snapshot: pricing.effectiveCost,
      list_price_snapshot: input.listPrice,
      sale_discount_percent_snapshot: pricing.saleDiscountPercent,
      status: 'PENDING',
    })
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { booking };
}

/**
 * Sale submits PENDING → AWAITING_OWNER (does NOT lock inventory).
 * Owner must confirm to lock dates + apply membership.
 */
export async function submitToOwner(input: {
  bookingId: string;
  saleId: string;
  amountCollected: number;
}) {
  const admin = createServiceClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('*')
    .eq('id', input.bookingId)
    .maybeSingle();

  if (!booking) return { error: 'NOT_FOUND' as const };
  if (booking.sale_id !== input.saleId) return { error: 'FORBIDDEN' as const };
  if (booking.status === 'AWAITING_OWNER') return { booking }; // idempotent
  if (booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN' || booking.status === 'CHECKED_OUT') {
    return { booking };
  }
  if (booking.status !== 'PENDING') return { error: 'INVALID_STATUS' as const };

  const { data: costs } = await admin
    .from('asset_costs')
    .select('*')
    .eq('asset_id', booking.asset_id)
    .single();

  const saleMembership = await resolveSaleMembership(booking.sale_id);

  const pricing = previewPricing({
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    costWeekday: Number(costs.cost_weekday),
    costWeekend: Number(costs.cost_weekend),
    listSelling: Number(booking.list_price),
    saleCostDiscountPercent: saleMembership.discountPercent,
  });

  const listPrice = Number(booking.list_price);
  const ownerEarn = pricing.effectiveCost;
  const minOwnerPayout = minOwnerDepositToConfirm(ownerEarn);
  const ownerPaid = Number(booking.owner_paid_amount || 0);
  if (ownerEarn <= 0) {
    return { error: 'NO_OWNER_EARN' as const };
  }
  if (ownerPaid < minOwnerPayout) {
    return {
      error: 'BELOW_OWNER_PAYOUT' as const,
      minOwnerPayout,
      ownerEarn,
    };
  }

  // Fail early if dates already locked by another CONFIRMED booking
  const { data: confirmed } = await admin
    .from('bookings')
    .select('check_in, check_out')
    .eq('asset_id', booking.asset_id)
    .in('status', [...INVENTORY_LOCK_STATUSES])
    .lt('check_in', booking.check_out)
    .gt('check_out', booking.check_in)
    .limit(OVERLAP_PROBE_LIMIT);

  if (
    hasConfirmedConflict(
      { checkIn: booking.check_in, checkOut: booking.check_out },
      (confirmed || []).map((b) => ({
        checkIn: b.check_in,
        checkOut: b.check_out,
      }))
    )
  ) {
    return { error: 'OVERLAP' as const };
  }

  const agreedMargin = listPrice - pricing.effectiveCost;

  const { data: assetRow } = await admin
    .from('assets')
    .select('owner_id')
    .eq('id', booking.asset_id)
    .maybeSingle();

  let payoutBank: string | null = null;
  let payoutAccountName: string | null = null;
  let payoutAccountNumber: string | null = null;
  if (assetRow?.owner_id) {
    const { data: ownerPayout } = await admin
      .from('profiles')
      .select(
        'payout_bank_name, payout_account_name, payout_account_number'
      )
      .eq('id', assetRow.owner_id)
      .maybeSingle();
    payoutBank = ownerPayout?.payout_bank_name?.trim() || null;
    payoutAccountName = ownerPayout?.payout_account_name?.trim() || null;
    payoutAccountNumber = ownerPayout?.payout_account_number?.trim() || null;
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await admin
    .from('bookings')
    .update({
      status: 'AWAITING_OWNER',
      amount_collected: input.amountCollected,
      base_cost_snapshot: pricing.baseCost,
      effective_cost_snapshot: pricing.effectiveCost,
      list_price_snapshot: listPrice,
      sale_discount_percent_snapshot: pricing.saleDiscountPercent,
      // Guest tier no longer discounts price; 0 marks "no discount policy"
      guest_discount_percent_snapshot: 0,
      owner_earn_snapshot: pricing.effectiveCost,
      sale_margin_snapshot: agreedMargin,
      sale_tier_id_snapshot: saleMembership.tierId,
      sale_tier_label_snapshot: saleMembership.tierLabel,
      owner_payout_bank_name_snapshot: payoutBank,
      owner_payout_account_name_snapshot: payoutAccountName,
      owner_payout_account_number_snapshot: payoutAccountNumber,
      submitted_to_owner_at: now,
      updated_at: now,
    })
    .eq('id', booking.id)
    .eq('status', 'PENDING')
    .select('*')
    .maybeSingle();

  if (updateError) return { error: updateError.message };
  if (!updated) return { error: 'RACE' as const };
  return { booking: updated };
}

/** Owner confirms AWAITING_OWNER → CONFIRMED (locks inventory + membership). */
export async function ownerConfirmBooking(input: {
  bookingId: string;
  ownerId: string;
}) {
  const admin = createServiceClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('*')
    .eq('id', input.bookingId)
    .maybeSingle();

  if (!booking) return { error: 'NOT_FOUND' as const };

  const { data: asset } = await admin
    .from('assets')
    .select('owner_id')
    .eq('id', booking.asset_id)
    .maybeSingle();

  if (!asset || asset.owner_id !== input.ownerId) {
    return { error: 'FORBIDDEN' as const };
  }
  if (booking.status === 'CONFIRMED') return { booking };
  if (booking.status !== 'AWAITING_OWNER') {
    return { error: 'INVALID_STATUS' as const };
  }

  const { data: confirmed } = await admin
    .from('bookings')
    .select('check_in, check_out')
    .eq('asset_id', booking.asset_id)
    .neq('id', booking.id)
    .in('status', [...INVENTORY_LOCK_STATUSES])
    .lt('check_in', booking.check_out)
    .gt('check_out', booking.check_in)
    .limit(OVERLAP_PROBE_LIMIT);

  if (
    hasConfirmedConflict(
      { checkIn: booking.check_in, checkOut: booking.check_out },
      (confirmed || []).map((b) => ({
        checkIn: b.check_in,
        checkOut: b.check_out,
      }))
    )
  ) {
    return { error: 'OVERLAP' as const };
  }

  const saleMembership = await resolveSaleMembership(booking.sale_id);
  const saleTiers: SaleTier[] = saleMembership.tiers;
  const baseCost = Number(booking.base_cost_snapshot || 0);
  const amountCollected = Number(booking.amount_collected || 0);

  const { data: guestState } = await admin
    .from('guest_membership_states')
    .select('*')
    .eq('guest_id', booking.guest_id)
    .maybeSingle();

  const { data: guestTiersRaw } = await admin
    .from('guest_membership_tiers')
    .select('*')
    .order('sort');

  const guestTiers: GuestTier[] = (guestTiersRaw || []).map((t) => ({
    id: t.id,
    sort: t.sort,
    minBooks: t.min_books,
    minGmv: Number(t.min_gmv),
  }));

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await admin
    .from('bookings')
    .update({
      status: 'CONFIRMED',
      confirmed_at: now,
      owner_confirmed_at: now,
      updated_at: now,
    })
    .eq('id', booking.id)
    .eq('status', 'AWAITING_OWNER')
    .select('*')
    .maybeSingle();

  if (updateError) {
    if (updateError.code === '23P01' || updateError.message.includes('overlap')) {
      return { error: 'OVERLAP' as const };
    }
    return { error: updateError.message };
  }
  if (!updated) return { error: 'RACE' as const };

  const saleNext = applySaleConfirmVolume({
    lifetimeCostVolume: saleMembership.lifetimeCostVolume,
    addBaseCost: baseCost,
    tiers: saleTiers,
  });

  await admin.from('sale_membership_states').upsert({
    sale_id: booking.sale_id,
    lifetime_cost_volume: saleNext.lifetimeCostVolume,
    current_tier_id: saleNext.tier.id,
    updated_at: now,
  });

  const currentGuestTier =
    guestTiers.find((t) => t.id === guestState?.current_tier_id) ||
    guestTiers[0];

  const guestNext = applyGuestConfirmProgress({
    currentTier: currentGuestTier,
    progressBooks: guestState?.progress_books || 0,
    progressGmv: Number(guestState?.progress_gmv || 0),
    lifetimeBooks: guestState?.lifetime_books || 0,
    lifetimeGmv: Number(guestState?.lifetime_gmv || 0),
    addAmountCollected: amountCollected,
    tiers: guestTiers,
  });

  await admin.from('guest_membership_states').upsert({
    guest_id: booking.guest_id,
    current_tier_id: guestNext.currentTier.id,
    progress_books: guestNext.progressBooks,
    progress_gmv: guestNext.progressGmv,
    lifetime_books: guestNext.lifetimeBooks,
    lifetime_gmv: guestNext.lifetimeGmv,
    updated_at: now,
  });

  return { booking: updated };
}

/** Owner rejects AWAITING_OWNER → CANCELLED with full guest refund. */
export async function ownerRejectBooking(input: {
  bookingId: string;
  ownerId: string;
  reason?: string;
}) {
  const admin = createServiceClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('*')
    .eq('id', input.bookingId)
    .maybeSingle();

  if (!booking) return { error: 'NOT_FOUND' as const };

  const { data: asset } = await admin
    .from('assets')
    .select('owner_id')
    .eq('id', booking.asset_id)
    .maybeSingle();

  if (!asset || asset.owner_id !== input.ownerId) {
    return { error: 'FORBIDDEN' as const };
  }
  if (booking.status !== 'AWAITING_OWNER') {
    return { error: 'INVALID_STATUS' as const };
  }

  const refund = computeCancelRefund({
    status: 'AWAITING_OWNER',
    checkIn: booking.check_in,
    amountCollected: Number(booking.amount_collected || 0),
  });

  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from('bookings')
    .update({
      status: 'CANCELLED',
      cancelled_at: now,
      owner_rejected_at: now,
      owner_reject_reason: input.reason?.trim() || null,
      refund_amount: refund.refundAmount,
      refund_kept_amount: refund.keptAmount,
      refund_percent: refund.refundPercent,
      cancellation_policy: refund.policyCode,
      cancel_reason: 'OWNER_REJECT',
      updated_at: now,
    })
    .eq('id', booking.id)
    .eq('status', 'AWAITING_OWNER')
    .select('*')
    .maybeSingle();

  if (error) return { error: error.message };
  if (!updated) return { error: 'RACE' as const };
  return { booking: updated, refund };
}

/** @deprecated Sale no longer confirms — use submitToOwner + ownerConfirmBooking. */
export async function confirmBooking(input: {
  bookingId: string;
  saleId: string;
  amountCollected: number;
}) {
  return submitToOwner(input);
}

/** Record additional offline payment (Guest) while awaiting or after confirm. */
export async function recordBookingPayment(input: {
  bookingId: string;
  saleId: string;
  amountCollected: number;
}) {
  const admin = createServiceClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('*')
    .eq('id', input.bookingId)
    .maybeSingle();

  if (!booking) return { error: 'NOT_FOUND' as const };
  if (booking.sale_id !== input.saleId) return { error: 'FORBIDDEN' as const };
  if (
    booking.status !== 'PENDING' &&
    booking.status !== 'AWAITING_OWNER' &&
    booking.status !== 'CONFIRMED' &&
    booking.status !== 'CHECKED_IN'
  ) {
    return { error: 'INVALID_STATUS' as const };
  }

  const listPrice = Number(booking.list_price);
  const previous = Number(booking.amount_collected || 0);
  const next = Number(input.amountCollected);

  if (!Number.isFinite(next) || next < previous) {
    return { error: 'AMOUNT_REGRESSION' as const, previous };
  }
  if (next > listPrice) {
    return { error: 'ABOVE_LIST' as const, listPrice };
  }
  if (next === previous) {
    return { booking };
  }

  const { data: updated, error } = await admin
    .from('bookings')
    .update({
      amount_collected: next,
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id)
    .in('status', ['PENDING', 'AWAITING_OWNER', 'CONFIRMED', 'CHECKED_IN'])
    .select('*')
    .maybeSingle();

  if (error) return { error: error.message };
  if (!updated) return { error: 'RACE' as const };

  // Guest membership volume only accrues on CONFIRMED+; incremental on CONFIRMED path
  if (booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') {
    const delta = next - previous;
    const { data: guestState } = await admin
      .from('guest_membership_states')
      .select('*')
      .eq('guest_id', booking.guest_id)
      .maybeSingle();

    const { data: guestTiersRaw } = await admin
      .from('guest_membership_tiers')
      .select('*')
      .order('sort');

    const guestTiers: GuestTier[] = (guestTiersRaw || []).map((t) => ({
      id: t.id,
      sort: t.sort,
      minBooks: t.min_books,
      minGmv: Number(t.min_gmv),
    }));

    const sorted = [...guestTiers].sort((a, b) => a.sort - b.sort);
    const currentTier =
      guestTiers.find((t) => t.id === guestState?.current_tier_id) || sorted[0];

    if (currentTier) {
      // The booking itself was already counted on confirm, so addBooks is 0.
      const progress = applyGuestProgress({
        currentTier,
        progressBooks: guestState?.progress_books || 0,
        progressGmv: Number(guestState?.progress_gmv || 0),
        lifetimeBooks: guestState?.lifetime_books || 0,
        lifetimeGmv: Number(guestState?.lifetime_gmv || 0),
        addBooks: 0,
        addGmv: delta,
        tiers: guestTiers,
      });

      await admin.from('guest_membership_states').upsert({
        guest_id: booking.guest_id,
        current_tier_id: progress.currentTier.id,
        progress_books: progress.progressBooks,
        progress_gmv: progress.progressGmv,
        lifetime_books: progress.lifetimeBooks,
        lifetime_gmv: progress.lifetimeGmv,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return { booking: updated };
}

/** Record cumulative offline transfer Sale → Owner (≤ owner_earn_snapshot). */
export async function recordOwnerPayout(input: {
  bookingId: string;
  saleId: string;
  ownerPaidAmount: number;
}) {
  const admin = createServiceClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('*')
    .eq('id', input.bookingId)
    .maybeSingle();

  if (!booking) return { error: 'NOT_FOUND' as const };
  if (booking.sale_id !== input.saleId) return { error: 'FORBIDDEN' as const };
  if (
    booking.status !== 'PENDING' &&
    booking.status !== 'AWAITING_OWNER' &&
    booking.status !== 'CONFIRMED' &&
    booking.status !== 'CHECKED_IN' &&
    booking.status !== 'CHECKED_OUT'
  ) {
    return { error: 'INVALID_STATUS' as const };
  }

  const ownerEarn = Number(
    booking.owner_earn_snapshot || booking.effective_cost_snapshot || 0
  );
  const previous = Number(booking.owner_paid_amount || 0);
  const next = Number(input.ownerPaidAmount);

  if (!Number.isFinite(next) || next < previous) {
    return { error: 'AMOUNT_REGRESSION' as const, previous };
  }
  if (ownerEarn > 0 && next > ownerEarn) {
    return { error: 'ABOVE_OWNER_EARN' as const, ownerEarn };
  }
  if (next === previous) {
    return { booking };
  }

  const { data: updated, error } = await admin
    .from('bookings')
    .update({
      owner_paid_amount: next,
      owner_paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id)
    .in('status', [
      'PENDING',
      'AWAITING_OWNER',
      'CONFIRMED',
      'CHECKED_IN',
      'CHECKED_OUT',
    ])
    .select('*')
    .maybeSingle();

  if (error) return { error: error.message };
  if (!updated) return { error: 'RACE' as const };
  return { booking: updated };
}

export async function checkInBooking(bookingId: string, saleId: string) {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from('bookings')
    .update({
      status: 'CHECKED_IN',
      checked_in_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .eq('sale_id', saleId)
    .eq('status', 'CONFIRMED')
    .select('*')
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: 'NOT_FOUND' as const };
  return { booking: data };
}

export async function checkOutBooking(bookingId: string, saleId: string) {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from('bookings')
    .update({
      status: 'CHECKED_OUT',
      checked_out_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .eq('sale_id', saleId)
    .eq('status', 'CHECKED_IN')
    .select('*')
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: 'NOT_FOUND' as const };
  return { booking: data };
}

export async function cancelBooking(
  bookingId: string,
  saleId: string,
  opts?: { goodwillFullRefund?: boolean }
) {
  const admin = createServiceClient();
  const { data: existing, error: loadError } = await admin
    .from('bookings')
    .select(
      'id, status, check_in, amount_collected, sale_id, guest_id, base_cost_snapshot'
    )
    .eq('id', bookingId)
    .eq('sale_id', saleId)
    .in('status', ['PENDING', 'AWAITING_OWNER', 'CONFIRMED', 'CHECKED_IN'])
    .maybeSingle();

  if (loadError) return { error: loadError.message };
  if (!existing) return { error: 'NOT_FOUND' as const };

  const priorStatus = existing.status;
  const hadMembershipCredit =
    priorStatus === 'CONFIRMED' || priorStatus === 'CHECKED_IN';

  const refund = computeCancelRefund({
    status: existing.status,
    checkIn: existing.check_in,
    amountCollected: Number(existing.amount_collected || 0),
    goodwillFullRefund: opts?.goodwillFullRefund,
  });

  const { data, error } = await admin
    .from('bookings')
    .update({
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      refund_amount: refund.refundAmount,
      refund_kept_amount: refund.keptAmount,
      refund_percent: refund.refundPercent,
      cancellation_policy: refund.policyCode,
      cancel_reason: refund.goodwill ? 'GOODWILL' : 'POLICY',
    })
    .eq('id', bookingId)
    .eq('sale_id', saleId)
    .in('status', ['PENDING', 'AWAITING_OWNER', 'CONFIRMED', 'CHECKED_IN'])
    .select('*')
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: 'NOT_FOUND' as const };

  if (hadMembershipCredit) {
    await recomputeSaleMembershipState(existing.sale_id);
    await recomputeGuestMembershipState(existing.guest_id);
  }

  return { booking: data, refund };
}

const MEMBERSHIP_CREDIT_STATUSES = [
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
] as const;

async function recomputeSaleMembershipState(saleId: string) {
  const admin = createServiceClient();
  const [{ data: volume }, { data: saleTiersRaw }] = await Promise.all([
    admin.rpc('sale_membership_volume', { p_sale_id: saleId }),
    admin
      .from('sale_membership_tiers')
      .select('id, sort, min_lifetime_cost_volume, cost_discount_percent')
      .order('sort'),
  ]);

  const tiers: SaleTier[] = (saleTiersRaw || []).map((t) => ({
    id: t.id,
    sort: t.sort,
    minLifetimeCostVolume: Number(t.min_lifetime_cost_volume),
    costDiscountPercent: Number(t.cost_discount_percent),
  }));

  const next = resolveSaleVolumeTier(Number(volume ?? 0), tiers);

  await admin.from('sale_membership_states').upsert({
    sale_id: saleId,
    lifetime_cost_volume: next.lifetimeCostVolume,
    current_tier_id: next.tier?.id ?? null,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Guest tiers cannot be summed: ranking up zeroes progress, so the ladder has
 * to be replayed booking by booking in confirm order. The history is therefore
 * read in full — but in pages, because a single read would be cut at the row cap
 * and the truncated replay would be written over the real state. `id` breaks
 * ties so a row cannot shift between pages.
 */
async function loadGuestCreditedAmounts(
  admin: ReturnType<typeof createServiceClient>,
  guestId: string
): Promise<number[]> {
  const rows = await fetchAllPages<{ amount_collected: number | null }>(
    (from, to) =>
      admin
        .from('bookings')
        .select('amount_collected')
        .eq('guest_id', guestId)
        .in('status', [...MEMBERSHIP_CREDIT_STATUSES])
        .order('confirmed_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to)
  );

  return rows.map((booking) => Number(booking.amount_collected || 0));
}

async function recomputeGuestMembershipState(guestId: string) {
  const admin = createServiceClient();
  const [amountsCollected, { data: guestTiersRaw }] = await Promise.all([
    loadGuestCreditedAmounts(admin, guestId),
    admin.from('guest_membership_tiers').select('*').order('sort'),
  ]);

  const tiers: GuestTier[] = (guestTiersRaw || []).map((t) => ({
    id: t.id,
    sort: t.sort,
    minBooks: t.min_books,
    minGmv: Number(t.min_gmv),
  }));

  const next = recomputeGuestFromCollectedAmounts(amountsCollected, tiers);

  await admin.from('guest_membership_states').upsert({
    guest_id: guestId,
    current_tier_id: next.currentTier.id || null,
    progress_books: next.progressBooks,
    progress_gmv: next.progressGmv,
    lifetime_books: next.lifetimeBooks,
    lifetime_gmv: next.lifetimeGmv,
    updated_at: new Date().toISOString(),
  });
}
