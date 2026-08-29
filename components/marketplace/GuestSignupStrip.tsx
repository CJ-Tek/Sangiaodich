import { Group, Text } from '@mantine/core';
import { getTranslations } from 'next-intl/server';
import { colors } from '@/config/design-tokens';
import { LinkAnchor } from '@/components/ui/LinkAnchor';

/**
 * Shown to anonymous visitors only. One line, no fill — villas are the point
 * of the page. No perk promises, since guest tiers do not grant any.
 */
export async function GuestSignupStrip() {
  const t = await getTranslations('marketplace.signup');

  return (
    <Group
      justify="space-between"
      align="center"
      gap="sm"
      wrap="wrap"
      py="sm"
      style={{
        borderTop: `1px solid ${colors.border}`,
        borderBottom: `1px solid ${colors.border}`,
      }}
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
  );
}
