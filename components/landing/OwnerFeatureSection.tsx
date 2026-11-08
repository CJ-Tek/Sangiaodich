'use client';

import { Box, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { colors, radius, shadows, spacing, typography } from '@/config/design-tokens';
import { containerClassName, landingMedia } from '@/components/landing/landing-media';
import { LinkButton } from '@/components/ui/LinkButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { FeatureList } from '@/components/landing/FeatureList';
import { Reveal } from '@/components/landing/Reveal';
import { IconNetwork, IconShield, IconTrend } from '@/components/landing/LandingIcons';

const featureKeys = ['network', 'transparency', 'growth'] as const;
const featureIcons = {
  network: IconNetwork,
  transparency: IconShield,
  growth: IconTrend,
} as const;

export function OwnerFeatureSection() {
  const t = useTranslations('landing.owner');

  return (
    <Box
      id="owner"
      component="section"
      className="vbnb-landing-section"
      aria-labelledby="owner-heading"
    >
      <div className={`${containerClassName} vbnb-split vbnb-split--reverse`}>
        <Stack gap={32}>
          <Reveal>
            <Stack gap="sm">
              <span className="vbnb-eyebrow">{t('eyebrow')}</span>
              <Title
                id="owner-heading"
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

          <Reveal delay={200}>
            <LinkButton
              href="/login?mode=register&role=OWNER"
              color="vbnbGreen"
              size="md"
              h={48}
              px={24}
              w={{ base: '100%', sm: 'auto' }}
            >
              {t('cta')}
            </LinkButton>
          </Reveal>
        </Stack>

        <Reveal delay={120}>
          <Box pos="relative" pb={{ base: 0, md: spacing.xl }}>
            <Box
              pos="relative"
              style={{
                aspectRatio: '4 / 5',
                maxHeight: 560,
                width: '100%',
                borderRadius: radius['2xl'],
                overflow: 'hidden',
                boxShadow: shadows.cardHover,
              }}
            >
              <Image
                src={landingMedia.owner}
                alt={t('imageAlt')}
                fill
                sizes="(max-width: 899px) 100vw, 560px"
                style={{ objectFit: 'cover' }}
              />
            </Box>
            <SurfaceCard
              p="md"
              style={{
                position: 'absolute',
                right: spacing.xl,
                bottom: 0,
                width: 'min(270px, 76%)',
                boxShadow: shadows.float,
              }}
            >
              <Text size="sm" fw={600} mb="sm">
                {t('statsTitle')}
              </Text>
              <SimpleGrid cols={2} spacing="sm">
                <Stack gap={2}>
                  <Text size="xs" c={colors.textMuted}>
                    {t('statsBooking')}
                  </Text>
                  <Text fw={700} className="vbnb-tabular-nums" style={{ fontSize: typography.data.fontSize }}>
                    24
                  </Text>
                  <Text size="xs" c="vbnbGreen.6" fw={600}>
                    ↑ 10%
                  </Text>
                </Stack>
                <Stack gap={2}>
                  <Text size="xs" c={colors.textMuted}>
                    {t('statsRevenue')}
                  </Text>
                  <Text fw={700} className="vbnb-tabular-nums" style={{ fontSize: typography.data.fontSize }}>
                    96.5M
                  </Text>
                  <Text size="xs" c="vbnbGreen.6" fw={600}>
                    ↑ 14%
                  </Text>
                </Stack>
              </SimpleGrid>
              <svg
                width="100%"
                height="36"
                viewBox="0 0 220 36"
                fill="none"
                aria-hidden
                style={{ marginTop: spacing.sm }}
              >
                <path
                  d="M0 28 C20 26 30 22 50 20 C70 18 80 10 110 12 C140 14 150 8 180 6 C200 5 210 4 220 3"
                  stroke={colors.primary}
                  strokeWidth="1.8"
                />
              </svg>
            </SurfaceCard>
          </Box>
        </Reveal>
      </div>
    </Box>
  );
}
