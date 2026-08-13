import { Box, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import { LinkButton } from '@/components/ui/LinkButton';

/**
 * Shown to anonymous visitors only. Lists what an account actually unlocks —
 * no discount or perk promises, since guest tiers do not grant any.
 */
const reasons = [
  'Sale chỉ tạo được booking cho tài khoản đã có trên hệ thống',
  'Xem lại toàn bộ booking và số tiền đã thanh toán',
  'Được ghi nhận tích luỹ booking để lên hạng thành viên',
];

export function GuestSignupStrip({ compact }: { compact?: boolean }) {
  return (
    <Paper
      p={compact ? 'md' : 'lg'}
      radius={radius.lg}
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.primarySoft,
      }}
    >
      <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap">
        <Stack gap="xs" style={{ flex: 1, minWidth: 260 }}>
          <Title order={4} fw={600}>
            Tạo tài khoản để book villa
          </Title>
          {reasons.map((reason) => (
            <Text key={reason} size="sm" c={colors.textSecondary}>
              · {reason}
            </Text>
          ))}
        </Stack>
        <Box>
          <LinkButton
            href="/login?mode=register&role=GUEST"
            color="vbnbGreen"
            size="md"
          >
            Tạo tài khoản
          </LinkButton>
        </Box>
      </Group>
    </Paper>
  );
}
