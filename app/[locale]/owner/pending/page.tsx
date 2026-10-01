import { createClient } from '@/lib/supabase/server';
import { LIST_VIEW_LIMIT } from '@/lib/supabase/query-guard';
import { getSessionProfile } from '@/lib/auth/session';
import { isSimpleUi } from '@/lib/engines/ui-mode';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  OwnerPendingList,
  type OwnerPendingRow,
} from '@/components/owner/OwnerPendingList';
import {
  loadSaleRatingAggregates,
  loadSaleRatingComments,
} from '@/lib/engines/sale-ratings';
import { getTranslations } from 'next-intl/server';

export default async function OwnerPendingBookingsPage() {
  const t = await getTranslations('owner.pending');
  const profile = await getSessionProfile();
  const admin = await createClient();

  const { data: assets } = await admin
    .from('assets')
    .select('id, title, location')
    .eq('owner_id', profile!.id)
    .limit(LIST_VIEW_LIMIT);

  const assetIds = (assets || []).map((a) => a.id);
  const assetById = new Map((assets || []).map((a) => [a.id, a]));

  const { data: bookings } = assetIds.length
    ? await admin
        .from('bookings')
        .select(
          `id, asset_id, status, check_in, check_out, submitted_to_owner_at, sale_id,
           owner_earn_snapshot, owner_paid_amount,
           sale_tier_label_snapshot`
        )
        .in('asset_id', assetIds)
        .eq('status', 'AWAITING_OWNER')
        .order('submitted_to_owner_at', { ascending: false })
        .limit(LIST_VIEW_LIMIT)
    : { data: [] as never[] };

  const saleIds = [
    ...new Set((bookings || []).map((b) => b.sale_id).filter(Boolean)),
  ] as string[];

  const saleById = new Map<
    string,
    { full_name: string; avatar_url: string | null; phone: string | null }
  >();

  if (saleIds.length) {
    const { data: sales } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url, phone')
      .in('id', saleIds)
      .eq('role', 'SALE')
      .limit(saleIds.length);
    for (const s of sales || []) {
      saleById.set(s.id, {
        full_name: s.full_name || 'Sale',
        avatar_url: s.avatar_url,
        phone: s.phone,
      });
    }
  }

  const [aggregates, comments] = await Promise.all([
    loadSaleRatingAggregates(saleIds),
    loadSaleRatingComments({ saleIds, limit: 30 }),
  ]);

  const rows: OwnerPendingRow[] = (bookings || []).map((b) => {
    const asset = assetById.get(b.asset_id);
    const sale = saleById.get(b.sale_id);
    return {
      id: b.id,
      assetId: b.asset_id,
      villaTitle: asset?.title || '',
      location: asset?.location || null,
      checkIn: b.check_in,
      checkOut: b.check_out,
      submittedAt: b.submitted_to_owner_at,
      saleId: b.sale_id,
      saleName: sale?.full_name || '',
      saleAvatarUrl: sale?.avatar_url || null,
      salePhone: sale?.phone || null,
      tierLabel: b.sale_tier_label_snapshot,
      ownerEarn: Number(b.owner_earn_snapshot || 0),
      ownerPaid: Number(b.owner_paid_amount || 0),
      status: b.status,
      ratingAggregate: aggregates.get(b.sale_id) ?? null,
      ratingComments: comments.filter((c) => c.saleId === b.sale_id),
    };
  });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <OwnerPendingList
        rows={rows}
        requireStkCheck={!isSimpleUi(profile!.uiMode)}
      />
    </>
  );
}
