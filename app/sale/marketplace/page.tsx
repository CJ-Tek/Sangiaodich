import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { saleHasActiveSub } from '@/lib/engines/booking-service';
import { resolveSaleCostDiscountPercent } from '@/lib/engines/sale-pricing';
import { quoteAssetCosts } from '@/lib/engines/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { AssetCard } from '@/components/marketplace/AssetCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, SimpleGrid, TextInput, Button, Group, Box } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import { matchesAssetSearch } from '@/lib/engines/asset-search';

export default async function SaleMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const profile = await getSessionProfile();
  const active = await saleHasActiveSub(profile!.id);
  const discountPercent = active
    ? await resolveSaleCostDiscountPercent(profile!.id)
    : 0;
  const admin = await createClient();

  if (!active) {
    return (
      <>
        <PageHeader title="Marketplace" />
        <Alert color="red" title="Subscription không ACTIVE">
          Không xem cost / không tạo booking. Liên hệ admin mark paid.
        </Alert>
      </>
    );
  }

  const { data: rows } = await admin
    .from('assets')
    .select(
      'id, slug, title, location, capacity, bedrooms, bathrooms, property_type, asset_images(url, sort_order), asset_costs(cost_weekday, cost_weekend)'
    )
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  const assets = (rows || []).filter((a) =>
    matchesAssetSearch(q || '', {
      id: a.id,
      slug: a.slug,
      title: a.title,
      location: a.location,
    })
  );

  return (
    <>
      <PageHeader
        title="Marketplace"
        description="Mọi asset ACTIVE + cost. Scan margin và tạo booking hộ."
      />
      <Box
        component="form"
        mb="xl"
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: 16,
        }}
      >
        <Group align="flex-end" gap="sm" wrap="wrap">
          <TextInput
            name="q"
            label="Search villas"
            placeholder="Tên, địa điểm, hoặc mã villa…"
            defaultValue={q}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Button type="submit" color="vbnbGreen">
            Search
          </Button>
        </Group>
      </Box>
      {!assets?.length ? (
        <EmptyState
          title={q ? 'Không tìm thấy villa' : 'Chưa có asset ACTIVE'}
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
          {assets.map((a) => {
            const images = (a.asset_images || []) as {
              url: string;
              sort_order: number;
            }[];
            images.sort((x, y) => x.sort_order - y.sort_order);
            const costs = a.asset_costs as unknown as {
              cost_weekday: number;
              cost_weekend: number;
            };
            const baseWd = Number(costs?.cost_weekday || 0);
            const baseWe = Number(costs?.cost_weekend || 0);
            const quoted = quoteAssetCosts(baseWd, baseWe, discountPercent);
            return (
              <AssetCard
                key={a.id}
                asset={{
                  id: a.id,
                  slug: a.slug,
                  title: a.title,
                  location: a.location,
                  capacity: a.capacity,
                  bedrooms: Number(a.bedrooms) || undefined,
                  bathrooms: Number(a.bathrooms) || undefined,
                  propertyType:
                    a.property_type === 'APARTMENT' || a.property_type === 'VILLA'
                      ? a.property_type
                      : undefined,
                  imageUrl: images[0]?.url,
                  showCost: true,
                  costWeekday: quoted.effectiveWeekday,
                  costWeekend: quoted.effectiveWeekend,
                  baseCostWeekday: quoted.baseWeekday,
                  baseCostWeekend: quoted.baseWeekend,
                  discountPercent: quoted.discountPercent,
                }}
              />
            );
          })}
        </SimpleGrid>
      )}
    </>
  );
}
