import { Box, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import Image from 'next/image';
import { colors, radius, shadows } from '@/config/design-tokens';
import { landingContainer, landingMedia } from '@/components/landing/landing-media';
import { LinkButton } from '@/components/ui/LinkButton';
import {
  IconNetwork,
  IconShield,
  IconTrend,
} from '@/components/landing/LandingIcons';

const features = [
  {
    title: 'Tiếp cận mạng lưới sale chất lượng',
    body: 'Villa của bạn đến đúng người đang có khách — không cần tự chạy ads.',
    Icon: IconNetwork,
  },
  {
    title: 'Minh bạch & an toàn',
    body: 'Giá vốn, lịch trống và đối soát rõ ràng. Guest không thấy giá trên sàn.',
    Icon: IconShield,
  },
  {
    title: 'Tăng booking, tăng doanh thu',
    body: 'Ít thao tác vận hành hơn, nhiều đêm được lấp hơn.',
    Icon: IconTrend,
  },
];

export function OwnerFeatureSection() {
  return (
    <Box
      id="owner"
      component="section"
      className="vbnb-landing-section"
      aria-labelledby="owner-heading"
      style={{
        ...landingContainer,
        paddingTop: 'clamp(64px, 10vw, 120px)',
        paddingBottom: 'clamp(64px, 10vw, 120px)',
      }}
    >
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 40, md: 56 }} style={{ alignItems: 'center' }}>
        <Box style={{ position: 'relative' }}>
          <Box
            style={{
              position: 'relative',
              aspectRatio: '4 / 5',
              maxHeight: 560,
              borderRadius: radius.xl,
              overflow: 'hidden',
            }}
          >
            <Image
              src={landingMedia.owner}
              alt="Không gian nội thất villa"
              fill
              sizes="(max-width: 768px) 100vw, 48vw"
              style={{ objectFit: 'cover' }}
            />
          </Box>
          <Box
            style={{
              position: 'absolute',
              left: 20,
              bottom: 20,
              width: 'min(260px, 72%)',
              background: colors.surface,
              borderRadius: radius.lg,
              boxShadow: shadows.float,
              border: `1px solid ${colors.border}`,
              padding: 16,
            }}
          >
            <Text size="sm" fw={600} mb={12}>
              Hiệu suất villa của bạn
            </Text>
            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Text size="xs" c={colors.textMuted}>
                  Booking
                </Text>
                <Text fw={700} fz={22}>
                  24
                </Text>
                <Text size="xs" c="vbnbGreen.6" fw={600}>
                  ↑ 10%
                </Text>
              </div>
              <div>
                <Text size="xs" c={colors.textMuted}>
                  Doanh thu
                </Text>
                <Text fw={700} fz={22}>
                  96.5M
                </Text>
                <Text size="xs" c="vbnbGreen.6" fw={600}>
                  ↑ 14%
                </Text>
              </div>
            </Box>
            <svg
              width="100%"
              height="36"
              viewBox="0 0 220 36"
              fill="none"
              aria-hidden
              style={{ marginTop: 10 }}
            >
              <path
                d="M0 28 C20 26 30 22 50 20 C70 18 80 10 110 12 C140 14 150 8 180 6 C200 5 210 4 220 3"
                stroke={colors.primary}
                strokeWidth="1.8"
              />
            </svg>
          </Box>
        </Box>

        <Stack gap="lg">
          <div>
            <Text
              fw={600}
              c="vbnbGreen.6"
              mb={10}
              style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              Dành cho Chủ villa
            </Text>
            <Title
              id="owner-heading"
              order={2}
              fw={700}
              style={{
                fontSize: 'clamp(1.75rem, 3.4vw, 2.6rem)',
                letterSpacing: '-0.03em',
                lineHeight: 1.12,
              }}
            >
              Hiển thị nhiều hơn.
              <br />
              Booking nhiều hơn. Ít nỗ lực hơn.
            </Title>
          </div>

          <Stack gap="md">
            {features.map((item) => (
              <Box key={item.title} style={{ display: 'flex', gap: 14 }}>
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: radius.md,
                    background: '#F0F3EC',
                    color: colors.primaryDark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <item.Icon size={18} />
                </Box>
                <div>
                  <Text fw={600} size="sm" mb={4}>
                    {item.title}
                  </Text>
                  <Text size="sm" c={colors.textSecondary} style={{ lineHeight: 1.6 }}>
                    {item.body}
                  </Text>
                </div>
              </Box>
            ))}
          </Stack>

          <LinkButton
            href="/login?mode=register&role=OWNER"
            color="vbnbGreen"
            h={46}
            px={20}
            fw={600}
            w={{ base: '100%', sm: 'auto' }}
          >
            Đăng villa ngay
          </LinkButton>
        </Stack>
      </SimpleGrid>
    </Box>
  );
}
