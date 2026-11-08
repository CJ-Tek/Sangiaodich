'use client';

import { useMemo, useState } from 'react';
import { Group, Paper, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radius } from '@/config/design-tokens';
import type { GuestBookingListItem } from '@/lib/engines/guest-bookings';
import { getBookingStatusLabel } from '@/lib/i18n/booking-status';
import { formatDay } from '@/lib/i18n/format';
import { useFormat } from '@/lib/i18n/use-format';
import { Link, useRouter } from '@/lib/i18n/navigation';
import { foldVn } from '@/lib/search/vn-fold';

type PayFilter = 'paid' | 'due' | 'owner' | 'sale';

function payKind(row: GuestBookingListItem): 'paid' | 'owner' | 'sale' {
  if (row.remaining <= 0) return 'paid';
  return row.remainderPayee === 'OWNER' ? 'owner' : 'sale';
}

function PaymentText({
  row,
  align = 'left',
}: {
  row: GuestBookingListItem;
  align?: 'left' | 'right';
}) {
  const t = useTranslations('guest.bookings');
  const { formatNumber } = useFormat();
  if (row.remaining <= 0) {
    return (
      <Text size="sm" c="vbnbGreen.6" ta={align}>
        {t('paidFull')}
      </Text>
    );
  }
  const amount = formatNumber(row.remaining);
  return (
    <Text size="sm" fw={500} c={colors.warningText} ta={align}>
      {row.remainderPayee === 'OWNER'
        ? t('remainingOwner', { amount })
        : t('remainingSale', { amount })}
    </Text>
  );
}

const STATUS_ORDER = [
  'PENDING',
  'AWAITING_OWNER',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
] as const;

export function GuestBookingsList({
  rows,
}: {
  rows: GuestBookingListItem[];
}) {
  const t = useTranslations('guest.bookings');
  const tStatus = useTranslations('bookingStatus');
  const router = useRouter();
  const { locale, formatNumber, formatDateRange } = useFormat();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [pay, setPay] = useState<string | null>(null);

  const statusOptions = useMemo(() => {
    const present = new Set(rows.map((r) => r.status));
    return STATUS_ORDER.filter((value) => present.has(value)).map((value) => ({
      value,
      label: getBookingStatusLabel(value, tStatus),
    }));
  }, [rows, tStatus]);

  const filtered = useMemo(() => {
    const q = foldVn(query.trim());
    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (pay === 'due' && r.remaining <= 0) return false;
      if (pay === 'paid' || pay === 'owner' || pay === 'sale') {
        if (payKind(r) !== pay) return false;
      }
      if (!q) return true;
      return foldVn(
        `${r.assetTitle} ${r.checkIn} ${r.checkOut} ${formatDay(r.checkIn, locale)} ${formatDay(r.checkOut, locale)}`
      ).includes(q);
    });
  }, [rows, query, status, pay, locale]);

  const filtersActive = Boolean(query.trim() || status || pay);

  return (
    <Stack gap="md">
      <Group gap="sm" align="flex-end" wrap="wrap">
        <TextInput
          label={t('searchLabel')}
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ flex: '1 1 100%', minWidth: 220 }}
          maw={{ xs: 420 }}
        />
        <Select
          label={t('filterStatus')}
          placeholder={t('filterStatusAll')}
          clearable
          value={status}
          onChange={setStatus}
          data={statusOptions}
          w={{ base: 'calc(50% - 6px)', xs: 200 }}
        />
        <Select
          label={t('filterPayment')}
          placeholder={t('filterPaymentAll')}
          clearable
          value={pay}
          onChange={setPay}
          data={[
            { value: 'paid', label: t('filterPaid') },
            { value: 'due', label: t('filterDue') },
            { value: 'owner', label: t('filterDueOwner') },
            { value: 'sale', label: t('filterDueSale') },
          ] satisfies { value: PayFilter; label: string }[]}
          w={{ base: 'calc(50% - 6px)', xs: 220 }}
        />
      </Group>
      {!filtered.length ? (
        <EmptyState
          title={filtersActive ? t('notFound') : t('emptyTitle')}
          description={filtersActive ? t('notFoundHint') : t('emptyDescription')}
          actionLabel={filtersActive ? undefined : t('emptyAction')}
          href={filtersActive ? undefined : '/me/explore'}
        />
      ) : (
        <>
          <Stack gap="xs" hiddenFrom="sm">
            {filtered.map((b) => (
              <Link
                key={b.id}
                href={`/me/bookings/${b.id}`}
                className="vbnb-booking-card"
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                  <div style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} truncate>
                      {b.assetTitle}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      {formatDateRange(b.checkIn, b.checkOut)}
                    </Text>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </Group>
                <Group justify="space-between" align="baseline" wrap="nowrap" gap="sm" mt={10}>
                  <Text size="sm" fw={600} className="vbnb-tabular-nums">
                    {formatNumber(b.listPrice)}
                  </Text>
                  <PaymentText row={b} align="right" />
                </Group>
              </Link>
            ))}
          </Stack>

          <Paper
            visibleFrom="sm"
            radius={radius.lg}
            style={{ border: `1px solid ${colors.border}` }}
          >
            <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
              <Table.Thead style={{ background: colors.surfaceMuted }}>
                <Table.Tr>
                  <Table.Th style={{ width: 48 }}>#</Table.Th>
                  <Table.Th>{t('colVilla')}</Table.Th>
                  <Table.Th>{t('colPrice')}</Table.Th>
                  <Table.Th>{t('colPayment')}</Table.Th>
                  <Table.Th>{t('colStatus')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((b, i) => (
                  <Table.Tr
                    key={b.id}
                    onClick={() => router.push(`/me/bookings/${b.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td>
                      <Text size="sm" fw={600} c="dimmed">
                        #{i + 1}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Link
                        href={`/me/bookings/${b.id}`}
                        className="vbnb-row-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {b.assetTitle}
                      </Link>
                      <Text size="xs" c="dimmed">
                        {formatDateRange(b.checkIn, b.checkOut)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600} className="vbnb-tabular-nums">
                        {formatNumber(b.listPrice)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <PaymentText row={b} />
                    </Table.Td>
                    <Table.Td>
                      <BookingStatusBadge status={b.status} />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </>
      )}
    </Stack>
  );
}
