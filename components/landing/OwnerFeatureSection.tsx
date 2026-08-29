'use client';

import type { ReactNode } from 'react';
import { Box, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { colors, radius, shadows, spacing, typography } from '@/config/design-tokens';
import { containerClassName, landingMedia } from '@/components/landing/landing-media';
import { LinkButton } from '@/components/ui/LinkButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import {
  IconNetwork,
  IconShield,
  IconTrend,
} from '@/components/landing/LandingIcons';

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
      className="vbnb-landing-section vbnb-landing-section--lg"
      aria-labelledby="owner-heading"
    >
      <SimpleGrid
        cols={{ base: 1, md: 2 }}
        spacing={{ base: spacing['4xl'], md: spacing['5xl'] }}
        className={containerClassName}
        style={{ alignItems: 'center' }}
      >
        <Box pos="relative">
          <Box
            pos="relative"
            mih={0}
            mah={560}
            style={{ aspectRatio: '4 / 5', borderRadius: radius.xl, overflow: 'hidden' }}
          >
            <Image
              src={landingMedia.owner}
              alt={t('imageAlt')}
              fill
              sizes="(max-width: 768px) 100vw, 48vw"
              style={{ objectFit: 'cover' }}
            />
          </Box>
          <SurfaceCard
            p="md"
            style={{
              position: 'absolute',
              left: spacing.xl,
              bottom: spacing.xl,
              width: 'min(260px, 72%)',
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

        <Stack gap="lg">
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

          <Stack gap="md">
            {featureKeys.map((key) => {
              const Icon = featureIcons[key];
              return (
                <Group key={key} gap="md" align="flex-start" wrap="nowrap">
                  <FeatureIcon>
                    <Icon size={18} />
                  </FeatureIcon>
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

          <LinkButton
            href="/login?mode=register&role=OWNER"
            color="vbnbGreen"
            h={46}
            px={20}
            fw={600}
            w={{ base: '100%', sm: 'auto' }}
          >
            {t('cta')}
          </LinkButton>
        </Stack>
      </SimpleGrid>
    </Box>
  );
}

function FeatureIcon({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </Box>
  );
}
