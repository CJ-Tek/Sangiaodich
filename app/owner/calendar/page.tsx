import { Box, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { LIST_VIEW_LIMIT } from '@/lib/supabase/query-guard';
import { getSessionProfile } from '@/lib/auth/session';
import { dateOnlyAddDays, todayDateOnly } from '@/lib/dates';
import { loadAssetNightBoards } from '@/lib/engines/asset-night-board';
import {
  listNightsFrom,
  parseBoardFrom,
} from '@/lib/engines/night-board-range';
import { matchesAssetSearch } from '@/lib/engines/asset-search';
import { loadRatingsByBookingIds } from '@/lib/engines/sale-ratings';
import type { SaleRatingRecord } from '@/lib/engines/sale-ratings';
import { NightBoardGrid } from '@/components/inventory/NightBoardGrid';
import { NightBoardFromPicker } from '@/components/inventory/NightBoardFromPicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { colors, radius } from '@/config/design-tokens';
import type { NightBoardColumn } from '@/lib/engines/night-board-display';

function firstParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function OwnerCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; q?: string | string[] }>;
}) {
  const { from: fromParam, q: qParam } = await searchParams;
  const q = firstParam(qParam)?.trim() || '';
  const profile = await getSessionProfile();
  const admin = await createClient();
  const from = parseBoardFrom(fromParam);
  const today = todayDateOnly();
  const dates = listNightsFrom(from, 21);
  const to = dateOnlyAddDays(dates[dates.length - 1] ?? from, 1);

  const { data: assets } = await admin
    .from('assets')
    .select(
      'id, title, slug, location, capacity, bedrooms, bathrooms, asset_costs(cost_weekday, cost_weekend), asset_images(url, sort_order)'
    )
    .eq('owner_id', profile!.id)
    .eq('status', 'ACTIVE')
    .order('title', { ascending: true })
    .limit(LIST_VIEW_LIMIT);

  const rows = (assets || []).filter((asset) =>
    q ? matchesAssetSearch(q, asset) : true
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
    <Stack gap="md">
      <PageHeader
        title="Lịch"
        action={
          <LinkButton href="/owner/assets/new" color="vbnbGreen" size="sm">
            Thêm căn
          </LinkButton>
        }
      />
      <Box
        component="form"
        method="get"
        action="/owner/calendar"
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: 16,
        }}
      >
        {from !== today ? (
          <input type="hidden" name="from" value={from} />
        ) : null}
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
      <NightBoardFromPicker
        from={from}
        href="/owner/calendar"
        extraParams={{ q: q || undefined }}
      />
      {!columns.length ? (
        q ? (
          <Text c="dimmed">Không tìm thấy villa</Text>
        ) : (
          <EmptyState
            title="Chưa có căn ACTIVE"
            description="Tạo listing để hiện trên lịch và gửi duyệt lên sàn."
            actionLabel="Thêm căn"
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
