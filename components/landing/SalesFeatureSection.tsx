'use client';

import { Box, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { colors, radius, spacing, typography } from '@/config/design-tokens';
import { containerClassName } from '@/components/landing/landing-media';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import {
  IconBolt,
  IconClock,
  IconTrend,
} from '@/components/landing/LandingIcons';

const featureKeys = ['inventory', 'booking', 'membership'] as const;
const featureIcons = {
  inventory: IconClock,
  booking: IconBolt,
  membership: IconTrend,
} as const;

export function SalesFeatureSection() {
  const t = useTranslations('landing.sale');

  return (
    <Box
      id="sale"
      component="section"
      className="vbnb-landing-section vbnb-landing-section--lg"
      aria-labelledby="sale-heading"
    >
      <SimpleGrid
        cols={{ base: 1, md: 2 }}
        spacing={{ base: spacing['4xl'], md: spacing['5xl'] }}
        className={containerClassName}
        style={{ alignItems: 'center' }}
      >
        <Stack gap="lg">
          <Stack gap="sm">
            <span className="vbnb-eyebrow">{t('eyebrow')}</span>
            <Title
              id="sale-heading"
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
              {t('titleLine1')}
              <br />
              {t('titleLine2')}
            </Title>
          </Stack>

          <Stack gap="md">
            {featureKeys.map((key) => {
              const Icon = featureIcons[key];
              return (
                <Group key={key} gap="md" align="flex-start" wrap="nowrap">
                  <Box
                    style={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      borderRadius: radius.md,
                      background: colors.primarySoft,
                      color: colors.primaryDark,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} />
                  </Box>
                  <div>
                    <Text fw={600} size="sm" mb={4}>
                      {t(`features.${key}.title`)}
                    </Text>
                    <Text size="sm" c={colors.textSecondary} style={{ lineHeight: typography.body.lineHeight }}>
                      {t(`features.${key}.body`)}
                    </Text>
                  </div>
                </Group>
              );
            })}
          </Stack>
        </Stack>

        <ProductShowcase />
      </SimpleGrid>
    </Box>
  );
}
