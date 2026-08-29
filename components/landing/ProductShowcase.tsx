'use client';

import { Box, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { colors, radius, shadows, typography } from '@/config/design-tokens';
import { landingMedia } from '@/components/landing/landing-media';
import { SurfaceCard } from '@/components/ui/SurfaceCard';

const cards = [
  { title: 'Pine Villa', loc: 'Đà Lạt', img: landingMedia.showcase[0] },
  { title: 'The Nest', loc: 'Hồ Tuyền Lâm', img: landingMedia.showcase[1] },
  { title: 'Misty Hills', loc: 'Xuân Trường', img: landingMedia.showcase[2] },
];

export function ProductShowcase() {
  const t = useTranslations('landing.productShowcase');
  const tCommon = useTranslations('common');

  return (
    <Box pos="relative" mih={420}>
      <SurfaceCard p={0} style={{ boxShadow: shadows.float, overflow: 'hidden' }}>
        <Group
          justify="space-between"
          px="lg"
          py="sm"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <Text fw={700} c="vbnbGreen.6" size="sm">
            {tCommon('appName')}
          </Text>
          <Text size="xs" c={colors.textMuted}>
            {t('tagline')}
          </Text>
        </Group>

        <Box px="lg" py="md">
          <Group gap="lg" mb="md">
            <Stack gap={2}>
              <Text size="xs" c={colors.textMuted}>
                {t('openListings')}
              </Text>
              <Text
                fw={typography.data.fontWeight}
                className="vbnb-tabular-nums"
                style={{ fontSize: typography.subtitle.fontSize }}
              >
                128
              </Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c={colors.textMuted}>
                {t('monthlyBookings')}
              </Text>
              <Text
                fw={typography.data.fontWeight}
                className="vbnb-tabular-nums"
                style={{ fontSize: typography.subtitle.fontSize }}
              >
                46
              </Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c={colors.textMuted}>
                {t('tier')}
              </Text>
              <Text
                fw={typography.data.fontWeight}
                c="vbnbGreen.6"
                style={{ fontSize: typography.subtitle.fontSize }}
              >
                Gold
              </Text>
            </Stack>
          </Group>

          <SimpleGrid cols={2} spacing="sm">
            {cards.slice(0, 2).map((card) => (
              <AssetPreview key={card.title} title={card.title} loc={card.loc} img={card.img} />
            ))}
          </SimpleGrid>
        </Box>
      </SurfaceCard>

      <SurfaceCard
        visibleFrom="sm"
        p={0}
        style={{
          position: 'absolute',
          right: -12,
          bottom: -28,
          width: 148,
          borderRadius: radius['2xl'],
          boxShadow: shadows.float,
          overflow: 'hidden',
        }}
      >
        <Box px={10} py={8} style={{ borderBottom: `1px solid ${colors.border}` }}>
          <Text fw={700} c="vbnbGreen.6" fz={11}>
            {tCommon('appName')}
          </Text>
        </Box>
        <Box pos="relative" h={88}>
          <Image
            src={cards[2].img}
            alt=""
            fill
            sizes="148px"
            style={{ objectFit: 'cover' }}
          />
        </Box>
        <Box p={10}>
          <Text size="xs" fw={600}>
            {cards[2].title}
          </Text>
          <Text fz={10} c={colors.textMuted}>
            {t('availability')}
          </Text>
        </Box>
      </SurfaceCard>
    </Box>
  );
}

function AssetPreview({
  title,
  loc,
  img,
}: {
  title: string;
  loc: string;
  img: string;
}) {
  return (
    <Box
      className="vbnb-asset-card"
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        overflow: 'hidden',
        background: colors.surface,
      }}
    >
      <Box pos="relative" style={{ aspectRatio: '4 / 3' }}>
        <Image src={img} alt="" fill sizes="220px" style={{ objectFit: 'cover' }} />
      </Box>
      <Box p={10}>
        <Text size="sm" fw={600}>
          {title}
        </Text>
        <Text size="xs" c={colors.textMuted}>
          {loc}
        </Text>
      </Box>
    </Box>
  );
}
