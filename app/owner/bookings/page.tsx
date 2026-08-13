import { createClient } from '@/lib/supabase/server';
import { LIST_VIEW_LIMIT } from '@/lib/supabase/query-guard';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  OwnerSettlementsList,
  type OwnerSettlementRow,
} from '@/components/owner/OwnerSettlementsList';

const SETTLED = ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] as const;

export default async function OwnerSettlementsPage() {
  const profile = await getSessionProfile();
  const admin = await createClient();

  const { data: assets } = await admin
    .from('assets')
    .select('id')
    .eq('owner_id', profile!.id)
    .limit(LIST_VIEW_LIMIT);

  const assetIds = (assets || []).map((a) => a.id);

  const { data: bookings } = assetIds.length
    ? await admin
        .from('bookings')
        .select(
          `id, status, check_in, check_out, confirmed_at, sale_id,
           effective_cost_snapshot, owner_earn_snapshot,
           sale_tier_label_snapshot, owner_paid_amount,
           owner_paid_at, assets(title, location)`
        )
        .in('asset_id', assetIds)
        .in('status', [...SETTLED])
        .order('confirmed_at', { ascending: false })
        .limit(LIST_VIEW_LIMIT)
    : { data: [] as never[] };

  const saleIds = [
    ...new Set((bookings || []).map((b) => b.sale_id).filter(Boolean)),
  ] as string[];

  const saleNameById = new Map<
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
      saleNameById.set(s.id, {
        full_name: s.full_name || 'Sale',
        avatar_url: s.avatar_url,
        phone: s.phone,
      });
    }
  }

  const rows: OwnerSettlementRow[] = (bookings || []).map((b) => {
    const asset = b.assets as unknown as {
      title: string;
      location?: string;
    };
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
    };
  });

  return (
    <>
      <PageHeader
        title="Settlements"
        description="Theo dõi Sale đã CK phần Owner earn — tìm bằng mã CK VBNB… hoặc lọc Chưa / Một phần / Đủ."
      />
      <OwnerSettlementsList rows={rows} />
    </>
  );
}
