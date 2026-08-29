'use client';

import { Box, Group, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { colors, spacing } from '@/config/design-tokens';
import { containerClassName } from '@/components/landing/landing-media';
import { LinkAnchor } from '@/components/ui/LinkAnchor';

/** Landing-spaced wrapper: FinalCTA only speaks to owners and sales. */
export function GuestSignupSection() {
  const t = useTranslations('landing.guestSignup');

  return (
    <Box
      component="section"
      aria-label={t('ariaLabel')}
      className={`${containerClassName} vbnb-surface-flat`}
      py={spacing.md}
    >
      <Group
        justify="space-between"
        align="center"
        gap="sm"
        wrap="wrap"
        py="sm"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <Text size="sm" c={colors.textSecondary}>
          {t('text')}
        </Text>
        <LinkAnchor
          href="/login?mode=register&role=GUEST"
          size="sm"
          fw={500}
          c="vbnbGreen.6"
          underline="hover"
          py={6}
          display="inline-block"
        >
          {t('cta')}
        </LinkAnchor>
      </Group>
    </Box>
  );
}
