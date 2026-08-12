import { Box, Group, Stack, Text } from '@mantine/core';
import Image from 'next/image';
import { colors, radius, shadows } from '@/config/design-tokens';
import { landingMedia } from '@/components/landing/landing-media';

const cards = [
  { title: 'Pine Villa', loc: 'Đà Lạt', img: landingMedia.showcase[0] },
  { title: 'The Nest', loc: 'Hồ Tuyền Lâm', img: landingMedia.showcase[1] },
  { title: 'Misty Hills', loc: 'Xuân Trường', img: landingMedia.showcase[2] },
];

export function ProductShowcase() {
  return (
    <Box style={{ position: 'relative', minHeight: 420 }}>
      <Box
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.xl,
          boxShadow: shadows.float,
          overflow: 'hidden',
        }}
      >
        <Group
          justify="space-between"
          px="lg"
          py="sm"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <Text fw={700} c="vbnbGreen.6" size="sm">
            VBNB
          </Text>
          <Text size="xs" c={colors.textMuted}>
            Sàn villa
          </Text>
        </Group>

        <Box px="lg" py="md">
          <Group gap="lg" mb="md">
            <Stack gap={2}>
              <Text size="xs" c={colors.textMuted}>
                Listing mở
              </Text>
              <Text fw={600} fz={20}>
                128
              </Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c={colors.textMuted}>
                Booking tháng
              </Text>
              <Text fw={600} fz={20}>
                46
              </Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c={colors.textMuted}>
                Hạng
              </Text>
              <Text fw={600} fz={20} c="vbnbGreen.6">
                Gold
              </Text>
            </Stack>
          </Group>

          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            {cards.slice(0, 2).map((card) => (
              <Box
                key={card.title}
                className="vbnb-asset-card"
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.lg,
                  overflow: 'hidden',
                  background: colors.surface,
                }}
              >
                <Box style={{ position: 'relative', aspectRatio: '4 / 3' }}>
                  <Image
                    src={card.img}
                    alt=""
                    fill
                    sizes="220px"
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
                <Box p={10}>
                  <Text size="sm" fw={600}>
                    {card.title}
                  </Text>
                  <Text size="xs" c={colors.textMuted}>
                    {card.loc}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        visibleFrom="sm"
        style={{
          position: 'absolute',
          right: -12,
          bottom: -28,
          width: 148,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 20,
          boxShadow: shadows.float,
          overflow: 'hidden',
        }}
      >
        <Box px={10} py={8} style={{ borderBottom: `1px solid ${colors.border}` }}>
          <Text fw={700} c="vbnbGreen.6" fz={11}>
            VBNB
          </Text>
        </Box>
        <Box style={{ position: 'relative', height: 88 }}>
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
            Lịch trống · 4 khách
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
