'use client';

import { Fragment, useMemo, useState } from 'react';
import {
  Stack,
  Text,
  Group,
  Avatar,
  TextInput,
  Badge,
  SegmentedControl,
  Code,
  Button,
  Table,
  Paper,
  Select,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLocale, useTranslations } from 'next-intl';
import { colors, radius } from '@/config/design-tokens';
import { useFormat } from '@/lib/i18n/use-format';
import { minOwnerDepositToConfirm } from '@/lib/engines/pricing';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { locationMatchesCity, vnCityOptions } from '@/lib/geo/vn-cities';
import { getBookingStatusLabel } from '@/lib/i18n/booking-status';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  matchesOwnerSettlementSearch,
  ownerTransferMemo,
} from '@/lib/engines/booking-search';
import {
  ownerPayoutStatus,
  type OwnerPayoutInfo,
} from '@/lib/owner/payout-info';
import {
  saleOwnerPayoutSatisfied,
  isGuestDepositCase,
} from '@/lib/engines/guest-balance';
import { OwnerStayActions } from '@/components/owner/OwnerStayActions';
import { OwnerSaleRatingForm } from '@/components/owner/OwnerSaleRatingForm';
import { SalePublicRatingCard } from '@/components/owner/SalePublicRatingCard';
import type {
  SaleRatingAggregate,
  SaleRatingComment,
  SaleRatingRecord,
} from '@/lib/engines/sale-ratings';

export type OwnerSettlementRow = {
  id: string;
  status: string;
  check_in: string;
  check_out: string;
  villaTitle: string;
  location: string | null;
  saleName: string;
  saleAvatarUrl: string | null;
  salePhone: string | null;
  tierLabel: string;
  ownerEarn: number;
  ownerPaid: number;
  ownerPaidAt?: string | null;
  listPrice: number;
  amountCollected: number;
  guestPaidOwner: number;
  rating: SaleRatingRecord | null;
  saleId: string;
  ratingAggregate: SaleRatingAggregate | null;
  ratingComments: SaleRatingComment[];
};

type PayoutFilter = 'all' | 'none' | 'partial' | 'full';

const BOOKING_STATUSES = ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] as const;

/** Sale has paid the 50% owner deposit and has not paid the full earn. */
function saleTransferredHalf(r: OwnerSettlementRow): boolean {
  const earn = Math.max(0, Number(r.ownerEarn) || 0);
  const paid = Math.max(0, Number(r.ownerPaid) || 0);
  if (earn <= 0 || paid >= earn) return false;
  return paid >= minOwnerDepositToConfirm(earn);
}

function payoutGroup(r: OwnerSettlementRow): Exclude<PayoutFilter, 'all'> {
  if (saleTransferredHalf(r)) return 'partial';
  const earn = Math.max(0, Number(r.ownerEarn) || 0);
  const paid = Math.max(0, Number(r.ownerPaid) || 0);
  if (earn > 0 && paid >= earn) return 'full';
  if (earn <= 0 && paid > 0) return 'full';
  return 'none';
}

function saleDutyStatus(r: OwnerSettlementRow): Exclude<PayoutFilter, 'all'> {
  if (
    saleOwnerPayoutSatisfied({
      listPrice: r.listPrice,
      amountCollected: r.amountCollected,
      ownerEarn: r.ownerEarn,
      ownerPaid: r.ownerPaid,
    })
  ) {
    return 'full';
  }
  return ownerPayoutStatus({
    ownerEarn: r.ownerEarn,
    ownerPaid: r.ownerPaid,
  });
}

