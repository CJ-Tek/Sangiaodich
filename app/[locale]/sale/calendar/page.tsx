import { Box, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { getSessionProfile } from '@/lib/auth/session';
import { isSimpleUi } from '@/lib/engines/ui-mode';
import { dateOnlyAddDays, todayDateOnly } from '@/lib/dates';
import { loadAssetNightBoards } from '@/lib/engines/asset-night-board';
import {
  listNightsFrom,
  parseBoardFrom,
} from '@/lib/engines/night-board-range';
import { loadAssetOwnerContacts } from '@/lib/engines/asset-owner-contacts';
import { loadSaleMarketplaceQuotedAssets } from '@/lib/engines/sale-marketplace-assets';
import { quoteAssetCosts } from '@/lib/engines/pricing';
import { loadSaleGuestSuggestions } from '@/lib/engines/sale-guest-search';
import { NightBoardGrid } from '@/components/inventory/NightBoardGrid';
import { NightBoardFromPicker } from '@/components/inventory/NightBoardFromPicker';
import { PageHeader } from '@/components/ui/PageHeader';
import { colors, radius } from '@/config/design-tokens';
import type { NightBoardColumn } from '@/lib/engines/night-board-display';

function firstParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function SaleCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; q?: string | string[] }>;
}) {
  const { from: fromParam, q: qParam } = await searchParams;
  const q = firstParam(qParam)?.trim() || '';
  const profile = await getSessionProfile();
  const simple = isSimpleUi(profile!.uiMode);
  const from = parseBoardFrom(fromParam);
  const today = todayDateOnly();
  const dates = listNightsFrom(from, 14);
  const to = dateOnlyAddDays(dates[dates.length - 1] ?? from, 1);

  const [list, guestSuggestions] = await Promise.all([
    loadSaleMarketplaceQuotedAssets({
      saleId: profile!.id,
      q: q || undefined,
      page: 1,
      pageSize: 24,
    }),
    loadSaleGuestSuggestions(profile!.id),
  ]);

  const assetIds = list.assets.map((a) => a.id);
  const [boards, contacts] = await Promise.all([
    loadAssetNightBoards(assetIds, { from, to }),
    loadAssetOwnerContacts(assetIds),
  ]);

  const columns: NightBoardColumn[] = list.assets.map((asset) => {
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
    <Stack gap="md">
      <PageHeader title="Lịch" />
      <Box
        component="form"
        method="get"
        action="/sale/calendar"
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
        href="/sale/calendar"
        extraParams={{ q: q || undefined }}
      />
      {!columns.length ? (
        <Text c="dimmed">
          {q ? 'Không tìm thấy villa' : 'Chưa có căn ACTIVE trên sàn.'}
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
