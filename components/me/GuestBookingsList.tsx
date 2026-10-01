'use client';

import { useMemo, useState } from 'react';
import { Group, Paper, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radius } from '@/config/design-tokens';
import type { GuestBookingListItem } from '@/lib/engines/guest-bookings';
import { getBookingStatusLabel } from '@/lib/i18n/booking-status';
import { useFormat } from '@/lib/i18n/use-format';
import { useRouter } from '@/lib/i18n/navigation';
import { foldVn } from '@/lib/search/vn-fold';

type PayFilter = 'paid' | 'due' | 'owner' | 'sale';

function payKind(row: GuestBookingListItem): 'paid' | 'owner' | 'sale' {
  if (row.remaining <= 0) return 'paid';
  return row.remainderPayee === 'OWNER' ? 'owner' : 'sale';
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
  const { formatNumber } = useFormat();
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
      return foldVn(`${r.assetTitle} ${r.checkIn} ${r.checkOut}`).includes(q);
    });
  }, [rows, query, status, pay]);

  const filtersActive = Boolean(query.trim() || status || pay);

  return (
    <Stack gap="md">
      <Group gap="sm" align="flex-end" wrap="wrap">
        <TextInput
          label={t('searchLabel')}
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <Select
          label={t('filterStatus')}
          placeholder={t('filterStatusAll')}
          clearable
          value={status}
          onChange={setStatus}
          data={statusOptions}
          w={200}
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
          w={220}
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
        <Paper radius={radius.lg} style={{ border: `1px solid ${colors.border}` }}>
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
                    <Text size="sm" fw={600}>
                      {b.assetTitle}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {b.checkIn} → {b.checkOut}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {formatNumber(b.listPrice)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={b.remaining > 0 ? 'red' : 'vbnbGreen.6'}>
                      {b.remaining > 0
                        ? b.remainderPayee === 'OWNER'
                          ? t('remainingOwner', {
                              amount: formatNumber(b.remaining),
                            })
                          : t('remainingSale', {
                              amount: formatNumber(b.remaining),
                            })
                        : t('paidFull')}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <BookingStatusBadge status={b.status} />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
