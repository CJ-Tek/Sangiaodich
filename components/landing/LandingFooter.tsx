import { Box, SimpleGrid, Stack, Text } from '@mantine/core';
import { colors } from '@/config/design-tokens';
import { landingContainer } from '@/components/landing/landing-media';
import { LinkAnchor } from '@/components/ui/LinkAnchor';

const columns = [
  {
    title: 'Nền tảng',
    links: [
      { label: 'Khám phá villas', href: '/marketplace' },
      { label: 'Cách hoạt động', href: '/#how' },
      { label: 'Bảng giá', href: '/#pricing' },
      { label: 'Thành viên', href: '/login?mode=register' },
    ],
  },
  {
    title: 'Dành cho Chủ villa',
    links: [
      { label: 'Đăng villa', href: '/login?mode=register&role=OWNER' },
      { label: 'Hướng dẫn', href: '/#owner' },
      { label: 'Chính sách', href: '/terms' },
      { label: 'Câu hỏi thường gặp', href: '/#owner' },
    ],
  },
  {
    title: 'Dành cho Sale',
    links: [
      { label: 'Dành cho Sales', href: '/login?mode=register&role=SALE' },
      { label: 'Quyền lợi', href: '/#sale' },
      { label: 'Membership sales', href: '/#sale' },
      { label: 'Tài nguyên', href: '/#sale' },
    ],
  },
  {
    title: 'Về chúng tôi',
    links: [
      { label: 'Giới thiệu', href: '/#how' },
      { label: 'Sự nghiệp', href: '#' },
      { label: 'Tin tức', href: '#' },
      { label: 'Liên hệ', href: '/login' },
    ],
  },
  {
    title: 'Pháp lý',
    links: [
      { label: 'Điều khoản sử dụng', href: '/terms' },
      { label: 'Chính sách bảo mật', href: '/privacy' },
      { label: 'Chính sách cookie', href: '/cookies' },
    ],
  },
];

export function LandingFooter() {
  return (
    <Box
      component="footer"
      style={{
        borderTop: `1px solid ${colors.border}`,
        background: colors.background,
      }}
    >
      <Box
        style={{
          ...landingContainer,
          paddingTop: 56,
          paddingBottom: 40,
        }}
      >
        <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing={{ base: 28, md: 24 }}>
          <Stack gap={10}>
            <Text fw={700} c="vbnbGreen.6" style={{ letterSpacing: '-0.04em', fontSize: 20 }}>
              VBNB
            </Text>
            <Text size="sm" c={colors.textSecondary} style={{ lineHeight: 1.65 }}>
              Nền tảng giao dịch villa hiện đại kết nối Chủ villa, Sale và Khách hàng.
            </Text>
          </Stack>
          {columns.map((col) => (
            <Stack key={col.title} gap={10}>
              <Text size="sm" fw={600}>
                {col.title}
              </Text>
              {col.links.map((link) => (
                <LinkAnchor
                  key={link.label}
                  href={link.href}
                  size="sm"
                  c={colors.textSecondary}
                  underline="never"
                  style={{ lineHeight: 1.5 }}
                >
                  {link.label}
                </LinkAnchor>
              ))}
            </Stack>
          ))}
        </SimpleGrid>
        <Text size="xs" c={colors.textMuted} mt={40}>
          © {new Date().getFullYear()} VBNB
        </Text>
      </Box>
    </Box>
  );
}
