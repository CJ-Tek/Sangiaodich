'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Paper,
  Group,
  Stack,
  Text,
  TextInput,
  Button,
  Pagination,
  Table,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useFormat } from '@/lib/i18n/use-format';
import { colors, radius } from '@/config/design-tokens';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { BookingActions } from '@/components/sale/BookingActions';
import { GuestCollectedUpdate } from '@/components/sale/GuestCollectedUpdate';
import { OwnerPayoutCard } from '@/components/sale/OwnerPayoutCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { matchesSaleBookingSearch } from '@/lib/engines/booking-search';
import type { OwnerPayoutInfo } from '@/lib/owner/payout-info';

export type SaleBookingListItem = {
  id: string;
  status: string;
  check_in: string;
  check_out: string;
  villaTitle: string;
  guestName: string;
  guestPhone: string;
  ownerName: string;
  ownerPhone: string;
  list: number;
  margin: number;
  floor: number;
  ownerEarn: number;
  ownerPaid: number;
  amountCollected: number | null;
  refund_amount: number | null;
  refund_kept_amount: number | null;
  refund_percent: number | null;
  cancellation_policy: string | null;
  cancel_reason: string | null;
  showOwnerPayout: boolean;
  payout: OwnerPayoutInfo;
  salePayoutReady: boolean;
};

function copyPhone(phone: string, copiedMessage: string) {
  void navigator.clipboard.writeText(phone);
  notifications.show({
    color: 'vbnbGreen',
    message: copiedMessage,
    autoClose: 1600,
  });
}

const PAGE_SIZE = 10;

export function SaleBookingsList({
  items,
  emptyTitle,
  emptyDescription,
  simpleUi = false,
}: {
  items: SaleBookingListItem[];
  emptyTitle: string;
  emptyDescription: string;
  simpleUi?: boolean;
}) {
  const t = useTranslations('sale.bookings');
  const { formatNumber } = useFormat();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      items.filter((b) =>
        matchesSaleBookingSearch(query, {
          villaTitle: b.villaTitle,
          guestName: b.guestName,
          guestPhone: b.guestPhone,
          bookingId: b.id,
        })
      ),
    [items, query]
  );

  const q = query.trim();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, items]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <Stack gap="md">
      <TextInput
        label={t('searchLabel')}
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        style={{ maxWidth: 420 }}
      />
      {!filtered.length ? (
        <EmptyState
          title={q ? t('notFound') : emptyTitle}
          description={q ? t('notFoundHint') : emptyDescription}
          actionLabel={q ? undefined : t('exploreMarketplace')}
          href={q ? undefined : '/sale/marketplace'}
        />
      ) : (
        <>
          <Paper radius={radius.lg} style={{ border: `1px solid ${colors.border}` }}>
            <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
              <Table.Thead style={{ background: colors.surfaceMuted }}>
                <Table.Tr>
                  <Table.Th style={{ width: 48 }}>#</Table.Th>
                  <Table.Th>{t('colVilla')}</Table.Th>
                  <Table.Th>{t('guestLabel')}</Table.Th>
                  <Table.Th>{t('ownerLabel')}</Table.Th>
                  <Table.Th>{t('listPrice')}</Table.Th>
                  <Table.Th>{t('margin')}</Table.Th>
                  <Table.Th>{t('colStatus')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pageItems.map((b, i) => {
                  const open = openId === b.id;
                  const order = (page - 1) * PAGE_SIZE + i + 1;
                  return (
                    <Fragment key={b.id}>
                      <Table.Tr
                        onClick={() => setOpenId(open ? null : b.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Table.Td>
                          <Text size="sm" fw={600} c="dimmed">
                            #{order}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600}>
                            {b.villaTitle}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {b.check_in} → {b.check_out}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{b.guestName || '—'}</Text>
                          <Text size="xs" c="dimmed">
                            {b.guestPhone || t('noPhone')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{b.ownerName || '—'}</Text>
                          <Text size="xs" c="dimmed">
                            {b.ownerPhone || t('noPhone')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600}>
                            {formatNumber(b.list)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600} c="vbnbGreen.6">
                            {formatNumber(b.margin)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <BookingStatusBadge status={b.status} />
                        </Table.Td>
                      </Table.Tr>
                      {open ? (
                        <Table.Tr>
                          <Table.Td
                            colSpan={7}
                            style={{ background: colors.surfaceMuted }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Stack gap="sm">
                              <Group gap="md" wrap="wrap">
                                <Button
                                  size="compact-xs"
                                  variant="default"
                                  disabled={!b.guestPhone}
                                  onClick={() =>
                                    copyPhone(
                                      b.guestPhone,
                                      t('copiedPhone', { label: 'khách' })
                                    )
                                  }
                                >
                                  {t('copyPhone')}
                                </Button>
                                <Button
                                  size="compact-xs"
                                  variant="default"
                                  disabled={!b.ownerPhone}
                                  onClick={() =>
                                    copyPhone(
                                      b.ownerPhone,
                                      t('copiedPhone', { label: 'chủ nhà' })
                                    )
                                  }
                                >
                                  {t('copyPhone')}
                                </Button>
                                <Text size="sm" c="dimmed">
                                  {t('floor')} {formatNumber(b.floor)}
                                </Text>
                              </Group>
                              {b.status === 'CANCELLED' ? (
                                <Text size="sm" c="dimmed">
                                  {t('refundLine', {
                                    refund: formatNumber(Number(b.refund_amount || 0)),
                                    kept: formatNumber(Number(b.refund_kept_amount || 0)),
                                    percent: Number(b.refund_percent ?? 0),
                                  })}
                                  {b.cancel_reason === 'GOODWILL'
                                    ? t('refundGoodwill')
                                    : ''}
                                  {b.cancellation_policy
                                    ? ` · ${b.cancellation_policy}`
                                    : ''}
                                </Text>
                              ) : (
                                <>
                                  {simpleUi ? null : (
                                    <>
                                      {[
                                        'PENDING',
                                        'AWAITING_OWNER',
                                      ].includes(b.status) ? (
                                        <GuestCollectedUpdate
                                          bookingId={b.id}
                                          listPrice={b.list}
                                          amountCollected={Number(
                                            b.amountCollected || 0
                                          )}
                                        />
                                      ) : null}
                                      {b.showOwnerPayout ? (
                                        <OwnerPayoutCard
                                          bookingId={b.id}
                                          ownerName={b.ownerName}
                                          ownerPhone={b.ownerPhone}
                                          ownerEarn={b.ownerEarn}
                                          ownerPaid={b.ownerPaid}
                                          listPrice={b.list}
                                          amountCollected={Number(
                                            b.amountCollected || 0
                                          )}
                                          payout={b.payout}
                                        />
                                      ) : null}
                                    </>
                                  )}
                                  <BookingActions
                                    bookingId={b.id}
                                    status={b.status}
                                    listPrice={b.list}
                                    suggestedFloor={b.floor}
                                    checkIn={b.check_in}
                                    amountCollected={b.amountCollected}
                                    ownerEarn={b.ownerEarn}
                                    ownerPaid={b.ownerPaid}
                                    salePayoutReady={b.salePayoutReady}
                                    simpleUi={simpleUi}
                                  />
                                </>
                              )}
                            </Stack>
                          </Table.Td>
                        </Table.Tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Paper>
          {totalPages > 1 ? (
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              color="vbnbGreen"
            />
          ) : null}
        </>
      )}
    </Stack>
  );
}
