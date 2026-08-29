import { createClient } from '@/lib/supabase/server';
import { LIST_VIEW_LIMIT } from '@/lib/supabase/query-guard';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  OwnerSettlementsList,
  type OwnerSettlementRow,
} from '@/components/owner/OwnerSettlementsList';
import { mapOwnerPayoutInfo } from '@/lib/owner/payout-info';
import {
  loadRatingsByBookingIds,
  loadSaleRatingAggregates,
  loadSaleRatingComments,
} from '@/lib/engines/sale-ratings';

const SETTLED = ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] as const;

export default async function OwnerSettlementsPage() {
  const profile = await getSessionProfile();
  const admin = await createClient();

  const { data: bookings, error: bookingsError } = await admin
    .from('bookings')
    .select(
      `id, status, check_in, check_out, confirmed_at, sale_id,
       list_price, amount_collected, guest_paid_owner_amount,
       effective_cost_snapshot, owner_earn_snapshot,
       sale_tier_label_snapshot, owner_paid_amount,
       owner_paid_at, assets!inner(title, location, owner_id)`
    )
    .eq('assets.owner_id', profile!.id)
    .in('status', [...SETTLED])
    .order('confirmed_at', { ascending: false })
    .limit(LIST_VIEW_LIMIT);

  if (bookingsError) {
    throw new Error(`Settlements query failed: ${bookingsError.message}`);
  }

  const saleIds = [
    ...new Set((bookings || []).map((b) => b.sale_id).filter(Boolean)),
  ] as string[];

  const saleNameById = new Map<
    string,
    { full_name: string; avatar_url: string | null; phone: string | null }
  >();

  if (saleIds.length) {
    const { data: sales, error: salesError } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url, phone')
      .in('id', saleIds)
      .eq('role', 'SALE')
      .limit(saleIds.length);

    if (salesError) {
      throw new Error(`Settlements sales query failed: ${salesError.message}`);
    }

    for (const s of sales || []) {
      saleNameById.set(s.id, {
        full_name: s.full_name || 'Sale',
        avatar_url: s.avatar_url,
        phone: s.phone,
      });
    }
  }

  const { data: ownerProfile, error: payoutError } = await admin
    .from('profiles')
    .select(
      'payout_bank_name, payout_account_name, payout_account_number, payout_vietqr_bank, payout_qr_image_url, payout_note'
    )
    .eq('id', profile!.id)
    .maybeSingle();

  if (payoutError) {
    throw new Error(`Settlements payout query failed: ${payoutError.message}`);
  }

  const payout = mapOwnerPayoutInfo(ownerProfile);

  const [ratingByBooking, aggregates, comments] = await Promise.all([
    loadRatingsByBookingIds(
      (bookings || [])
        .filter((b) => b.status === 'CHECKED_OUT')
        .map((b) => b.id)
    ),
    loadSaleRatingAggregates(saleIds),
    loadSaleRatingComments({ saleIds, limit: 30 }),
  ]);

  const rows: OwnerSettlementRow[] = (bookings || []).map((b) => {
    const assetRaw = b.assets as unknown as
      | { title: string; location?: string }
      | { title: string; location?: string }[]
      | null;
    const asset = Array.isArray(assetRaw) ? assetRaw[0] : assetRaw;
    const sale = saleNameById.get(b.sale_id);
    return {
      id: b.id,
      status: b.status,
      check_in: b.check_in,
      check_out: b.check_out,
      villaTitle: asset?.title || 'Asset',
      location: asset?.location || null,
      saleName: sale?.full_name || 'Sale không xác định',
      saleAvatarUrl: sale?.avatar_url || null,
      salePhone: sale?.phone || null,
      tierLabel: b.sale_tier_label_snapshot || '—',
      ownerEarn: Number(
        b.owner_earn_snapshot ?? b.effective_cost_snapshot ?? 0
      ),
      ownerPaid: Number(b.owner_paid_amount || 0),
      ownerPaidAt: b.owner_paid_at || null,
      listPrice: Number(b.list_price || 0),
      amountCollected: Number(b.amount_collected || 0),
      guestPaidOwner: Number(b.guest_paid_owner_amount || 0),
      rating: ratingByBooking.get(b.id) ?? null,
      saleId: b.sale_id,
      ratingAggregate: aggregates.get(b.sale_id) ?? null,
      ratingComments: comments.filter((c) => c.saleId === b.sale_id),
    };
  });

  return (
    <>
      <PageHeader
        title="Settlements"
        description="Check-in/out khi khách đến. Case A: khách CK nốt cho bạn. Case B: Sale CK đủ cost."
      />
      <OwnerSettlementsList rows={rows} payout={payout} />
    </>
  );
}
