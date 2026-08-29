'use client';

import { Box, Group, SimpleGrid, Stack, Title } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { colors, spacing, typography } from '@/config/design-tokens';
import { containerClassName } from '@/components/landing/landing-media';
import { AssetCard, type AssetCardData } from '@/components/marketplace/AssetCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';

export function FeaturedStays({ assets }: { assets: AssetCardData[] }) {
  const t = useTranslations('landing.featured');

  return (
    <Box component="section" aria-labelledby="featured-heading" className="vbnb-landing-section">
      <Stack gap={spacing['3xl']} className={containerClassName}>
        <Group justify="space-between" align="baseline">
        <Title
          id="featured-heading"
          order={2}
          fw={typography.title.fontWeight}
          className="vbnb-text-balance"
          style={{
            fontSize: typography.title.fontSize,
            letterSpacing: typography.title.letterSpacing,
            lineHeight: typography.title.lineHeight,
            color: colors.textPrimary,
          }}
        >
          {t('title')}
        </Title>
        <LinkButton href="/marketplace" variant="subtle" color="vbnbGreen">
          {t('viewAll')}
        </LinkButton>
        </Group>

        {!assets.length ? (
        <EmptyState
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          actionLabel={t('emptyAction')}
          href="/login"
        />
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
            {assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Box>
  );
}
