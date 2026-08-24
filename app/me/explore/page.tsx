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
import { parseExploreAdvancedParams } from '@/lib/engines/explore-filters';

export default async function GuestExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tags?: string | string[];
    page?: string | string[];
    budgetMin?: string | string[];
    budgetMax?: string | string[];
    guests?: string | string[];
    checkIn?: string | string[];
    checkOut?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const profile = await getSessionProfile();
  if (!profile) redirect('/login?next=/me/explore');
  if (profile.role === 'SALE') redirect('/sale/marketplace');
  if (profile.role === 'OWNER') redirect('/owner');
  if (profile.role === 'ADMIN') redirect('/admin');

  const selectedTags = parseTagSearchParam(sp.tags);
  const keyword = sp.q?.trim();
  const page = parseExplorePage(sp.page);
  const advanced = parseExploreAdvancedParams(sp);
  const listOpts = {
    q: keyword,
    tags: selectedTags,
    ...advanced,
  };
  const {
    assets,
    total,
    page: resolvedPage,
    totalPages,
  } = await loadExploreAssets({
    keyword,
    tags: selectedTags,
    budgetMax: advanced.budgetMax,
    guests: advanced.guests,
    checkIn: advanced.checkIn,
    checkOut: advanced.checkOut,
    page,
  });

  if (page !== resolvedPage && total > 0) {
    redirect(
      exploreListHref('/me/explore', {
        ...listOpts,
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
        defaultBudgetMin={advanced.budgetMin}
        defaultBudgetMax={advanced.budgetMax}
        defaultGuests={advanced.guests}
        defaultCheckIn={advanced.checkIn}
        defaultCheckOut={advanced.checkOut}
      />
      {!assets.length ? (
        <EmptyState
          title="Không tìm thấy"
          description="Thử từ khóa khác, bớt thuộc tính, hoặc nới ngân sách / số khách."
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
