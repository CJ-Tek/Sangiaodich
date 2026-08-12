import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { PageHeader } from '@/components/ui/PageHeader';
import { AssetCard } from '@/components/marketplace/AssetCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { VillaSearch } from '@/components/landing/VillaSearch';
import { parseTagSearchParam } from '@/config/asset-tags';
import { landingContainer } from '@/components/landing/landing-media';
import { SimpleGrid, Box } from '@mantine/core';

export const revalidate = 60;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tags?: string | string[] }>;
}) {
  const { q, tags: tagsParam } = await searchParams;
  const selectedTags = parseTagSearchParam(tagsParam);
  const profile = await getSessionProfile();
  const admin = await createClient();

  let query = admin
    .from('assets')
    .select(
      'id, slug, title, location, capacity, bedrooms, bathrooms, property_type, asset_images(url, sort_order)'
    )
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  const keyword = q?.trim();
  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,location.ilike.%${keyword}%`);
  }
  if (selectedTags.length) {
    query = query.contains('tags', selectedTags);
  }

  const { data: assets } = await query;

  const appHref =
    profile?.role === 'ADMIN'
      ? '/admin'
      : profile?.role === 'OWNER'
        ? '/owner'
        : profile?.role === 'SALE'
          ? '/sale'
          : '/marketplace';

  return (
    <>
      <LandingHeader
        isLoggedIn={!!profile}
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
              images.sort((x, y) => x.sort_order - y.sort_order);
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
