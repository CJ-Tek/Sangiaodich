'use client';

import { Box, Group, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { colors, typography } from '@/config/design-tokens';
import { containerClassName, landingMedia } from '@/components/landing/landing-media';
import { LinkButton } from '@/components/ui/LinkButton';
import { VillaSearch } from '@/components/landing/VillaSearch';

export function HeroSection() {
  const t = useTranslations('landing.hero');
  const bullets = t.raw('bullets') as string[];

  return (
    <Box component="section" aria-labelledby="landing-hero-title" className="vbnb-hero">
      <div className={`${containerClassName} vbnb-hero__grid`}>
        <Stack gap={28} className="vbnb-landing-fade-up vbnb-hero__copy">
          <span className="vbnb-eyebrow">{t('badge')}</span>

          <Title
            id="landing-hero-title"
            order={1}
            fw={typography.display.fontWeight}
            c={colors.textPrimary}
            className="vbnb-text-balance"
            style={{
              fontSize: 'clamp(2.125rem, 4.2vw, 3.25rem)',
              lineHeight: 1.08,
              letterSpacing: typography.display.letterSpacing,
            }}
          >
            {t('titleLine1')} {t('titleLine2')}{' '}
            <Text span inherit c="vbnbGreen.6">
              {t('titleHighlight')}
            </Text>
          </Title>

          <ul className="vbnb-hero__bullets">
            {bullets.map((line) => (
              <Text
                key={line}
                component="li"
                c={colors.textSecondary}
                style={{
                  fontSize: '1rem',
                  lineHeight: typography.body.lineHeight,
                }}
              >
                {line}
              </Text>
            ))}
          </ul>

          <Group gap="sm" className="vbnb-hero__ctas">
            <LinkButton href="/marketplace" color="vbnbGreen" size="md" h={48} px={24}>
              {t('exploreCta')}
            </LinkButton>
            <LinkButton
              href="#how"
              variant="default"
              size="md"
              h={48}
              px={24}
              fw={500}
              style={{ borderColor: colors.borderStrong, color: colors.textPrimary }}
            >
              {t('learnMoreCta')}
            </LinkButton>
          </Group>
        </Stack>

        <div className="vbnb-hero__media vbnb-landing-fade-in">
          <Image
            src={landingMedia.hero}
            alt={t('imageAlt')}
            fill
            priority
            sizes="(max-width: 899px) 100vw, 560px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>

      <div className={`${containerClassName} vbnb-hero__search`}>
        <VillaSearch />
      </div>
    </Box>
  );
}
