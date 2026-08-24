import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { PageHeader } from '@/components/ui/PageHeader';
import { AssetCard } from '@/components/marketplace/AssetCard';
import { GuestSignupStrip } from '@/components/marketplace/GuestSignupStrip';
import { EmptyState } from '@/components/ui/EmptyState';
import { VillaSearch } from '@/components/landing/VillaSearch';
import { VillaPagination } from '@/components/marketplace/VillaPagination';
import { parseTagSearchParam } from '@/config/asset-tags';
import { landingContainer } from '@/components/landing/landing-media';
import { SimpleGrid, Box } from '@mantine/core';
import { Suspense } from 'react';
import {
  exploreListHref,
  loadExploreAssets,
  parseExplorePage,
  toAssetCardData,
} from '@/lib/engines/explore-assets';
import { parseExploreAdvancedParams } from '@/lib/engines/explore-filters';

export const revalidate = 60;

export default async function MarketplacePage({
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
  const startedAt = Date.now();
  const sp = await searchParams;
  const selectedTags = parseTagSearchParam(sp.tags);
  const keyword = sp.q?.trim();
  const page = parseExplorePage(sp.page);
  const advanced = parseExploreAdvancedParams(sp);
  const listOpts = {
    q: keyword,
    tags: selectedTags,
    ...advanced,
  };
  // Verified session, not the cookie hint: a stale cookie would otherwise
  // bounce a visitor to /me/explore and from there to /login.
  const roleStartedAt = Date.now();
  const rolePromise = getSessionProfile().then((profile) => ({
    value: profile?.role ?? null,
    ms: Date.now() - roleStartedAt,
  }));
  const assetsStartedAt = Date.now();
  const assetsPromise = loadExploreAssets({
    keyword,
    tags: selectedTags,
    budgetMax: advanced.budgetMax,
    guests: advanced.guests,
    checkIn: advanced.checkIn,
    checkOut: advanced.checkOut,
    page,
  }).then((value) => ({ value, ms: Date.now() - assetsStartedAt }));

  const [roleData, assetsData] = await Promise.all([rolePromise, assetsPromise]);
  const role = roleData.value;
  const { assets, total, page: resolvedPage, totalPages } = assetsData.value;
  console.info(
    `[perf] ${JSON.stringify({
      scope: 'marketplace',
      roleMs: roleData.ms,
      assetsMs: assetsData.ms,
      assetsCount: assets.length,
      total,
      page: resolvedPage,
      keyword: keyword ? 'yes' : 'no',
      tagsCount: selectedTags.length,
      budget: advanced.budgetMax ? 'yes' : 'no',
      guests: advanced.guests ?? 0,
      totalMs: Date.now() - startedAt,
    })}`
  );

  // Signed-in guests browse inside their dashboard so they keep the nav bar.
  if (role === 'GUEST') {
    redirect(
      exploreListHref('/me/explore', {
        ...listOpts,
        page: resolvedPage,
      })
    );
  }

  if (page !== resolvedPage && total > 0) {
    redirect(
      exploreListHref('/marketplace', {
        ...listOpts,
        page: resolvedPage,
      })
    );
  }

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
          defaultBudgetMin={advanced.budgetMin}
          defaultBudgetMax={advanced.budgetMax}
          defaultGuests={advanced.guests}
          defaultCheckIn={advanced.checkIn}
          defaultCheckOut={advanced.checkOut}
        />
        {!assets?.length ? (
          <EmptyState
            title="Không tìm thấy"
            description="Thử từ khóa khác, bớt thuộc tính, hoặc nới ngân sách / số khách."
            actionLabel="Xóa bộ lọc"
            href="/marketplace"
          />
        ) : (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl" mt="xl">
              {assets.map((asset) => (
                <AssetCard key={asset.id} asset={toAssetCardData(asset)} />
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
        {/* After the villas: browsing comes first, the ask comes second. */}
        {!role ? (
          <Box mt="xl">
            <GuestSignupStrip />
          </Box>
        ) : null}
      </Box>
      <LandingFooter />
    </>
  );
}
