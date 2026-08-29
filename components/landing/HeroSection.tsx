'use client';

import { Box, Group, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { colors, spacing, typography } from '@/config/design-tokens';
import { containerClassName, landingMedia } from '@/components/landing/landing-media';
import { LinkButton } from '@/components/ui/LinkButton';
import { VillaSearch } from '@/components/landing/VillaSearch';

export function HeroSection() {
  const t = useTranslations('landing.hero');
  const bullets = t.raw('bullets') as string[];

  return (
    <Box
      component="section"
      aria-labelledby="landing-hero-title"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <Box
        className={`${containerClassName} vbnb-landing-hero`}
        style={{
          position: 'relative',
          paddingTop: spacing['3xl'],
          paddingBottom: spacing.sm,
        }}
      >
        <Stack
          gap="lg"
          maw={620}
          className="vbnb-landing-fade-up vbnb-landing-hero-copy"
          style={{ position: 'relative', zIndex: 1, paddingBottom: spacing.md }}
        >
          <span className="vbnb-eyebrow">{t('badge')}</span>

          <Title
            id="landing-hero-title"
            order={1}
            fw={typography.display.fontWeight}
            c={colors.textPrimary}
            className="vbnb-text-balance"
            style={{
              fontSize: typography.display.fontSize,
              lineHeight: typography.display.lineHeight,
              letterSpacing: typography.display.letterSpacing,
            }}
          >
            {t('titleLine1')}
            <br />
            {t('titleLine2')}
            <br />
            <Text span inherit c="vbnbGreen.6">
              {t('titleHighlight')}
            </Text>
          </Title>

          <Box
            component="ul"
            maw={520}
            style={{
              margin: 0,
              paddingLeft: spacing.lg,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs,
              color: colors.primary,
            }}
          >
            {bullets.map((line) => (
              <Text
                key={line}
                component="li"
                style={{
                  fontSize: typography.body.fontSize,
                  lineHeight: typography.body.lineHeight,
                }}
              >
                <Text span c={colors.textSecondary} inherit>
                  {line}
                </Text>
              </Text>
            ))}
          </Box>

          <Group gap="sm" className="vbnb-landing-hero-ctas">
            <LinkButton href="/marketplace" color="vbnbGreen" h={46} px={20} fw={600}>
              {t('exploreCta')}
            </LinkButton>
            <LinkButton
              href="#how"
              variant="default"
              h={46}
              px={20}
              fw={500}
              style={{ borderColor: colors.borderStrong, color: colors.textPrimary }}
            >
              {t('learnMoreCta')}
            </LinkButton>
          </Group>
        </Stack>

        <Box className="vbnb-landing-hero-image vbnb-landing-fade-in">
          <Image
            src={landingMedia.hero}
            alt={t('imageAlt')}
            fill
            priority
            sizes="(max-width: 767px) 100vw, 52vw"
            style={{ objectFit: 'cover' }}
          />
          <Box className="vbnb-landing-hero-fade" />
        </Box>

        <Box className="vbnb-landing-hero-search" style={{ position: 'relative', zIndex: 2 }}>
          <VillaSearch />
        </Box>
      </Box>
    </Box>
  );
}
