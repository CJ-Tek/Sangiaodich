import { Box, Stack, Text } from '@mantine/core';
import { getTranslations } from 'next-intl/server';
import { getSessionProfile } from '@/lib/auth/session';
import { isSimpleUi } from '@/lib/engines/ui-mode';
import { dateOnlyAddDays, todayDateOnly } from '@/lib/dates';
import { loadAssetNightBoards } from '@/lib/engines/asset-night-board';
import {
  listNightsFrom,
  NIGHT_BOARD_WINDOW,
  parseBoardFrom,
} from '@/lib/engines/night-board-range';
import {
  matchesNightBoardFilters,
  nightBoardFilterParams,
  nightBoardFiltersActive,
  parseNightBoardFilters,
  sortNightBoardAssets,
} from '@/lib/engines/night-board-filters';
import { loadAssetOwnerContacts } from '@/lib/engines/asset-owner-contacts';
import { loadSaleMarketplaceQuotedAssets } from '@/lib/engines/sale-marketplace-assets';
import { quoteAssetCosts } from '@/lib/engines/pricing';
import { loadSaleGuestSuggestions } from '@/lib/engines/sale-guest-search';
import { LIST_VIEW_LIMIT } from '@/lib/supabase/query-guard';
import { NightBoardGrid } from '@/components/inventory/NightBoardGrid';
import { NightBoardFromPicker } from '@/components/inventory/NightBoardFromPicker';
import { NightBoardSearch } from '@/components/inventory/NightBoardSearch';
import { PageHeader } from '@/components/ui/PageHeader';
import { colors, radius } from '@/config/design-tokens';
import type { NightBoardColumn } from '@/lib/engines/night-board-display';

export default async function SaleCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    q?: string | string[];
    city?: string | string[];
    type?: string | string[];
    priceMin?: string | string[];
    priceMax?: string | string[];
    beds?: string | string[];
    sort?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const filters = parseNightBoardFilters(params);
  const filtersOn = nightBoardFiltersActive(filters);
  const t = await getTranslations('sale.calendar');
  const profile = await getSessionProfile();
  const simple = isSimpleUi(profile!.uiMode);
  const from = parseBoardFrom(params.from);
  const today = todayDateOnly();
  const dates = listNightsFrom(from, NIGHT_BOARD_WINDOW);
  const to = dateOnlyAddDays(dates[dates.length - 1] ?? from, 1);

  // Load without DB text search so accent-insensitive folding works in memory.
  const [list, guestSuggestions] = await Promise.all([
    loadSaleMarketplaceQuotedAssets({
      saleId: profile!.id,
      page: 1,
      pageSize: LIST_VIEW_LIMIT,
    }),
    loadSaleGuestSuggestions(profile!.id),
  ]);

  const matched = sortNightBoardAssets(
    list.assets.filter((asset) => matchesNightBoardFilters(asset, filters)),
    filters.sort
  );

  const assetIds = matched.map((a) => a.id);
  const [boards, contacts] = await Promise.all([
    loadAssetNightBoards(assetIds, { from, to }),
    loadAssetOwnerContacts(assetIds),
  ]);

  const columns: NightBoardColumn[] = matched.map((asset) => {
    const costs = asset.asset_costs;
    const wd = Number(costs?.cost_weekday || 0);
    const we = Number(costs?.cost_weekend || 0);
    const pct = list.discounts.get(asset.id) || 0;
    const quoted = quoteAssetCosts(wd, we, pct);
    const contact = contacts.get(asset.id);
    const images = contact?.images?.length
      ? contact.images
      : asset.asset_images || [];
    const cover = [...images].sort((a, b) => a.sort_order - b.sort_order)[0];
    return {
      assetId: asset.id,
      title: asset.title,
      slug: asset.slug,
      imageUrl: cover?.url,
      bedrooms: Number(asset.bedrooms) || 0,
      bathrooms: Number(asset.bathrooms) || 0,
      capacity: Number(asset.capacity) || 0,
      location: asset.location,
      costWeekday: wd,
      costWeekend: we,
      effectiveWeekday: quoted.effectiveWeekday,
      effectiveWeekend: quoted.effectiveWeekend,
      saleDiscountPercent: pct,
      ownerName: contact?.ownerName,
      ownerPhone: contact?.ownerPhone,
      images,
      detailHref:
        !simple && asset.slug
          ? `/sale/marketplace/${asset.slug}`
          : undefined,
      board: boards.get(asset.id)!,
    };
  });

  return (
    <Stack gap="md" style={{ minWidth: 0, maxWidth: '100%' }}>
      <PageHeader title={t('title')} />
      <Box
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: 16,
        }}
      >
        <NightBoardSearch
          href="/sale/calendar"
          from={from}
          today={today}
          initial={filters}
          searchLabel={t('searchVillas')}
          searchPlaceholder={t('searchPlaceholder')}
        />
      </Box>
      <NightBoardFromPicker
        from={from}
        href="/sale/calendar"
        nightCount={NIGHT_BOARD_WINDOW}
        extraParams={nightBoardFilterParams(filters)}
      />
      {!columns.length ? (
        <Text c="dimmed">
          {filtersOn ? t('emptyTitle') : t('emptyNoAssets')}
        </Text>
      ) : (
        <NightBoardGrid
          role="SALE"
          viewerId={profile!.id}
          dates={dates}
          columns={columns}
          guestSuggestions={guestSuggestions}
          simpleUi={simple}
        />
      )}
    </Stack>
  );
}
