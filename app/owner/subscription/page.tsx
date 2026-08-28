import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { SubscriptionPlanPicker } from '@/components/subscription/SubscriptionPlanPicker';
import { Paper, Text, Stack } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import { listActivePlansForRole } from '@/lib/engines/subscription-payment';
import { getPendingIntentForProfile } from '@/lib/engines/subscription-payment';
import { isSubscriptionActive } from '@/lib/engines/subscription';
import { todayDateOnly } from '@/lib/dates';

export default async function OwnerSubscriptionPage() {
  const profile = await getSessionProfile();
  const admin = await createClient();
  const { data: sub } = await admin
    .from('subscriptions')
    .select('*')
    .eq('profile_id', profile!.id)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  const plans = await listActivePlansForRole('OWNER');
  const pending = await getPendingIntentForProfile(profile!.id);
  const gatewayEnabled = Boolean(
    process.env.SEPAY_MERCHANT_ID && process.env.SEPAY_MERCHANT_SECRET_KEY
  );

  const active =
    sub &&
    isSubscriptionActive({
      status: sub.status,
      periodEnd: sub.period_end,
      today: todayDateOnly(),
    });

  return (
    <>
      <PageHeader
        title="Subscription"
        description="Chọn gói để duy trì listing trên sàn. Gia hạn sớm được cộng vào ngày hết hạn hiện tại (tháng lịch)."
      />
      <Stack gap="md" maw={640}>
        <Paper
          p="lg"
          radius={radius.lg}
          style={{ border: `1px solid ${colors.border}` }}
        >
          {sub ? (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Status
              </Text>
              <Text
                fw={600}
                c={active ? 'vbnbGreen.6' : undefined}
              >
                {sub.status}
              </Text>
              <Text size="sm" c="dimmed">
                {sub.period_start} → {sub.period_end}
              </Text>
              {active ? (
                <Text size="sm" c="dimmed">
                  Gói mới sẽ được cộng thêm vào hạn {sub.period_end}.
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
        <LogoutButton />
      </Stack>
    </>
  );
}
