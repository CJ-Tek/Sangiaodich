import { getLocale, getTranslations } from 'next-intl/server';
import { pageTitle } from '@/lib/seo/page-title';
import { formatDateRange, formatDay } from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { SubscriptionPlanPicker } from '@/components/subscription/SubscriptionPlanPicker';
import { Badge, Group, Paper, Text, Stack } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import { listActivePlansForRole } from '@/lib/engines/subscription-payment';
import { getPendingIntentForProfile } from '@/lib/engines/subscription-payment';
import { isSubscriptionActive } from '@/lib/engines/subscription';
import { todayDateOnly } from '@/lib/dates';

export const generateMetadata = pageTitle('owner.subscription');

export default async function OwnerSubscriptionPage() {
  const t = await getTranslations('owner.subscription');
  const tStatus = await getTranslations('common.subscriptionStatus');
  const locale = (await getLocale()) as AppLocale;
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
        title={t('title')}
        description={t('description')}
        guideId="owner-subscription"
      />
      <Stack gap="xl" maw={760}>
        <Paper
          p="lg"
          radius={radius.lg}
          style={{ border: `1px solid ${colors.border}` }}
        >
          {sub ? (
            <Stack gap="xs">
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <div>
                  <SectionTitle level="card" order={2}>
                    {t('currentPlan')}
                  </SectionTitle>
                  <Text size="sm" c="dimmed" mt={4}>
                    {formatDateRange(sub.period_start, sub.period_end, locale)}
                  </Text>
                </div>
                <Badge
                  variant="light"
                  color={active ? 'vbnbGreen' : 'red'}
                  size="lg"
                >
                  {tStatus(
                    active
                      ? 'ACTIVE'
                      : sub.status === 'PENDING_PAYMENT'
                        ? 'PENDING_PAYMENT'
                        : 'EXPIRED'
                  )}
                </Badge>
              </Group>
              {active ? (
                <Text size="sm" c="dimmed">
                  {t('extendNote', {
                    periodEnd: formatDay(sub.period_end, locale),
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
        <div className="vbnb-shell-mobile-only">
          <LogoutButton />
        </div>
      </Stack>
    </>
  );
}
