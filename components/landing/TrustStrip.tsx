import { Box, Group, Stack, Text } from '@mantine/core';
import { colors } from '@/config/design-tokens';
import { landingContainer } from '@/components/landing/landing-media';

const brands = [
  'DALAT WONDER',
  'LUXSTAY',
  'TROPICASA',
  'THE NEST',
  'ZEN VILLAS',
  'MISTY HILLS',
];

export function TrustStrip() {
  return (
    <Box
      component="section"
      aria-label="Đối tác tin tưởng"
      style={{
        ...landingContainer,
        paddingTop: 'clamp(48px, 7vw, 80px)',
        paddingBottom: 'clamp(24px, 4vw, 40px)',
      }}
    >
      <Stack gap="lg" align="center">
        <Text
          ta="center"
          size="sm"
          c={colors.textMuted}
          style={{ letterSpacing: '0.02em' }}
        >
          Được tin tưởng bởi chủ villa và sales chuyên nghiệp
        </Text>
        <Group justify="center" gap={28} wrap="wrap">
          {brands.map((name) => (
            <Text
              key={name}
              fw={600}
              c={colors.textMuted}
              style={{
                fontSize: 'clamp(12px, 1.4vw, 14px)',
                letterSpacing: '0.08em',
                opacity: 0.72,
              }}
            >
              {name}
            </Text>
          ))}
        </Group>
      </Stack>
    </Box>
  );
}
