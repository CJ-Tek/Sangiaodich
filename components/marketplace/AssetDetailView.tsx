import { SimpleGrid, Stack, Title, Paper } from '@mantine/core';
import { MarketplaceCalendar } from '@/components/marketplace/MarketplaceCalendar';
import { AssetCtas } from '@/components/marketplace/AssetCtas';
import {
  AssetDetailGallery,
  AssetDetailInfo,
} from '@/components/marketplace/AssetDetailBody';
import { colors, radius } from '@/config/design-tokens';
import type { AssetDetailRecord } from '@/lib/engines/asset-detail';

/** Gallery, info, availability and CTAs — same layout for public and guest. */
export function AssetDetailView({
  asset,
  isLoggedInGuest,
  leadIntent,
}: {
  asset: AssetDetailRecord;
  isLoggedInGuest: boolean;
  /** Guest arrived back here after logging in from the contact CTA. */
  leadIntent?: boolean;
}) {
  return (
    <Stack gap={40} pb={100}>
      <AssetDetailGallery title={asset.title} images={asset.images} />

      <SimpleGrid cols={{ base: 1, md: 5 }} spacing="xl">
        <Stack gap="md" style={{ gridColumn: 'span 3' }}>
          <AssetDetailInfo
            asset={{
              title: asset.title,
              description: asset.description,
              location: asset.location,
              capacity: asset.capacity,
              bedrooms: asset.bedrooms,
              bathrooms: asset.bathrooms,
              propertyType: asset.propertyType,
              tags: asset.tags,
              images: asset.images,
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
              confirmedRanges={asset.confirmedRanges}
            />
          </Paper>
          <AssetCtas
            slug={asset.slug}
            assetId={asset.id}
            isLoggedInGuest={isLoggedInGuest}
            leadIntent={leadIntent}
            sticky
          />
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
