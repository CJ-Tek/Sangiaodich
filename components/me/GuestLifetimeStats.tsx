import { Group, Paper, Stack, Text } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2} style={{ flex: 1, minWidth: 120 }}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={600} size="lg">
        {value}
      </Text>
    </Stack>
  );
}

export function GuestLifetimeStats({
  lifetimeBooks,
  lifetimeGmv,
}: {
  lifetimeBooks: number;
  lifetimeGmv: number;
}) {
  return (
    <Paper
      p="lg"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Group gap="lg" wrap="wrap">
        <Stat label="Tổng booking" value={String(lifetimeBooks)} />
        <Stat
          label="Tổng chi tiêu"
          value={`${lifetimeGmv.toLocaleString('vi-VN')} ₫`}
        />
      </Group>
    </Paper>
  );
}
