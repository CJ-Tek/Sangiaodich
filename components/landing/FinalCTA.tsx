'use client';

import { Box, Group, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { colors, radius, spacing, typography } from '@/config/design-tokens';
import { containerClassName, landingMedia } from '@/components/landing/landing-media';
import { LinkButton } from '@/components/ui/LinkButton';
import { Reveal } from '@/components/landing/Reveal';
import { GuestSignupCard } from '@/components/landing/GuestSignupSection';

export function FinalCTA({ showGuestSignup = false }: { showGuestSignup?: boolean }) {
  const t = useTranslations('landing.finalCta');

  return (
    <Box component="section" aria-labelledby="final-cta-heading" className="vbnb-landing-section">
      <div className={containerClassName}>
        {showGuestSignup ? (
          <Reveal>
            <GuestSignupCard />
          </Reveal>
        ) : null}
        <Reveal delay={showGuestSignup ? 80 : 0}>
          <Box
            pos="relative"
            style={{
              borderRadius: radius['2xl'],
              overflow: 'hidden',
              minHeight: 360,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Image
              src={landingMedia.cta}
              alt=""
              fill
              sizes="(max-width: 1240px) 100vw, 1200px"
              style={{ objectFit: 'cover' }}
            />
            <Box
              pos="absolute"
              inset={0}
              style={{
                background:
                  'linear-gradient(90deg, rgba(8,32,29,0.82) 0%, rgba(8,32,29,0.55) 50%, rgba(8,32,29,0.15) 100%)',
              }}
            />
            <Stack
              gap="md"
              maw={660}
              px={{ base: spacing.xl, sm: 56 }}
              py={{ base: spacing['4xl'], sm: 64 }}
              style={{ position: 'relative', zIndex: 1 }}
            >
              <Title
                id="final-cta-heading"
                order={2}
                c="white"
                fw={typography.title.fontWeight}
                className="vbnb-text-balance"
                style={{
                  fontSize: 'clamp(1.625rem, 3vw, 2.25rem)',
                  letterSpacing: typography.title.letterSpacing,
                  lineHeight: typography.title.lineHeight,
                }}
              >
                {t('title')}
              </Title>
              <Text c="rgba(255,255,255,0.88)" style={{ fontSize: '1.0625rem', lineHeight: typography.body.lineHeight }}>
                {t('subtitle')}
              </Text>
              <Group gap="sm" mt={spacing.sm}>
                <LinkButton
                  href="/login?mode=register&role=OWNER"
                  color="vbnbGreen"
                  size="md"
                  h={48}
                  px={24}
                >
                  {t('ownerCta')}
                </LinkButton>
                <LinkButton
                  href="/login?mode=register&role=SALE"
                  variant="white"
                  size="md"
                  h={48}
                  px={24}
                  style={{ color: colors.textPrimary }}
                >
                  {t('saleCta')}
                </LinkButton>
              </Group>
            </Stack>
          </Box>
        </Reveal>
      </div>
    </Box>
  );
}
