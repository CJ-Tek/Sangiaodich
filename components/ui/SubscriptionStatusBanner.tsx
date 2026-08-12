import { Group, Paper, Stack, Text, Box } from '@mantine/core';
import { LinkButton } from '@/components/ui/LinkButton';
import { colors, radius, shadows } from '@/config/design-tokens';

export function SubscriptionStatusBanner({
  active,
  periodEnd,
  href,
  activeDescription,
  inactiveDescription,
  activeActionLabel = 'Membership',
  inactiveActionLabel = 'Gia hạn',
}: {
  active: boolean;
  periodEnd?: string | null;
  href: string;
  activeDescription?: string;
  inactiveDescription?: string;
  activeActionLabel?: string;
  inactiveActionLabel?: string;
}) {
  const bg = active ? colors.primarySoft : colors.dangerSoft;
  const accent = active ? colors.success : colors.danger;
  const title = active ? 'Đã kích hoạt' : 'Chưa kích hoạt';
  const description = active
    ? activeDescription || 'Subscription ACTIVE'
    : inactiveDescription || 'Subscription INACTIVE — bị hạn chế';

  return (
    <Paper
      p="md"
      radius={radius.lg}
      style={{
        background: bg,
        border: `1px solid ${active ? colors.border : 'transparent'}`,
        boxShadow: shadows.card,
      }}
    >
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Box
            style={{
              width: 10,
              height: 10,
              borderRadius: radius.full,
              background: accent,
              flexShrink: 0,
            }}
          />
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text fw={600} size="sm" style={{ color: colors.textPrimary }}>
              {title}
              <Text component="span" fw={500} c="dimmed" ml={8}>
                {active ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </Text>
            <Text size="sm" style={{ color: colors.textSecondary }}>
              {description}
              {periodEnd ? ` · đến ${periodEnd}` : ''}
            </Text>
          </Stack>
        </Group>
        <LinkButton
          href={href}
          size="xs"
          variant={active ? 'default' : 'filled'}
          color={active ? undefined : 'vbnbGreen'}
        >
          {active ? activeActionLabel : inactiveActionLabel}
        </LinkButton>
      </Group>
    </Paper>
  );
}
