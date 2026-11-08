'use client';

import { Box, Group, Stack, Text, Title } from '@mantine/core';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import { colors, typography } from '@/config/design-tokens';
import { IconBriefcase, IconHome, IconSun } from '@/components/landing/LandingIcons';
import { Reveal } from '@/components/landing/Reveal';
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
    <SectionShell id="how" eyebrow={t('eyebrow')} title={t('title')} align="center">
      <ol
        className="vbnb-grid vbnb-grid-3 vbnb-steps"
        style={{ margin: 0, padding: 0, listStyle: 'none', '--vbnb-grid-gap': '24px' } as CSSProperties}
      >
        {stepKeys.map((key, index) => {
          const Icon = stepIcons[key];
          return (
            <Reveal as="li" key={key} delay={index * 80}>
              <SurfaceCard p="xl" h="100%">
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Box
                      aria-hidden
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: colors.primarySoft,
                        color: colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 0 6px ${colors.surface}`,
                      }}
                    >
                      <Icon size={22} />
                    </Box>
                    <Text
                      aria-hidden
                      className="vbnb-step__index"
                      fw={600}
                      c={colors.borderStrong}
                      style={{ fontSize: '2rem', letterSpacing: '-0.03em', lineHeight: 1 }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                  </Group>
                  <Title
                    order={3}
                    fw={600}
                    style={{
                      fontSize: '1.125rem',
                      letterSpacing: typography.subtitle.letterSpacing,
                      lineHeight: typography.subtitle.lineHeight,
                    }}
                  >
                    {t(`steps.${key}.title`)}
                  </Title>
                  <Text c={colors.textSecondary} style={{ fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight }}>
                    {t(`steps.${key}.body`)}
                  </Text>
                </Stack>
              </SurfaceCard>
            </Reveal>
          );
        })}
      </ol>
    </SectionShell>
  );
}
