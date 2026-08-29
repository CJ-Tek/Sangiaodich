'use client';

import {
  Box,
  Group,
  Image,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useLocale, useTranslations } from 'next-intl';
import { colors, motion, radius, shadows } from '@/config/design-tokens';
import { assetPublicCode } from '@/lib/engines/asset-search';
import { formatCurrency } from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';
import { Link } from '@/lib/i18n/navigation';

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
  costWeekday?: number;
  costWeekend?: number;
  baseCostWeekday?: number;
  baseCostWeekend?: number;
  discountPercent?: number;
  showCost?: boolean;
  hrefBase?: string;
};

const PLACEHOLDER =
  'https://placehold.co/800x500/F3F3EF/536B58?text=VBNB';

export function AssetCard({ asset }: { asset: AssetCardData }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('marketplace.assetCard');
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

  const propertySuffix =
    asset.propertyType === 'APARTMENT'
      ? ` · ${t('apartment')}`
      : asset.propertyType === 'VILLA'
        ? ` · ${t('villa')}`
        : '';
  const capacitySuffix =
    asset.bedrooms != null
      ? ` · ${t('bedrooms', { count: asset.bedrooms })}`
      : ` · ${t('guests', { count: asset.capacity })}`;
  const bathroomSuffix =
    asset.bathrooms != null
      ? ` · ${t('bathrooms', { count: asset.bathrooms })}`
      : '';

  return (
    <Box
      component={Link}
      href={href}
      className="vbnb-asset-card vbnb-surface-card vbnb-surface-card--interactive"
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: radius.lg,
        overflow: 'hidden',
        boxShadow: shadows.card,
        transition: `transform ${motion.normal}ms ${motion.easing}, box-shadow ${motion.normal}ms ${motion.easing}`,
      }}
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
          <Text size="xs" c="dimmed" className="vbnb-tabular-nums">
            {t('idPrefix')} {assetPublicCode(asset.id)}
          </Text>
        ) : null}
        <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
          <Title order={4} fw={600} style={{ letterSpacing: '-0.02em' }}>
            {asset.title}
          </Title>
          {discount > 0 ? (
            <Text
              size="xs"
              fw={600}
              c="vbnbGreen.6"
              className="vbnb-tabular-nums"
              style={{ whiteSpace: 'nowrap' }}
            >
              −{discount}%
            </Text>
          ) : null}
        </Group>
        <Text size="sm" c="dimmed">
          {asset.location}
          {propertySuffix}
          {capacitySuffix}
          {bathroomSuffix}
        </Text>

        {asset.showCost ? (
          <Stack gap={8} mt="sm">
            <Group justify="space-between" gap="xs">
              <Text size="xs" c="dimmed">
                {t('costWeekday')}
              </Text>
              <Group gap={6}>
                {showBase ? (
                  <Text
                    size="xs"
                    c="dimmed"
                    className="vbnb-tabular-nums"
                    style={{ textDecoration: 'line-through' }}
                  >
                    {formatCurrency(asset.baseCostWeekday || 0, locale)}
                  </Text>
                ) : null}
                <Text size="xs" fw={discount > 0 ? 600 : 400} className="vbnb-tabular-nums">
                  {formatCurrency(asset.costWeekday || 0, locale)}
                </Text>
              </Group>
            </Group>
            {asset.costWeekend != null ? (
              <Group justify="space-between" gap="xs">
                <Text size="xs" c="dimmed">
                  {t('costWeekend')}
                </Text>
                <Group gap={6}>
                  {showBase && asset.baseCostWeekend != null ? (
                    <Text
                      size="xs"
                      c="dimmed"
                      className="vbnb-tabular-nums"
                      style={{ textDecoration: 'line-through' }}
                    >
                      {formatCurrency(asset.baseCostWeekend, locale)}
                    </Text>
                  ) : null}
                  <Text size="xs" fw={discount > 0 ? 600 : 400} className="vbnb-tabular-nums">
                    {formatCurrency(asset.costWeekend, locale)}
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
