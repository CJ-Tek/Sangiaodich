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
import {
  formatVnd,
  planDurationLabel,
  type SubscriptionPlan,
} from '@/lib/engines/subscription-plans';
import { APP_TIMEZONE } from '@/lib/dates';
import { colors, radius } from '@/config/design-tokens';

export default async function AdminPaymentsPage() {
  await requireRole(['ADMIN']);

  const [mismatches, events, plans] = await Promise.all([
    listMismatchIntents(),
    listUnresolvedEvents(),
    listAllPlans(),
  ]);

  return (
    <>
      <PageHeader
        title="Thanh toán cần xử lý"
        description="Tiền đã vào nhưng chưa tự kích hoạt được: lệch số tiền, thiếu mã CK, hoặc webhook lỗi. Xử lý bằng Mark paid sau khi đối soát sao kê."
      />
      <Stack gap="xl" maw={860}>
        <Section
          title="Lệch số tiền"
          hint="Intent đã nhận CK nhưng số tiền không khớp giá gói. Chuyển đúng số tiền với cùng mã vẫn tự kích hoạt được."
          empty="Không có giao dịch lệch tiền."
          count={mismatches.length}
        >
          {mismatches.map((row) => (
            <MismatchCard key={row.intentId} row={row} plans={plans} />
          ))}
        </Section>

        <Section
          title="Webhook chưa xử lý xong"
          hint="Mỗi lần SePay gửi lại, hệ thống sẽ tự thử lại các giao dịch này."
          empty="Tất cả webhook đã xử lý."
          count={events.length}
        >
          {events.map((row) => (
            <EventCard key={row.id} row={row} />
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

function MismatchCard({
  row,
  plans,
}: {
  row: MismatchIntentRow;
  plans: SubscriptionPlan[];
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
            Mã CK {row.paymentCode} · gói {planDurationLabel(row.months)}
          </Text>
          <Text size="sm">
            Cần {formatVnd(row.expectedAmount)} · nhận{' '}
            {row.receivedAmount == null
              ? '—'
              : formatVnd(row.receivedAmount)}
            {diff ? (
              <Text span c={diff > 0 ? 'orange' : 'red'} fw={600}>
                {' '}
                ({diff > 0 ? '+' : ''}
                {formatVnd(diff)})
              </Text>
            ) : null}
          </Text>
          <Text size="xs" c="dimmed">
            {formatDateTime(row.updatedAt)}
          </Text>
        </Stack>
        <MarkPaidButton profileId={row.profileId} plans={rolePlans} />
      </Group>
    </Card>
  );
}

function EventCard({ row }: { row: UnresolvedEventRow }) {
  return (
    <Card>
      <Stack gap={4}>
        <Group gap="xs" wrap="wrap">
          <Badge size="sm" variant="light" color="gray">
            {row.source}
          </Badge>
          <Text size="sm" fw={600}>
            {row.paymentCode || 'Không có mã CK'}
          </Text>
          {row.transferAmount == null ? null : (
            <Text size="sm">{formatVnd(row.transferAmount)}</Text>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          {row.note || 'Chưa xử lý'} · SePay #{row.sepayId} ·{' '}
          {formatDateTime(row.createdAt)}
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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: APP_TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
