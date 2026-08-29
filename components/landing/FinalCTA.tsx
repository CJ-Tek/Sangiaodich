'use client';

import { Box, Group, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { colors, radius, spacing, typography } from '@/config/design-tokens';
import { containerClassName, landingMedia } from '@/components/landing/landing-media';
import { LinkButton } from '@/components/ui/LinkButton';

export function FinalCTA() {
  const t = useTranslations('landing.finalCta');

  return (
    <Box component="section" aria-labelledby="final-cta-heading" className="vbnb-landing-section">
      <Box className={containerClassName}>
        <Box
          pos="relative"
          style={{
            borderRadius: radius.xl,
            overflow: 'hidden',
            minHeight: 320,
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
                'linear-gradient(90deg, rgba(22,22,22,0.58) 0%, rgba(22,22,22,0.28) 55%, rgba(22,22,22,0.18) 100%)',
            }}
          />
          <Stack
            gap="md"
            maw={560}
            px={{ base: spacing.xl, sm: spacing['4xl'] }}
            py={spacing['4xl']}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <Title
              id="final-cta-heading"
              order={2}
              c="white"
              fw={typography.title.fontWeight}
              className="vbnb-text-balance"
              style={{
                fontSize: typography.title.fontSize,
                letterSpacing: typography.title.letterSpacing,
                lineHeight: typography.title.lineHeight,
              }}
            >
              {t('title')}
            </Title>
            <Text c="rgba(255,255,255,0.86)" style={{ lineHeight: typography.body.lineHeight }}>
              {t('subtitle')}
            </Text>
            <Group gap="sm" mt={spacing.xs}>
              <LinkButton
                href="/login?mode=register&role=OWNER"
                color="vbnbGreen"
                h={46}
                px={18}
                fw={600}
              >
                {t('ownerCta')}
              </LinkButton>
              <LinkButton
                href="/login?mode=register&role=SALE"
                variant="white"
                h={46}
                px={18}
                fw={600}
                style={{ color: colors.textPrimary }}
              >
                {t('saleCta')}
              </LinkButton>
            </Group>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
