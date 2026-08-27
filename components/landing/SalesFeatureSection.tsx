import { Box, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import { landingContainer } from '@/components/landing/landing-media';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import {
  IconBolt,
  IconClock,
  IconTrend,
} from '@/components/landing/LandingIcons';

const features = [
  {
    title: 'Truy cập giá vốn & lịch trống tức thì',
    body: 'Xem cost weekday/weekend và ngày đã book trước khi chốt khách.',
    Icon: IconClock,
  },
  {
    title: 'Tạo booking chỉ trong vài phút',
    body: 'Giữ chỗ, gửi thông tin thanh toán và theo dõi trạng thái realtime.',
    Icon: IconBolt,
  },
  {
    title: 'Tăng hạng thành viên & thu nhập',
    body: 'Owner set mốc lần và % trên từng căn. Check-out càng nhiều trên căn đó, cost càng thấp nếu Owner đã mở chiết khấu.',
    Icon: IconTrend,
  },
];

export function SalesFeatureSection() {
  return (
    <Box
      id="sale"
      component="section"
      className="vbnb-landing-section"
      aria-labelledby="sale-heading"
      style={{
        ...landingContainer,
        paddingTop: 'clamp(64px, 10vw, 120px)',
        paddingBottom: 'clamp(64px, 10vw, 120px)',
      }}
    >
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 40, md: 56 }} style={{ alignItems: 'center' }}>
        <Stack gap="lg">
          <div>
            <Text
              fw={600}
              c="vbnbGreen.6"
              mb={10}
              style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              Dành cho Sale
            </Text>
            <Title
              id="sale-heading"
              order={2}
              fw={700}
              style={{
                fontSize: 'clamp(1.75rem, 3.4vw, 2.6rem)',
                letterSpacing: '-0.03em',
                lineHeight: 1.12,
              }}
            >
              Thông tin real-time.
              <br />
              Cơ hội nhiều hơn.
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
        </Stack>

        <ProductShowcase />
      </SimpleGrid>
    </Box>
  );
}
