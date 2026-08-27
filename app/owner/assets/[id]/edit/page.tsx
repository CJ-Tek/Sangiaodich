import { notFound } from 'next/navigation';
import { Paper } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { AssetForm } from '@/components/owner/NewAssetForm';
import { isPropertyType } from '@/config/asset-tags';
import { colors, radius } from '@/config/design-tokens';
import { loadAssetDiscountRules } from '@/lib/engines/sale-pricing';

function asCostRow(
  value: unknown
): { cost_weekday: number; cost_weekend: number } | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return (value[0] as { cost_weekday: number; cost_weekend: number }) || null;
  }
  return value as { cost_weekday: number; cost_weekend: number };
}

export default async function EditOwnerAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getSessionProfile();
  const admin = await createClient();

  const { data: asset } = await admin
    .from('assets')
    .select(
      'id, title, description, location, capacity, bedrooms, bathrooms, property_type, tags, status, asset_costs(cost_weekday, cost_weekend), asset_images(url, sort_order)'
    )
    .eq('id', id)
    .eq('owner_id', profile!.id)
    .maybeSingle();

  if (!asset) notFound();

  const costs = asCostRow(asset.asset_costs);
  const images = (
    (asset.asset_images || []) as { url: string; sort_order: number }[]
  ).sort((a, b) => a.sort_order - b.sort_order);
  const discountTiers = await loadAssetDiscountRules(asset.id);

  return (
    <>
      <PageHeader
        title={`Edit: ${asset.title}`}
        description="Cập nhật thông tin, cost WD/WE và chiết khấu Sale theo căn."
      />
      <Paper
        p="lg"
        radius={radius.lg}
        maw={720}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <AssetForm
          key={asset.id}
          mode="edit"
          assetId={asset.id}
          status={asset.status}
          initial={{
            title: asset.title,
            description: asset.description ?? '',
            location: asset.location ?? '',
            capacity: Number(asset.capacity) || 1,
            bedrooms: Number(asset.bedrooms) || 1,
            bathrooms: Number(asset.bathrooms) || 1,
            propertyType: isPropertyType(asset.property_type)
              ? asset.property_type
              : 'VILLA',
            tags: Array.isArray(asset.tags) ? (asset.tags as string[]) : [],
            costWeekday: Number(costs?.cost_weekday || 0),
            costWeekend: Number(costs?.cost_weekend || 0),
            images: images.map((i) => i.url),
            discountRules: discountTiers.map((t) => ({
              minCheckedOutCount: t.minCheckedOutCount,
              costDiscountPercent: t.costDiscountPercent,
            })),
          }}
        />
      </Paper>
    </>
  );
}
