'use client';

import { Box, Text, Title } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { colors, typography } from '@/config/design-tokens';
import { containerClassName } from '@/components/landing/landing-media';
import { Reveal } from '@/components/landing/Reveal';
import { IconClock, IconCoins, IconShield, IconUsers } from '@/components/landing/LandingIcons';

const items = [
  { key: 'transparency', icon: IconCoins },
  { key: 'realtime', icon: IconClock },
  { key: 'safety', icon: IconShield },
  { key: 'free', icon: IconUsers },
] as const;

export function CommitmentStrip() {
  const t = useTranslations('landing.commitments');

  return (
    <Box component="section" aria-label={t('ariaLabel')} className="vbnb-commitments">
      <ul className={`${containerClassName} vbnb-grid vbnb-grid-4 vbnb-commitments__list`}>
        {items.map(({ key, icon: Icon }, index) => (
          <Reveal as="li" key={key} delay={index * 70} className="vbnb-commitments__item">
            <Box
              aria-hidden
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: '50%',
                background: colors.primarySoft,
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={18} />
            </Box>
            <div>
              <Title
                order={3}
                fw={600}
                mb={2}
                style={{ fontSize: '0.9375rem', lineHeight: 1.4, letterSpacing: '-0.01em' }}
              >
                {t(`items.${key}.title`)}
              </Title>
              <Text size="sm" c={colors.textSecondary} style={{ lineHeight: typography.body.lineHeight }}>
                {t(`items.${key}.body`)}
              </Text>
            </div>
          </Reveal>
        ))}
      </ul>
    </Box>
  );
}
