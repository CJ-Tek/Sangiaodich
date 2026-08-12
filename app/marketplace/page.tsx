import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getSessionRoleHint } from '@/lib/auth/session-role';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { PageHeader } from '@/components/ui/PageHeader';
import { AssetCard } from '@/components/marketplace/AssetCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { VillaSearch } from '@/components/landing/VillaSearch';
import { parseTagSearchParam } from '@/config/asset-tags';
import { landingContainer } from '@/components/landing/landing-media';
import { SimpleGrid, Box } from '@mantine/core';
import { unstable_cache } from 'next/cache';

export const revalidate = 60;

const getMarketplaceAssetsCached = unstable_cache(
  async () => {
    const admin = createServiceClient();
    const result = await admin
      .from('assets')
      .select(
        'id, slug, title, location, capacity, bedrooms, bathrooms, property_type, asset_images(url, sort_order)'
      )
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .order('sort_order', { ascending: true, foreignTable: 'asset_images' })
      .limit(1, { foreignTable: 'asset_images' });

    return result.data || [];
  },
  ['marketplace-assets-default-v1'],
  { revalidate: 60 }
);

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tags?: string | string[] }>;
}) {
  const startedAt = Date.now();
  const { q, tags: tagsParam } = await searchParams;
  const selectedTags = parseTagSearchParam(tagsParam);
  const keyword = q?.trim();
  const roleStartedAt = Date.now();
  const rolePromise = getSessionRoleHint().then((value) => ({
    value,
    ms: Date.now() - roleStartedAt,
  }));
  const assetsStartedAt = Date.now();
  const assetsPromise =
    !keyword && selectedTags.length === 0
      ? getMarketplaceAssetsCached().then((value) => ({
          value,
          ms: Date.now() - assetsStartedAt,
        }))
      : (async () => {
          const admin = await createClient();
          let query = admin
            .from('assets')
            .select(
              'id, slug, title, location, capacity, bedrooms, bathrooms, property_type, asset_images(url, sort_order)'
            )
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false })
            .order('sort_order', {
              ascending: true,
              foreignTable: 'asset_images',
            })
            .limit(1, { foreignTable: 'asset_images' });

          if (keyword) {
            query = query.or(
              `title.ilike.%${keyword}%,location.ilike.%${keyword}%`
            );
          }
          if (selectedTags.length) {
            query = query.contains('tags', selectedTags);
          }

          const result = await query;
          return {
            value: result.data || [],
            ms: Date.now() - assetsStartedAt,
          };
        })();

  const [roleData, assetsData] = await Promise.all([rolePromise, assetsPromise]);
  const role = roleData.value;
  const assets = assetsData.value;
  console.info(
    `[perf] ${JSON.stringify({
      scope: 'marketplace',
      roleMs: roleData.ms,
      assetsMs: assetsData.ms,
      assetsCount: assets.length,
      keyword: keyword ? 'yes' : 'no',
      tagsCount: selectedTags.length,
      totalMs: Date.now() - startedAt,
    })}`
  );

  const appHref =
    role === 'ADMIN'
      ? '/admin'
      : role === 'OWNER'
        ? '/owner'
        : role === 'SALE'
          ? '/sale'
          : '/marketplace';

  return (
    <>
      <LandingHeader
        isLoggedIn={!!role}
        appHref={appHref}
        solid
      />
      <Box
        component="main"
        style={{
          ...landingContainer,
          paddingTop: 24,
          paddingBottom: 64,
        }}
      >
        <PageHeader
          title="Khám phá villas"
          description="Lọc theo địa điểm và thuộc tính chủ nhà đã đăng. Không hiển thị giá."
        />
        <VillaSearch
          variant="marketplace"
          defaultQ={keyword || ''}
          defaultTags={selectedTags}
        />
        {!assets?.length ? (
          <EmptyState
            title="Không tìm thấy"
            description="Thử từ khóa khác hoặc bớt thuộc tính."
            actionLabel="Xóa bộ lọc"
            href="/marketplace"
          />
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl" mt="xl">
            {assets.map((a) => {
              const images = (a.asset_images || []) as {
                url: string;
                sort_order: number;
              }[];
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
                      a.property_type === 'APARTMENT' ||
                      a.property_type === 'VILLA'
                        ? a.property_type
                        : undefined,
                    imageUrl: images[0]?.url,
                  }}
                />
              );
            })}
          </SimpleGrid>
        )}
      </Box>
      <LandingFooter />
    </>
  );
}
