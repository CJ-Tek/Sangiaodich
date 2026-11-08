import { Paper, Text, Stack } from '@mantine/core';
import { getLocale, getTranslations } from 'next-intl/server';
import { formatDateRange, formatDay } from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';
import { colors, radius } from '@/config/design-tokens';
import { SubscriptionPlanPicker } from '@/components/subscription/SubscriptionPlanPicker';
import type { PendingCheckout } from '@/components/subscription/SubscriptionPlanPicker';
import type { SubscriptionPlan } from '@/lib/engines/subscription-plans';

export async function SaleSubscriptionPanel({
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
  const t = await getTranslations('sale.subscription');
  const tStatus = await getTranslations('common.subscriptionStatus');
  const locale = (await getLocale()) as AppLocale;
  const statusKey = active
    ? 'ACTIVE'
    : status === 'PENDING_PAYMENT'
      ? 'PENDING_PAYMENT'
      : 'EXPIRED';

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
              {t('status')}
            </Text>
            <Text fw={600} c={active ? 'vbnbGreen.7' : 'red.8'}>
              {tStatus(statusKey)}
            </Text>
            <Text size="sm" c="dimmed">
              {t('currentPeriod')}
            </Text>
            <Text size="sm" fw={500}>
              {periodStart && periodEnd
                ? formatDateRange(periodStart, periodEnd, locale)
                : '—'}
            </Text>
            {active ? (
              <Text size="sm" c="dimmed" mt="xs">
                {t('extendNote', {
                  periodEnd: periodEnd ? formatDay(periodEnd, locale) : '',
                })}
              </Text>
            ) : null}
          </Stack>
        ) : (
          <Text c="dimmed">{t('noPeriod')}</Text>
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
