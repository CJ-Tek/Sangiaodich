import { createClient } from '@/lib/supabase/server';
import { LIST_VIEW_LIMIT } from '@/lib/supabase/query-guard';
import { todayDateOnly } from '@/lib/dates';
import { getSessionProfile } from '@/lib/auth/session';
import { saleHasActiveSub } from '@/lib/engines/booking-service';
import { resolveSaleCostDiscountPercent } from '@/lib/engines/sale-pricing';
import { loadSaleGuestSuggestions } from '@/lib/engines/sale-guest-search';
import { CreateBookingForm } from '@/components/sale/CreateBookingForm';
import { MarketplaceCalendar } from '@/components/marketplace/MarketplaceCalendar';
import {
  AssetDetailGallery,
  AssetDetailInfo,
} from '@/components/marketplace/AssetDetailBody';
import { Alert, Paper, SimpleGrid, Stack, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import { colors, radius } from '@/config/design-tokens';

export default async function SaleAssetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getSessionProfile();
  const active = await saleHasActiveSub(profile!.id);
  if (!active) {
    return <Alert color="red">Subscription inactive</Alert>;
  }

  const discountPercent = await resolveSaleCostDiscountPercent(profile!.id);
  const admin = await createClient();
  const { data: asset } = await admin
    .from('assets')
    .select(
      'id, title, slug, description, location, capacity, bedrooms, bathrooms, property_type, tags, asset_costs(cost_weekday, cost_weekend), asset_images(url, sort_order)'
    )
    .eq('slug', slug)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  if (!asset) notFound();

  const guestSuggestions = await loadSaleGuestSuggestions(profile!.id);

  const costs = asset.asset_costs as unknown as {
    cost_weekday: number;
    cost_weekend: number;
  };

  const costWd = Number(costs.cost_weekday);
  const costWe = Number(costs.cost_weekend);

  const { data: ranges } = await admin.rpc('asset_confirmed_ranges', {
    p_asset_id: asset.id,
  });

  // Soft-hold nights are only drawn on the calendar ahead of today, so past
  // stays never need to travel.
  const { data: awaitingRows } = await admin
    .from('bookings')
    .select('check_in, check_out')
    .eq('asset_id', asset.id)
    .eq('status', 'AWAITING_OWNER')
    .gte('check_out', todayDateOnly())
    .order('check_in', { ascending: true })
    .limit(LIST_VIEW_LIMIT);

  const images = (asset.asset_images || []) as {
    url: string;
    sort_order: number;
  }[];
  const tags = Array.isArray(asset.tags) ? (asset.tags as string[]) : [];
  const confirmedRanges = (
    (ranges || []) as { check_in: string; check_out: string }[]
  ).map((r) => ({
    checkIn: r.check_in,
    checkOut: r.check_out,
  }));

  return (
    <Stack gap={32} pb="xl">
      <AssetDetailGallery title={asset.title} images={images} />

      <SimpleGrid cols={{ base: 1, md: 5 }} spacing="xl">
        <Stack gap="md" style={{ gridColumn: 'span 3' }}>
          <AssetDetailInfo
            asset={{
              title: asset.title,
              description: asset.description,
              location: asset.location,
              capacity: asset.capacity,
              bedrooms: Number(asset.bedrooms) || 0,
              bathrooms: Number(asset.bathrooms) || 0,
              propertyType: asset.property_type,
              tags,
              images,
            }}
          />
        </Stack>

        <Stack gap="md" style={{ gridColumn: 'span 2' }}>
          <Paper
            p="lg"
            radius={radius.lg}
            style={{ border: `1px solid ${colors.border}` }}
          >
            <Title order={4} fw={600} mb="md">
              Lịch
            </Title>
            <MarketplaceCalendar
              month={new Date()}
              confirmedRanges={confirmedRanges}
            />
          </Paper>
        </Stack>
      </SimpleGrid>

      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Title order={4} fw={600} mb="md">
          Create booking
        </Title>
        <CreateBookingForm
          assetId={asset.id}
          assetTitle={asset.title}
          costWeekday={costWd}
          costWeekend={costWe}
          saleCostDiscountPercent={discountPercent}
          confirmedRanges={confirmedRanges}
          awaitingOwnerRanges={(awaitingRows || []).map((r) => ({
            checkIn: r.check_in,
            checkOut: r.check_out,
          }))}
          guestSuggestions={guestSuggestions}
        />
      </Paper>
    </Stack>
  );
}
