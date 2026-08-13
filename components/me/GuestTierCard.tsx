import { Badge, Group, Paper, Progress, Stack, Text, Title } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import type { GuestTierProgress } from '@/lib/engines/guest-overview';

export function GuestTierCard({ tier }: { tier: GuestTierProgress }) {
  return (
    <Paper
      p="lg"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="sm" c="dimmed">
              Hạng hiện tại
            </Text>
            <Title order={3} fw={600} mt={4}>
              {tier.currentLabel}
            </Title>
          </div>
          {tier.atMaxTier ? (
            <Badge color="vbnbGreen" variant="light">
              Hạng cao nhất
            </Badge>
          ) : null}
        </Group>

        {tier.atMaxTier ? (
          <Text size="sm" c="dimmed">
            Bạn đang ở hạng cao nhất.
          </Text>
        ) : (
          <>
            <Text size="sm">
              Tiến độ lên {tier.nextLabel}: {tier.progressBooks}/
              {tier.neededBooks} booking ·{' '}
              {tier.progressGmv.toLocaleString('vi-VN')}/
              {tier.neededGmv.toLocaleString('vi-VN')} ₫
            </Text>
            <Progress value={tier.percent} color="vbnbGreen" radius="sm" />
            <Text size="xs" c="dimmed">
              Cần đủ cả số booking và số tiền mới lên hạng. Còn{' '}
              {tier.remainingBooks} booking và{' '}
              {tier.remainingGmv.toLocaleString('vi-VN')} ₫.
            </Text>
          </>
        )}

        <Text size="xs" c="dimmed">
          Tích luỹ tính khi booking được chốt. Hủy booking đã chốt có thể hạ
          hạng.
        </Text>
      </Stack>
    </Paper>
  );
}
