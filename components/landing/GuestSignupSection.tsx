'use client';

import { Box, Text, Title } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { colors } from '@/config/design-tokens';
import { IconArrowRight, IconSun } from '@/components/landing/LandingIcons';
import { LinkButton } from '@/components/ui/LinkButton';

/** Guest prompt shown above FinalCTA, which only speaks to owners and sales. */
export function GuestSignupCard() {
  const t = useTranslations('landing.guestSignup');

  return (
    <Box component="aside" aria-label={t('ariaLabel')} className="vbnb-guest-card">
      <div className="vbnb-guest-card__icon" aria-hidden>
        <IconSun size={26} />
      </div>

      <div className="vbnb-guest-card__body">
        <span className="vbnb-guest-card__badge">{t('badge')}</span>
        <Title order={3} fw={700} c={colors.textPrimary} style={{ fontSize: '1.1875rem', lineHeight: 1.35 }}>
          {t('title')}
        </Title>
        <Text c={colors.textSecondary} style={{ fontSize: '0.9375rem', lineHeight: 1.55 }}>
          {t('text')}
        </Text>
      </div>

      <LinkButton
        href="/login?mode=register&role=GUEST"
        color="vbnbGreen"
        variant="light"
        size="md"
        h={46}
        px={20}
        rightSection={<IconArrowRight size={18} />}
        className="vbnb-guest-card__cta"
      >
        {t('cta')}
      </LinkButton>
    </Box>
  );
}
