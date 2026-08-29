import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { FeeSettingsForm } from '@/components/admin/FeeSettingsForm';
import { FeeSettingsTabs } from '@/components/admin/FeeSettingsTabs';
import { parseFeeSettingTab } from '@/components/admin/fee-setting-tabs';
import { SubscriptionPlansEditor } from '@/components/admin/SubscriptionPlansEditor';
import { Paper, Stack, Text } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import { mapPaymentInfo } from '@/lib/platform/payment-info';
import type { SubscriptionPlan } from '@/lib/engines/subscription-plans';

export default async function AdminFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const t = await getTranslations('admin.fees');
  const admin = await createClient();
  const { data: fees } = await admin
    .from('platform_fee_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const { data: plansRaw } = await admin
    .from('subscription_plans')
    .select(
      'id, role, months, amount, compare_at_amount, label, is_active, sort_order'
    )
    .order('role')
    .order('sort_order');

  const plans: SubscriptionPlan[] = (plansRaw || []).map((p) => ({
    ...p,
    role: p.role as 'OWNER' | 'SALE',
    amount: Number(p.amount),
    compare_at_amount:
      p.compare_at_amount == null ? null : Number(p.compare_at_amount),
    months: p.months as 1 | 3 | 6 | 12,
  }));

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <Stack gap="md" maw={640}>
        <FeeSettingsTabs
          tab={parseFeeSettingTab(tabParam)}
          subscription={
            <>
              <Text size="sm" c="dimmed" mb="md">
                {t('subscriptionHint')}
              </Text>
              <SubscriptionPlansEditor plans={plans} />
            </>
          }
          payout={
            <Paper
              p="lg"
              radius={radius.lg}
              style={{ border: `1px solid ${colors.border}` }}
            >
              <FeeSettingsForm payment={mapPaymentInfo(fees)} />
            </Paper>
          }
        />
      </Stack>
    </>
  );
}
