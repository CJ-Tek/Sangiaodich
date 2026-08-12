import { Title, Text, Stack, Group } from '@mantine/core';
import { colors } from '@/config/design-tokens';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Stack gap={6} mb="xl">
      <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
        <Title
          order={2}
          fw={600}
          style={{ color: colors.textPrimary, letterSpacing: '-0.02em' }}
        >
          {title}
        </Title>
        {action}
      </Group>
      {description ? (
        <Text c="dimmed" size="sm" maw={560}>
          {description}
        </Text>
      ) : null}
    </Stack>
  );
}
