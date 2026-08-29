'use client';

import { Box, Group, Stack, Text, Title } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { colors, spacing, typography } from '@/config/design-tokens';
import {
  IconArrowRight,
  IconBriefcase,
  IconHome,
  IconSun,
} from '@/components/landing/LandingIcons';
import { SectionShell } from '@/components/ui/SectionShell';
import { SurfaceCard } from '@/components/ui/SurfaceCard';

const stepKeys = ['owner', 'sale', 'guest'] as const;
const stepIcons = {
  owner: IconHome,
  sale: IconBriefcase,
  guest: IconSun,
} as const;

export function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');

  return (
    <SectionShell id="how" eyebrow={t('eyebrow')} title={t('title')}>
      <Stack gap="lg">
        {stepKeys.map((key, index) => {
          const Icon = stepIcons[key];
          return (
            <SurfaceCard key={key} p="lg">
              <Group align="flex-start" wrap="nowrap" gap="lg">
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    borderRadius: '50%',
                    background: colors.primarySoft,
                    color: colors.textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} />
                </Box>
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Title
                      order={3}
                      fw={typography.subtitle.fontWeight}
                      style={{
                        fontSize: typography.subtitle.fontSize,
                        letterSpacing: typography.subtitle.letterSpacing,
                        lineHeight: typography.subtitle.lineHeight,
                      }}
                    >
                      {t(`steps.${key}.title`)}
                    </Title>
                    {index < stepKeys.length - 1 ? (
                      <Box c={colors.borderStrong} visibleFrom="sm" aria-hidden>
                        <IconArrowRight size={18} />
                      </Box>
                    ) : null}
                  </Group>
                  <Text size="sm" c={colors.textSecondary} style={{ lineHeight: typography.body.lineHeight }}>
                    {t(`steps.${key}.body`)}
                  </Text>
                </Stack>
              </Group>
            </SurfaceCard>
          );
        })}
      </Stack>
    </SectionShell>
  );
}
