import { Group, Text } from '@mantine/core';
import { colors } from '@/config/design-tokens';
import { LinkAnchor } from '@/components/ui/LinkAnchor';

/**
 * Shown to anonymous visitors only. One line, no fill — villas are the point
 * of the page. No perk promises, since guest tiers do not grant any.
 */
export function GuestSignupStrip() {
  return (
    <Group
      justify="space-between"
      align="center"
      gap="sm"
      wrap="wrap"
      py="sm"
      style={{
        borderTop: `1px solid ${colors.border}`,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <Text size="sm" c={colors.textSecondary}>
        Tạo tài khoản để sale chốt booking và bạn theo dõi được lịch sử.
      </Text>
      <LinkAnchor
        href="/login?mode=register&role=GUEST"
        size="sm"
        fw={500}
        c="vbnbGreen.6"
        underline="hover"
        py={6}
        display="inline-block"
      >
        Tạo tài khoản →
      </LinkAnchor>
    </Group>
  );
}
