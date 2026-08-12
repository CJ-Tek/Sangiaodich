import { Box, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { colors } from '@/config/design-tokens';
import { landingContainer } from '@/components/landing/landing-media';
import {
  IconArrowRight,
  IconBriefcase,
  IconHome,
  IconSun,
} from '@/components/landing/LandingIcons';

const steps = [
  {
    title: 'Chủ villa đăng tài sản',
    body: 'Thiết lập giá vốn, lịch trống và dễ dàng quản lý.',
    Icon: IconHome,
  },
  {
    title: 'Sale chốt nhiều đơn hơn',
    body: 'Truy cập toàn bộ villa, tạo booking và tối ưu lợi nhuận.',
    Icon: IconBriefcase,
  },
  {
    title: 'Khách hàng tận hưởng kỳ nghỉ',
    body: 'Khám phá villa tuyệt đẹp và kết nối với sale phù hợp.',
    Icon: IconSun,
  },
];

export function HowItWorksSection() {
  return (
    <Box
      id="how"
      component="section"
      className="vbnb-landing-section"
      aria-labelledby="how-heading"
      style={{
        ...landingContainer,
        paddingTop: 'clamp(64px, 10vw, 120px)',
        paddingBottom: 'clamp(64px, 10vw, 120px)',
      }}
    >
      <Stack gap={8} mb={48} maw={560}>
        <Text
          fw={600}
          c="vbnbGreen.6"
          style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          VBNB hoạt động như thế nào
        </Text>
        <Title
          id="how-heading"
          order={2}
          fw={700}
          style={{
            fontSize: 'clamp(1.75rem, 3.4vw, 2.5rem)',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
          }}
        >
          Cùng nhau phát triển đơn giản hơn
        </Title>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={{ base: 28, sm: 20 }}>
        {steps.map((step, index) => (
          <Box key={step.title} style={{ position: 'relative' }}>
            {index < steps.length - 1 ? (
              <Box
                visibleFrom="sm"
                c={colors.borderStrong}
                style={{
                  position: 'absolute',
                  top: 22,
                  right: -14,
                  zIndex: 1,
                  opacity: 0.7,
                }}
                aria-hidden
              >
                <IconArrowRight size={18} />
              </Box>
            ) : null}
            <Stack gap="sm">
              <Box
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: colors.primarySoft,
                  color: colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <step.Icon size={20} />
              </Box>
              <Title order={3} fw={600} fz={20} style={{ letterSpacing: '-0.02em' }}>
                {step.title}
              </Title>
              <Text size="sm" c={colors.textSecondary} style={{ lineHeight: 1.65 }}>
                {step.body}
              </Text>
            </Stack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
