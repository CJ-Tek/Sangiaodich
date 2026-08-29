import { getLocale, getTranslations } from 'next-intl/server';
import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { MarkPaidButton } from '@/components/admin/MarkPaidButton';
import { requireRole } from '@/lib/auth/session';
import {
  listMismatchIntents,
  listUnresolvedEvents,
  type MismatchIntentRow,
  type UnresolvedEventRow,
} from '@/lib/engines/admin-payment-ops';
import { listAllPlans } from '@/lib/engines/subscription-payment';
import { formatDateTime, formatVnd, planDurationLabel } from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';
import type { SubscriptionPlan } from '@/lib/engines/subscription-plans';
import { colors, radius } from '@/config/design-tokens';

export default async function AdminPaymentsPage() {
  await requireRole(['ADMIN']);
  const t = await getTranslations('admin.payments');
  const locale = (await getLocale()) as AppLocale;

  const [mismatches, events, plans] = await Promise.all([
    listMismatchIntents(),
    listUnresolvedEvents(),
    listAllPlans(),
  ]);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <Stack gap="xl" maw={860}>
        <Section
          title={t('mismatchTitle')}
          hint={t('mismatchHint')}
          empty={t('mismatchEmpty')}
          count={mismatches.length}
        >
          {mismatches.map((row) => (
            <MismatchCard
              key={row.intentId}
              row={row}
              plans={plans}
              locale={locale}
              t={t}
            />
          ))}
        </Section>

        <Section
          title={t('webhookTitle')}
          hint={t('webhookHint')}
          empty={t('webhookEmpty')}
          count={events.length}
        >
          {events.map((row) => (
            <EventCard key={row.id} row={row} locale={locale} t={t} />
          ))}
        </Section>
      </Stack>
    </>
  );
}

function Section({
  title,
  hint,
  empty,
  count,
  children,
}: {
  title: string;
  hint: string;
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Stack gap="sm">
      <div>
        <Group gap="xs" align="center">
          <Text fw={600}>{title}</Text>
          {count ? (
            <Badge color="red" variant="light" size="sm">
              {count}
            </Badge>
          ) : null}
        </Group>
        <Text size="sm" c="dimmed">
          {hint}
        </Text>
      </div>
      {count ? <Stack gap="sm">{children}</Stack> : <EmptyState title={empty} />}
    </Stack>
  );
}

type PaymentsTranslator = Awaited<ReturnType<typeof getTranslations<'admin.payments'>>>;

function MismatchCard({
  row,
  plans,
  locale,
  t,
}: {
  row: MismatchIntentRow;
  plans: SubscriptionPlan[];
  locale: AppLocale;
  t: PaymentsTranslator;
}) {
  const rolePlans = plans.filter((p) => p.is_active && p.role === row.role);
  const diff =
    row.receivedAmount == null ? null : row.receivedAmount - row.expectedAmount;

  return (
    <Card>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4} style={{ minWidth: 0 }}>
          <Text fw={600} size="sm">
            {row.fullName}{' '}
            <Text span c="dimmed" fw={400}>
              · {row.role}
              {row.phone ? ` · ${row.phone}` : ''}
            </Text>
          </Text>
          <Text size="xs" c="dimmed">
            {t('paymentCode', { code: row.paymentCode })} ·{' '}
            {t('planLabel', { plan: planDurationLabel(row.months, locale) })}
          </Text>
          <Text size="sm">
            {t('needAmount', {
              expected: formatVnd(row.expectedAmount, locale),
              received:
                row.receivedAmount == null
                  ? '—'
                  : formatVnd(row.receivedAmount, locale),
            })}
            {diff ? (
              <Text span c={diff > 0 ? 'orange' : 'red'} fw={600}>
                {' '}
                ({diff > 0 ? '+' : ''}
                {formatVnd(diff, locale)})
              </Text>
            ) : null}
          </Text>
          <Text size="xs" c="dimmed">
            {formatDateTime(row.updatedAt, locale, {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </Text>
        </Stack>
        <MarkPaidButton profileId={row.profileId} plans={rolePlans} />
      </Group>
    </Card>
  );
}

function EventCard({
  row,
  locale,
  t,
}: {
  row: UnresolvedEventRow;
  locale: AppLocale;
  t: PaymentsTranslator;
}) {
  return (
    <Card>
      <Stack gap={4}>
        <Group gap="xs" wrap="wrap">
          <Badge size="sm" variant="light" color="gray">
            {row.source}
          </Badge>
          <Text size="sm" fw={600}>
            {row.paymentCode || t('noPaymentCode')}
          </Text>
          {row.transferAmount == null ? null : (
            <Text size="sm">{formatVnd(row.transferAmount, locale)}</Text>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          {row.note || t('unprocessed')} · {t('sepayId', { id: row.sepayId })} ·{' '}
          {formatDateTime(row.createdAt, locale, {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </Text>
      </Stack>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      p="md"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      {children}
    </Paper>
  );
}