export function OwnerSettlementsList({
  rows,
  payout,
}: {
  rows: OwnerSettlementRow[];
  payout: OwnerPayoutInfo;
}) {
  const t = useTranslations('owner.settlements');
  const tStatus = useTranslations('bookingStatus');
  const locale = useLocale();
  const { formatNumber, formatDateTime } = useFormat();
  const cityOptions = vnCityOptions(locale);

  const PAYOUT_BADGE = {
    none: { label: t('notPaid'), color: 'red' as const },
    partial: { label: t('partial'), color: 'yellow' as const },
    full: { label: t('paidFull'), color: 'vbnbGreen' as const },
  };

  const [query, setQuery] = useState('');
  const [payoutFilter, setPayoutFilter] = useState<PayoutFilter>('all');
  const [status, setStatus] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [sale, setSale] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const saleOptions = useMemo(() => {
    const names = new Map<string, string>();
    for (const r of rows) {
      if (!r.saleId) continue;
      names.set(r.saleId, r.saleName || t('saleUnknown'));
    }
    return [...names.entries()].map(([value, label]) => ({ value, label }));
  }, [rows, t]);

  const narrowed = useMemo(() => {
    return rows.filter((r) => {
      if (
        !matchesOwnerSettlementSearch(query, {
          villaTitle: r.villaTitle,
          saleName: r.saleName,
          salePhone: r.salePhone,
          bookingId: r.id,
        })
      ) {
        return false;
      }
      if (status && r.status !== status) return false;
      if (city && !locationMatchesCity(r.location, city)) return false;
      if (sale && r.saleId !== sale) return false;
      return true;
    });
  }, [rows, query, status, city, sale]);

  const filtered = useMemo(() => {
    if (payoutFilter === 'all') return narrowed;
    return narrowed.filter((r) => payoutGroup(r) === payoutFilter);
  }, [narrowed, payoutFilter]);

  const counts = useMemo(() => {
    const c = { all: narrowed.length, none: 0, partial: 0, full: 0 };
    for (const r of narrowed) {
      c[payoutGroup(r)] += 1;
    }
    return c;
  }, [narrowed]);

  const q = query.trim();
  const filtersActive = Boolean(q || status || city || sale || payoutFilter !== 'all');

  return (
    <Stack gap="md">
      <SegmentedControl
        value={payoutFilter}
        onChange={(v) => setPayoutFilter(v as PayoutFilter)}
        data={[
          { label: t('filterAll', { count: counts.all }), value: 'all' },
          { label: t('filterNone', { count: counts.none }), value: 'none' },
          { label: t('filterPartial', { count: counts.partial }), value: 'partial' },
          { label: t('filterFull', { count: counts.full }), value: 'full' },
        ]}
        color="vbnbGreen"
        fullWidth
      />
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
          data={BOOKING_STATUSES.map((value) => ({
            value,
            label: getBookingStatusLabel(value, tStatus),
          }))}
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
          label={t('filterSale')}
          placeholder={t('filterSaleAll')}
          clearable
          value={sale}
          onChange={setSale}
          data={saleOptions}
          w={180}
        />
      </Group>
      {!filtered.length ? (
        <EmptyState
          title={
            q || filtersActive
              ? t('notFound')
              : t('emptyTitle')
          }
          description={
            q
              ? t('notFoundHint')
              : filtersActive
                ? t('emptyFilter')
                : t('emptyDesc')
          }
          actionLabel={filtersActive ? undefined : t('viewAssets')}
          href={filtersActive ? undefined : '/owner/assets'}
        />
      ) : (
        <Paper radius={radius.lg} style={{ border: `1px solid ${colors.border}` }}>
          <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
            <Table.Thead style={{ background: colors.surfaceMuted }}>
              <Table.Tr>
                <Table.Th style={{ width: 48 }}>{t('colOrder')}</Table.Th>
                <Table.Th>{t('colVilla')}</Table.Th>
                <Table.Th>{t('colSale')}</Table.Th>
                <Table.Th>{t('colPaid')}</Table.Th>
                <Table.Th>{t('colDue')}</Table.Th>
                <Table.Th>{t('colStatus')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((b, i) => {
                const payoutStatus = saleDutyStatus(b);
                const payoutMeta = PAYOUT_BADGE[payoutStatus];
                const remaining = Math.max(0, b.ownerEarn - b.ownerPaid);
                const caseA = isGuestDepositCase(b.listPrice, b.amountCollected);
                const saleDone = saleOwnerPayoutSatisfied({
                  listPrice: b.listPrice,
                  amountCollected: b.amountCollected,
                  ownerEarn: b.ownerEarn,
                  ownerPaid: b.ownerPaid,
                });
                const memo = ownerTransferMemo(b.id);
                const open = openId === b.id;

                return (
                  <Fragment key={b.id}>
                    <Table.Tr
                      onClick={() => setOpenId(open ? null : b.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Td>
                        <Text size="sm" fw={600} c="dimmed">
                          #{i + 1}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {b.villaTitle || t('assetFallback')}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {b.check_in} → {b.check_out}
                          {b.location ? ` · ${b.location}` : ''}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Avatar
                            src={b.saleAvatarUrl || undefined}
                            size={24}
                            radius="xl"
                            color="vbnbGreen"
                          >
                            {(b.saleName || '?').slice(0, 1).toUpperCase()}
                          </Avatar>
                          <Text size="sm">{b.saleName || t('saleUnknown')}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {formatNumber(b.ownerPaid)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          / {formatNumber(b.ownerEarn)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          size="sm"
                          c={
                            saleDone
                              ? 'vbnbGreen.6'
                              : remaining > 0
                                ? 'red'
                                : 'vbnbGreen.6'
                          }
                        >
                        {caseA && saleDone ? '50%' : formatNumber(remaining)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6} wrap="wrap">
                          <Badge color={payoutMeta.color} variant="light">
                            {payoutMeta.label}
                          </Badge>
                          <BookingStatusBadge status={b.status} />
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                    {open ? (
                      <Table.Tr>
                        <Table.Td
                          colSpan={6}
                          style={{ background: colors.surfaceMuted }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Group gap="xs" align="center">
                            <Text size="xs" c="dimmed">
                              {t('memo')}
                            </Text>
                            <Code>{memo}</Code>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              color="vbnbGreen"
                              onClick={() => {
                                void navigator.clipboard.writeText(memo);
                                notifications.show({
                                  color: 'vbnbGreen',
                                  message: t('copiedMemo'),
                                  autoClose: 1400,
                                });
                              }}
                            >
                              {t('copy')}
                            </Button>
                          </Group>
                          <Text size="xs" c="dimmed" mt="sm">
                            {b.tierLabel}
                            {b.salePhone ? ` · ${b.salePhone}` : ''}
                          </Text>
                          {caseA && saleDone ? (
                            <Text size="sm" mt="xs">
                              {t('doneGuestPays')}
                            </Text>
                          ) : null}
                          <SalePublicRatingCard
                            aggregate={b.ratingAggregate}
                            comments={b.ratingComments}
                          />
                          {b.ownerPaidAt ? (
                            <Text size="xs" c="dimmed" mt="sm">
                              {t('saleRecordedAt')} {formatDateTime(b.ownerPaidAt)}
                            </Text>
                          ) : null}
                          <Stack gap="sm" mt="md">
                            <OwnerStayActions
                              bookingId={b.id}
                              status={b.status}
                              listPrice={b.listPrice}
                              amountCollected={b.amountCollected}
                              guestPaidOwner={b.guestPaidOwner}
                              payout={payout}
                            />
                            {b.status === 'CHECKED_OUT' ? (
                              <OwnerSaleRatingForm
                                bookingId={b.id}
                                rating={b.rating}
                              />
                            ) : null}
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
      )}
    </Stack>
  );
}
