import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SimpleGrid } from '@mantine/core';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { AssetCard } from '@/components/marketplace/AssetCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { VillaSearch } from '@/components/landing/VillaSearch';
import { VillaPagination } from '@/components/marketplace/VillaPagination';
import { parseTagSearchParam } from '@/config/asset-tags';
import {
  exploreListHref,
  loadExploreAssets,
  parseExplorePage,
  toAssetCardData,
} from '@/lib/engines/explore-assets';

export default async function GuestExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tags?: string | string[];
    page?: string | string[];
  }>;
}) {
  const { q, tags: tagsParam, page: pageParam } = await searchParams;
  const profile = await getSessionProfile();
  if (!profile) redirect('/login?next=/me/explore');
  if (profile.role === 'SALE') redirect('/sale/marketplace');
  if (profile.role === 'OWNER') redirect('/owner');
  if (profile.role === 'ADMIN') redirect('/admin');

  const selectedTags = parseTagSearchParam(tagsParam);
  const keyword = q?.trim();
  const page = parseExplorePage(pageParam);
  const {
    assets,
    total,
    page: resolvedPage,
    totalPages,
  } = await loadExploreAssets({
    keyword,
    tags: selectedTags,
    page,
  });

  if (page !== resolvedPage && total > 0) {
    redirect(
      exploreListHref('/me/explore', {
        q: keyword,
        tags: selectedTags,
        page: resolvedPage,
      })
    );
  }

  return (
    <>
      <PageHeader
        title="Khám phá villa"
        description="Chọn villa bạn thích rồi bấm liên lạc sale — sale sẽ báo giá và tạo booking."
      />
      <VillaSearch
        variant="marketplace"
        action="/me/explore"
        defaultQ={keyword || ''}
        defaultTags={selectedTags}
      />
      {!assets.length ? (
        <EmptyState
          title="Không tìm thấy"
          description="Thử từ khóa khác hoặc bớt thuộc tính."
          actionLabel="Xóa bộ lọc"
          href="/me/explore"
        />
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl" mt="xl">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={toAssetCardData(asset, '/me/explore')}
              />
            ))}
          </SimpleGrid>
          <Suspense fallback={null}>
            <VillaPagination
              page={resolvedPage}
              totalPages={totalPages}
              total={total}
            />
          </Suspense>
        </>
      )}
    </>
  );
}
