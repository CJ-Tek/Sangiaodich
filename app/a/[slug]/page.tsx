import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { GuestShell } from '@/components/shells/GuestShell';
import { MarketplaceCalendar } from '@/components/marketplace/MarketplaceCalendar';
import { AssetCtas } from '@/components/marketplace/AssetCtas';
import {
  AssetDetailGallery,
  AssetDetailInfo,
} from '@/components/marketplace/AssetDetailBody';
import { SimpleGrid, Stack, Title, Paper } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';

export const revalidate = 60;

export default async function AssetPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getSessionProfile();
  if (profile?.role === 'SALE') {
    redirect(`/sale/marketplace/${slug}`);
  }

  const admin = await createClient();

  const { data: asset } = await admin
    .from('assets')
    .select(
      'id, slug, title, description, location, capacity, bedrooms, bathrooms, property_type, tags, status, asset_images(url, sort_order)'
    )
    .eq('slug', slug)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!asset) notFound();

  const { data: ranges } = await admin.rpc('asset_confirmed_ranges', {
    p_asset_id: asset.id,
  });

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
    <GuestShell isLoggedIn={profile?.role === 'GUEST' || !!profile}>
      <Stack gap={40} pb={100}>
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
                Availability
              </Title>
              <MarketplaceCalendar
                month={new Date()}
                confirmedRanges={confirmedRanges}
              />
            </Paper>
            <AssetCtas
              slug={asset.slug}
              assetId={asset.id}
              isLoggedInGuest={profile?.role === 'GUEST'}
              sticky
            />
          </Stack>
        </SimpleGrid>
      </Stack>
    </GuestShell>
  );
}
