'use client';

import { Group, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { colors, radius } from '@/config/design-tokens';
import { LinkAnchor } from '@/components/ui/LinkAnchor';

/** Compact guest prompt shown above FinalCTA, which only speaks to owners and sales. */
export function GuestSignupCard() {
  const t = useTranslations('landing.guestSignup');

  return (
    <Group
      component="aside"
      aria-label={t('ariaLabel')}
      justify="space-between"
      align="center"
      gap="sm"
      wrap="wrap"
      px={{ base: 20, sm: 28 }}
      py={18}
      mb={24}
      style={{
        background: colors.primarySoft,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
      }}
    >
      <Text c={colors.textPrimary} style={{ fontSize: '0.9375rem' }}>
        {t('text')}
      </Text>
      <LinkAnchor
        href="/login?mode=register&role=GUEST"
        fw={600}
        c="vbnbGreen.6"
        underline="hover"
        py={6}
        display="inline-block"
      >
        {t('cta')}
      </LinkAnchor>
    </Group>
  );
}
