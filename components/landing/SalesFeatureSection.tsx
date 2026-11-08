'use client';

import { Box, Stack, Title } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { colors, typography } from '@/config/design-tokens';
import { containerClassName } from '@/components/landing/landing-media';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { FeatureList } from '@/components/landing/FeatureList';
import { Reveal } from '@/components/landing/Reveal';
import { IconBolt, IconClock, IconTrend } from '@/components/landing/LandingIcons';

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
      className="vbnb-landing-section vbnb-landing-section--surface"
      aria-labelledby="sale-heading"
    >
      <div className={`${containerClassName} vbnb-split`}>
        <Stack gap={32}>
          <Reveal>
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
          </Reveal>

          <FeatureList
            items={featureKeys.map((key) => ({
              key,
              icon: featureIcons[key],
              title: t(`features.${key}.title`),
              body: t(`features.${key}.body`),
            }))}
          />
        </Stack>

        <Reveal delay={120}>
          <ProductShowcase />
        </Reveal>
      </div>
    </Box>
  );
}
