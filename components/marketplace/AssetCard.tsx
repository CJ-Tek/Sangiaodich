'use client';

import {
  Box,
  Group,
  Image,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import Link from 'next/link';
import { colors, motion, radius } from '@/config/design-tokens';
import { assetPublicCode } from '@/lib/engines/asset-search';

export type AssetCardData = {
  id: string;
  slug: string;
  title: string;
  location: string;
  capacity: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: 'VILLA' | 'APARTMENT';
  imageUrl?: string;
  /** Effective (discounted) weekday cost shown to sale */
  costWeekday?: number;
  /** Effective (discounted) weekend cost shown to sale */
  costWeekend?: number;
  /** Base weekday before membership discount */
  baseCostWeekday?: number;
  /** Base weekend before membership discount */
  baseCostWeekend?: number;
  discountPercent?: number;
  showCost?: boolean;
  /** Route prefix for the detail page, e.g. `/me/explore` keeps the card
   * inside the guest dashboard. Defaults to the public asset page. */
  hrefBase?: string;
};

const PLACEHOLDER =
  'https://placehold.co/800x500/F3F3EF/536B58?text=VBNB';

function formatVnd(n: number) {
  return n.toLocaleString('vi-VN');
}

export function AssetCard({ asset }: { asset: AssetCardData }) {
  const href = asset.hrefBase
    ? `${asset.hrefBase}/${asset.slug}`
    : asset.showCost
      ? `/sale/marketplace/${asset.slug}`
      : `/a/${asset.slug}`;
  const discount = Number(asset.discountPercent || 0);
  const showBase =
    discount > 0 &&
    asset.baseCostWeekday != null &&
    asset.baseCostWeekday !== asset.costWeekday;

  return (
    <Box
      component={Link}
      href={href}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        overflow: 'hidden',
        transition: `transform ${motion.normal}ms ${motion.easing}`,
      }}
      className="vbnb-asset-card"
    >
      <Box
        style={{
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: '4 / 3',
          background: colors.surfaceMuted,
        }}
      >
        <Image
          src={asset.imageUrl || PLACEHOLDER}
          alt={asset.title}
          h="100%"
          fit="cover"
          style={{
            transition: `transform ${motion.slow}ms ${motion.easing}`,
          }}
        />
      </Box>

      <Stack gap={4} p="md">
        {asset.showCost ? (
          <Text size="xs" c="dimmed">
            ID {assetPublicCode(asset.id)}
          </Text>
        ) : null}
        <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
          <Title order={4} fw={600} style={{ letterSpacing: '-0.01em' }}>
            {asset.title}
          </Title>
          {discount > 0 ? (
            <Text
              size="xs"
              fw={600}
              c="vbnbGreen.6"
              style={{ whiteSpace: 'nowrap' }}
            >
              −{discount}%
            </Text>
          ) : null}
        </Group>
        <Text size="sm" c="dimmed">
          {asset.location}
          {asset.propertyType === 'APARTMENT'
            ? ' · Căn hộ'
            : asset.propertyType === 'VILLA'
              ? ' · Villa'
              : ''}
          {asset.bedrooms != null
            ? ` · ${asset.bedrooms} PN`
            : ` · ${asset.capacity} khách`}
          {asset.bathrooms != null ? ` · ${asset.bathrooms} WC` : ''}
        </Text>

        {asset.showCost ? (
          <Stack gap={8} mt="sm">
            <Group justify="space-between" gap="xs">
              <Text size="xs" c="dimmed">
                Cost (WD)
              </Text>
              <Group gap={6}>
                {showBase ? (
                  <Text
                    size="xs"
                    c="dimmed"
                    style={{ textDecoration: 'line-through' }}
                  >
                    {formatVnd(asset.baseCostWeekday || 0)}
                  </Text>
                ) : null}
                <Text size="xs" fw={discount > 0 ? 600 : 400}>
                  {formatVnd(asset.costWeekday || 0)}
                </Text>
              </Group>
            </Group>
            {asset.costWeekend != null ? (
              <Group justify="space-between" gap="xs">
                <Text size="xs" c="dimmed">
                  Cost (WE)
                </Text>
                <Group gap={6}>
                  {showBase && asset.baseCostWeekend != null ? (
                    <Text
                      size="xs"
                      c="dimmed"
                      style={{ textDecoration: 'line-through' }}
                    >
                      {formatVnd(asset.baseCostWeekend)}
                    </Text>
                  ) : null}
                  <Text size="xs" fw={discount > 0 ? 600 : 400}>
                    {formatVnd(asset.costWeekend)}
                  </Text>
                </Group>
              </Group>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
