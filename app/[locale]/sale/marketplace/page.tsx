import { localeRedirect } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { getSessionProfile } from '@/lib/auth/session';
import { saleHasActiveSub } from '@/lib/engines/booking-service';
import { quoteAssetCosts } from '@/lib/engines/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { AssetCard } from '@/components/marketplace/AssetCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { VillaPagination } from '@/components/marketplace/VillaPagination';
import { NightBoardSearch } from '@/components/inventory/NightBoardSearch';
import { Alert, SimpleGrid, Box } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import { EXPLORE_PAGE_SIZE } from '@/lib/engines/explore-assets';
import {
  loadSaleMarketplaceQuotedAssets,
  parseExplorePage,
} from '@/lib/engines/sale-marketplace-assets';
import {
  matchesNightBoardFilters,
  nightBoardFilterParams,
  nightBoardFiltersActive,
  parseNightBoardFilters,
  sortNightBoardAssets,
} from '@/lib/engines/night-board-filters';
import { LIST_VIEW_LIMIT } from '@/lib/supabase/query-guard';

function marketplaceHref(
  filters: ReturnType<typeof parseNightBoardFilters>,
  page: number
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(nightBoardFilterParams(filters))) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/sale/marketplace?${qs}` : '/sale/marketplace';
}

export default async function SaleMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    city?: string | string[];
    type?: string | string[];
    priceMin?: string | string[];
    priceMax?: string | string[];
    beds?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  }>;
}) {
  const t = await getTranslations('sale.marketplace');
  const params = await searchParams;
  const filters = parseNightBoardFilters(params);
  const filtersOn = nightBoardFiltersActive(filters);
  const profile = await getSessionProfile();
  const active = await saleHasActiveSub(profile!.id);
  const page = parseExplorePage(params.page);

  if (!active) {
    return (
      <>
        <PageHeader title={t('title')} />
        <Alert color="red" title={t('subInactive')}>
          {t('subInactiveDesc')}
        </Alert>
      </>
    );
  }

  // Load a wide ACTIVE set, then fold/filter in memory (accent-safe).
  const list = await loadSaleMarketplaceQuotedAssets({
    saleId: profile!.id,
    page: 1,
    pageSize: LIST_VIEW_LIMIT,
  });

  const matched = sortNightBoardAssets(
    list.assets.filter((asset) => matchesNightBoardFilters(asset, filters)),
    filters.sort
  );
  const total = matched.length;
  const pageSize = EXPLORE_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / pageSize));
  const resolvedPage = Math.min(page, totalPages);
  const start = (resolvedPage - 1) * pageSize;
  const assets = matched.slice(start, start + pageSize);
  const { discounts } = list;

  if (page !== resolvedPage && total > 0) {
    return await localeRedirect(marketplaceHref(filters, resolvedPage));
  }

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <Box
        mb="xl"
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: 16,
        }}
      >
        <NightBoardSearch
          href="/sale/marketplace"
          initial={filters}
          searchLabel={t('searchVillas')}
          searchPlaceholder={t('searchPlaceholder')}
        />
      </Box>
      {!assets.length ? (
        <EmptyState
          title={filtersOn ? t('emptyTitle') : t('emptyNoAssets')}
        />
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
            {assets.map((a) => {
              const images = (a.asset_images || []) as {
                url: string;
                sort_order: number;
              }[];
              const costs = a.asset_costs as unknown as {
                cost_weekday: number;
                cost_weekend: number;
              };
              const baseWd = Number(costs?.cost_weekday || 0);
              const baseWe = Number(costs?.cost_weekend || 0);
              const quoted = quoteAssetCosts(
                baseWd,
                baseWe,
                discounts.get(a.id) ?? 0
              );
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
