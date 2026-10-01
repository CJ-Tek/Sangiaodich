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
  Select,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLocale, useTranslations } from 'next-intl';
import { useFormat } from '@/lib/i18n/use-format';
import { colors, radius } from '@/config/design-tokens';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { BookingActions } from '@/components/sale/BookingActions';
import { GuestCollectedUpdate } from '@/components/sale/GuestCollectedUpdate';
import { OwnerPayoutCard } from '@/components/sale/OwnerPayoutCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { matchesSaleBookingSearch } from '@/lib/engines/booking-search';
import { guestRemaining } from '@/lib/engines/guest-balance';
import { minOwnerDepositToConfirm } from '@/lib/engines/pricing';
import { locationMatchesCity, vnCityOptions } from '@/lib/geo/vn-cities';
import type { OwnerPayoutInfo } from '@/lib/owner/payout-info';

export type SaleBookingListItem = {
  id: string;
  status: string;
  check_in: string;
  check_out: string;
  villaTitle: string;
  location: string | null;
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
  guestPaidOwner: number;
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

type OwnerTransfer = 'none' | 'half' | 'full';
type GuestPay = 'paid' | 'due';

function ownerTransfer(b: SaleBookingListItem): OwnerTransfer | 'partial' {
  const earn = Math.max(0, b.ownerEarn);
  const paid = Math.max(0, b.ownerPaid);
  if (earn > 0 && paid >= earn) return 'full';
  if (earn <= 0) return 'full';
  if (paid <= 0) return 'none';
  if (paid >= minOwnerDepositToConfirm(earn)) return 'half';
  return 'partial';
}

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
  const locale = useLocale();
  const { formatNumber } = useFormat();
  const cityOptions = vnCityOptions(locale);
  const [query, setQuery] = useState('');
  const [owner, setOwner] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<string | null>(null);
  const [guestPay, setGuestPay] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const ownerOptions = useMemo(() => {
    const names = new Set(
      items.map((b) => b.ownerName).filter((name) => name && name !== '—')
    );
    return [...names].sort().map((value) => ({ value, label: value }));
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((b) => {
        if (
          !matchesSaleBookingSearch(query, {
            villaTitle: b.villaTitle,
            guestName: b.guestName,
            guestPhone: b.guestPhone,
            bookingId: b.id,
          })
        ) {
          return false;
        }
        if (owner && b.ownerName !== owner) return false;
        if (city && !locationMatchesCity(b.location, city)) return false;
        if (transfer && ownerTransfer(b) !== transfer) return false;
        if (guestPay) {
          const due =
            guestRemaining(b.list, b.amountCollected || 0, b.guestPaidOwner) > 0;
          if (guestPay === 'due' && !due) return false;
          if (guestPay === 'paid' && due) return false;
        }
        return true;
      }),
    [items, query, owner, city, transfer, guestPay]
  );

  const q = query.trim();
  const filtersActive = Boolean(q || owner || city || transfer || guestPay);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, owner, city, transfer, guestPay, items]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

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
          label={t('filterOwner')}
          placeholder={t('filterOwnerAll')}
          clearable
          searchable
          value={owner}
          onChange={setOwner}
          data={ownerOptions}
          w={180}
        />
        <Select
          label={t('filterCity')}
          placeholder={t('filterCityAll')}
          clearable
          searchable
          value={city}
          onChange={setCity}
          data={cityOptions}
          w={200}
        />
        <Select
          label={t('filterTransfer')}
          placeholder={t('filterTransferAll')}
          clearable
          value={transfer}
          onChange={setTransfer}
          data={[
            { value: 'none', label: t('filterTransferNone') },
            { value: 'half', label: t('filterTransferHalf') },
            { value: 'full', label: t('filterTransferFull') },
          ] satisfies { value: OwnerTransfer; label: string }[]}
          w={180}
        />
        <Select
          label={t('filterGuestPay')}
          placeholder={t('filterGuestPayAll')}
          clearable
          value={guestPay}
          onChange={setGuestPay}
          data={[
            { value: 'paid', label: t('filterGuestPaid') },
            { value: 'due', label: t('filterGuestDue') },
          ] satisfies { value: GuestPay; label: string }[]}
          w={180}
        />
      </Group>
      {!filtered.length ? (
        <EmptyState
          title={filtersActive ? t('notFound') : emptyTitle}
          description={filtersActive ? t('notFoundHint') : emptyDescription}
          actionLabel={filtersActive ? undefined : t('exploreMarketplace')}
          href={filtersActive ? undefined : '/sale/marketplace'}
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
                  <Table.Th>{t('colGuestPaid')}</Table.Th>
                  <Table.Th>{t('margin')}</Table.Th>
                  <Table.Th style={{ whiteSpace: 'nowrap', width: 'max-content' }}>
                    {t('colStatus')}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pageItems.map((b, i) => {
                  const open = openId === b.id;
                  const order = (page - 1) * PAGE_SIZE + i + 1;
                  const guestPaid =
                    (b.amountCollected || 0) + (b.guestPaidOwner || 0);
                  const guestDue = guestRemaining(
                    b.list,
                    b.amountCollected || 0,
                    b.guestPaidOwner || 0
                  );
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
                          <Text
                            size="sm"
                            fw={600}
                            c={guestDue > 0 ? undefined : 'vbnbGreen.6'}
                          >
                            {formatNumber(guestPaid)}
                          </Text>
                          <Text size="xs" c={guestDue > 0 ? 'red' : 'dimmed'}>
                            {guestDue > 0
                              ? t('guestDueLine', { amount: formatNumber(guestDue) })
                              : t('filterGuestPaid')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600} c="vbnbGreen.6">
                            {formatNumber(b.margin)}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ whiteSpace: 'nowrap', width: 'max-content' }}>
                          <BookingStatusBadge status={b.status} />
                        </Table.Td>
                      </Table.Tr>
                      {open ? (
                        <Table.Tr>
                          <Table.Td
                            colSpan={8}
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
                                      t('copiedPhone', { label: t('guestLabel') })
                                    )
                                  }
                                >
                                  {t('copyGuestPhone')}
                                </Button>
                                <Button
                                  size="compact-xs"
                                  variant="default"
                                  disabled={!b.ownerPhone}
                                  onClick={() =>
                                    copyPhone(
                                      b.ownerPhone,
                                      t('copiedPhone', { label: t('ownerLabel') })
                                    )
                                  }
                                >
                                  {t('copyOwnerPhone')}
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
