import { getLocale, getTranslations } from 'next-intl/server';
import { pageTitle } from '@/lib/seo/page-title';
import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { MarkPaidButton } from '@/components/admin/MarkPaidButton';
import { requireRole } from '@/lib/auth/session';
import {
  listMismatchIntents,
  listUnresolvedEvents,
  type MismatchIntentRow,
  type UnresolvedEventRow,
} from '@/lib/engines/admin-payment-ops';
import { listAllPlans } from '@/lib/engines/subscription-payment';
import {
  formatDateTime,
  formatDay,
  formatVnd,
  planDurationLabel,
} from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';
import type { SubscriptionPlan } from '@/lib/engines/subscription-plans';
import { colors, radius } from '@/config/design-tokens';

export const generateMetadata = pageTitle('admin.payments');

export default async function AdminPaymentsPage() {
  await requireRole(['ADMIN']);
  const t = await getTranslations('admin.payments');
  const tRoles = await getTranslations('common.roles');
  const locale = (await getLocale()) as AppLocale;

  const [mismatches, events, plans] = await Promise.all([
    listMismatchIntents(),
    listUnresolvedEvents(),
    listAllPlans(),
  ]);

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <Stack gap="xl">
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
              roleLabel={tRoles(row.role)}
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
          <SectionTitle>{title}</SectionTitle>
          {count ? (
            <Badge color="red" variant="light">
              {count}
            </Badge>
          ) : null}
        </Group>
        <Text size="sm" c="dimmed" mt={4}>
          {hint}
        </Text>
      </div>
      {count ? (
        <Stack gap="sm">{children}</Stack>
      ) : (
        <Card>
          <Text size="sm" c="dimmed">
            {empty}
          </Text>
        </Card>
      )}
    </Stack>
  );
}

type PaymentsTranslator = Awaited<ReturnType<typeof getTranslations<'admin.payments'>>>;

function MismatchCard({
  row,
  roleLabel,
  plans,
  locale,
  t,
}: {
  row: MismatchIntentRow;
  roleLabel: string;
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
              · {roleLabel}
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
            {formatDay(row.updatedAt, locale)}{' '}
            {formatDateTime(row.updatedAt, locale, { timeStyle: 'short' })}
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
          <Text size="sm" fw={600}>
            {row.paymentCode || t('noPaymentCode')}
          </Text>
          {row.transferAmount == null ? null : (
            <Text size="sm" className="vbnb-tabular-nums">
              {formatVnd(row.transferAmount, locale)}
            </Text>
          )}
          <Badge variant="light" color="gray">
            {t.has(`sources.${row.source}`)
              ? t(`sources.${row.source}`)
              : row.source}
          </Badge>
        </Group>
        <Text size="sm" c="dimmed">
          {row.note
            ? t.has(`notes.${row.note}`)
              ? t(`notes.${row.note}`)
              : row.note
            : t('unprocessed')}
        </Text>
        <Text size="xs" c="dimmed">
          {t('sepayId', { id: row.sepayId })} ·{' '}
          {formatDay(row.createdAt, locale)}{' '}
          {formatDateTime(row.createdAt, locale, { timeStyle: 'short' })}
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
