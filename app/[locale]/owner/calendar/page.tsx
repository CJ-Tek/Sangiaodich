import { Box, Stack, Text } from '@mantine/core';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { LIST_VIEW_LIMIT } from '@/lib/supabase/query-guard';
import { getSessionProfile } from '@/lib/auth/session';
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
import { loadRatingsByBookingIds } from '@/lib/engines/sale-ratings';
import type { SaleRatingRecord } from '@/lib/engines/sale-ratings';
import { NightBoardGrid } from '@/components/inventory/NightBoardGrid';
import { NightBoardFromPicker } from '@/components/inventory/NightBoardFromPicker';
import { NightBoardSearch } from '@/components/inventory/NightBoardSearch';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { colors, radius } from '@/config/design-tokens';
import type { NightBoardColumn } from '@/lib/engines/night-board-display';

export default async function OwnerCalendarPage({
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
  const t = await getTranslations('owner.calendar');
  const profile = await getSessionProfile();
  const admin = await createClient();
  const from = parseBoardFrom(params.from);
  const today = todayDateOnly();
  const dates = listNightsFrom(from, NIGHT_BOARD_WINDOW);
  const to = dateOnlyAddDays(dates[dates.length - 1] ?? from, 1);

  const { data: assets } = await admin
    .from('assets')
    .select(
      'id, title, slug, location, property_type, capacity, bedrooms, bathrooms, asset_costs(cost_weekday, cost_weekend), asset_images(url, sort_order)'
    )
    .eq('owner_id', profile!.id)
    .eq('status', 'ACTIVE')
    .order('title', { ascending: true })
    .limit(LIST_VIEW_LIMIT);

  const rows = sortNightBoardAssets(
    (assets || []).filter((asset) =>
      matchesNightBoardFilters(asset, filters)
    ),
    filters.sort
  );
  const boards = await loadAssetNightBoards(
    rows.map((a) => a.id),
    { from, to }
  );

  const bookingIds = [...boards.values()].flatMap((b) =>
    b.confirmedStays.map((s) => s.bookingId)
  );
  const ratings = await loadRatingsByBookingIds(bookingIds);
  const ratingsByBooking: Record<string, SaleRatingRecord> = {};
  for (const [id, rating] of ratings) {
    ratingsByBooking[id] = rating;
  }

  const columns: NightBoardColumn[] = rows.map((asset) => {
    const costs = asset.asset_costs as unknown as {
      cost_weekday: number;
      cost_weekend: number;
    } | null;
    const images = (asset.asset_images || []) as {
      url: string;
      sort_order: number;
    }[];
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
      costWeekday: Number(costs?.cost_weekday || 0),
      costWeekend: Number(costs?.cost_weekend || 0),
      images,
      detailHref: `/owner/assets/${asset.id}/edit`,
      board: boards.get(asset.id)!,
    };
  });

  return (
    <Stack gap="md" style={{ minWidth: 0, maxWidth: '100%' }}>
      <PageHeader
        title={t('title')}
        action={
          <LinkButton href="/owner/assets/new" color="vbnbGreen" size="sm">
            {t('addAsset')}
          </LinkButton>
        }
      />
      <Box
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: 16,
        }}
      >
        <NightBoardSearch
          href="/owner/calendar"
          from={from}
          today={today}
          initial={filters}
          searchLabel={t('searchVillas')}
          searchPlaceholder={t('searchPlaceholder')}
        />
      </Box>
      <NightBoardFromPicker
        from={from}
        href="/owner/calendar"
        nightCount={NIGHT_BOARD_WINDOW}
        extraParams={nightBoardFilterParams(filters)}
      />
      {!columns.length ? (
        filtersOn ? (
          <Text c="dimmed">{t('emptyTitle')}</Text>
        ) : (
          <EmptyState
            title={t('emptyNoAssets')}
            description={t('emptyDesc')}
            actionLabel={t('addAsset')}
            href="/owner/assets/new"
          />
        )
      ) : (
        <NightBoardGrid
          role="OWNER"
          viewerId={profile!.id}
          dates={dates}
          columns={columns}
          ratingsByBooking={ratingsByBooking}
        />
      )}
    </Stack>
  );
}
