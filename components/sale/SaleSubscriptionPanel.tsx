import { Paper, Text, Stack } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import { SubscriptionPlanPicker } from '@/components/subscription/SubscriptionPlanPicker';
import type { PendingCheckout } from '@/components/subscription/SubscriptionPlanPicker';
import type { SubscriptionPlan } from '@/lib/engines/subscription-plans';

export function SaleSubscriptionPanel({
  status,
  periodStart,
  periodEnd,
  active,
  plans,
  pending,
  gatewayEnabled,
}: {
  status?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  active: boolean;
  plans: SubscriptionPlan[];
  pending: PendingCheckout | null;
  gatewayEnabled: boolean;
}) {
  return (
    <Stack gap="md" maw={640}>
      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        {status ? (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Status
            </Text>
            <Text fw={600} c={active ? 'vbnbGreen.6' : undefined}>
              {status}
            </Text>
            <Text size="sm" c="dimmed">
              Kỳ hiện tại
            </Text>
            <Text size="sm" fw={500}>
              {periodStart} → {periodEnd}
            </Text>
            {active ? (
              <Text size="sm" c="dimmed" mt="xs">
                Gói mới sẽ được cộng thêm vào hạn {periodEnd}.
              </Text>
            ) : null}
          </Stack>
        ) : (
          <Text c="dimmed">
            Chưa có kỳ thanh toán. Chọn gói bên dưới và quét QR để kích hoạt.
          </Text>
        )}
      </Paper>

      <SubscriptionPlanPicker
        plans={plans}
        initialPending={pending}
        gatewayEnabled={gatewayEnabled}
      />
    </Stack>
  );
}
