import { createClient } from '@/lib/supabase/server';
import { LIST_VIEW_LIMIT } from '@/lib/supabase/query-guard';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import {
  OwnerAssetsList,
  type OwnerAssetListRow,
} from '@/components/owner/OwnerAssetsList';
import { loadAssetDiscountRulesByAssetIds } from '@/lib/engines/sale-pricing';

const ASSET_COLUMNS =
  'id, title, status, slug, location, property_type, bedrooms, bathrooms, asset_costs(cost_weekday, cost_weekend)';

export default async function OwnerAssetsPage() {
  const profile = await getSessionProfile();
  const admin = await createClient();

  const { data: assets } = await admin
    .from('assets')
    .select(ASSET_COLUMNS)
    .eq('owner_id', profile!.id)
    .order('created_at', { ascending: false })
    .range(0, LIST_VIEW_LIMIT - 1);

  const list = assets || [];
  const rulesByAsset = await loadAssetDiscountRulesByAssetIds(
    list.map((a) => a.id)
  );

  const rows: OwnerAssetListRow[] = list.map((a) => {
    const costs = a.asset_costs as unknown as {
      cost_weekday: number;
      cost_weekend: number;
    };
    return {
      id: a.id,
      title: a.title,
      status: a.status,
      location: a.location || null,
      propertyType: a.property_type,
      bedrooms: Number(a.bedrooms) || 0,
      bathrooms: Number(a.bathrooms) || 0,
      costWeekday: Number(costs?.cost_weekday || 0),
      costWeekend: Number(costs?.cost_weekend || 0),
      discountRules: (rulesByAsset.get(a.id) || []).map((r) => ({
        minCheckedOutCount: r.minCheckedOutCount,
        costDiscountPercent: r.costDiscountPercent,
      })),
    };
  });

  return (
    <>
      <PageHeader
        title="Properties"
        description="CRUD + cost WD/WE + chiết khấu Sale theo căn. Submit duyệt để lên sàn."
        action={
          <LinkButton href="/owner/assets/new" color="vbnbGreen">
            New asset
          </LinkButton>
        }
      />
      {!rows.length ? (
        <EmptyState
          title="Chưa có asset"
          description="Tạo listing đầu tiên để gửi duyệt."
          actionLabel="New asset"
          href="/owner/assets/new"
        />
      ) : (
        <OwnerAssetsList
          rows={rows}
          truncated={rows.length >= LIST_VIEW_LIMIT}
        />
      )}
    </>
  );
}
