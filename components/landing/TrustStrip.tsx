'use client';

import { Box, Group, Stack, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { colors, spacing, typography } from '@/config/design-tokens';
import { containerClassName } from '@/components/landing/landing-media';

const brands = [
  'DALAT WONDER',
  'LUXSTAY',
  'TROPICASA',
  'THE NEST',
  'ZEN VILLAS',
  'MISTY HILLS',
];

export function TrustStrip() {
  const t = useTranslations('landing.trustStrip');

  return (
    <Box
      component="section"
      aria-label={t('ariaLabel')}
      className={containerClassName}
      py={spacing['4xl']}
    >
      <Stack gap="lg" align="center">
        <Text ta="center" size="sm" c={colors.textMuted} style={typography.label}>
          {t('tagline')}
        </Text>
        <Group justify="center" gap={spacing['2xl']} wrap="wrap">
          {brands.map((name) => (
            <Text
              key={name}
              fw={typography.label.fontWeight}
              c={colors.textMuted}
              style={{
                fontSize: typography.label.fontSize,
                letterSpacing: typography.label.letterSpacing,
                textTransform: typography.label.textTransform,
                opacity: 0.72,
              }}
            >
              {name}
            </Text>
          ))}
        </Group>
      </Stack>
    </Box>
  );
}
