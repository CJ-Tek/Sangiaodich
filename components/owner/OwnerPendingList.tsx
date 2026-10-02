'use client';

import { Fragment, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Code,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLocale, useTranslations } from 'next-intl';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { OwnerBookingActions } from '@/components/owner/OwnerBookingActions';
import { SalePublicRatingCard } from '@/components/owner/SalePublicRatingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radius } from '@/config/design-tokens';
import {
  matchesOwnerSettlementSearch,
  ownerTransferMemo,
} from '@/lib/engines/booking-search';
import { rangesOverlap } from '@/lib/engines/inventory';
import { saleDepositToOwner } from '@/lib/engines/guest-balance';
import type {
  SaleRatingAggregate,
  SaleRatingComment,
} from '@/lib/engines/sale-ratings';
import { locationMatchesCity, vnCityOptions } from '@/lib/geo/vn-cities';
import { useFormat } from '@/lib/i18n/use-format';

export type OwnerPendingRow = {
  id: string;
  assetId: string;
  villaTitle: string;
  location: string | null;
  checkIn: string;
  checkOut: string;
  submittedAt: string | null;
  saleId: string;
  saleName: string;
  saleAvatarUrl: string | null;
  salePhone: string | null;
  tierLabel: string | null;
  ownerEarn: number;
  ownerPaid: number;
  listPrice: number;
  amountCollected: number;
  status: string;
  ratingAggregate: SaleRatingAggregate | null;
  ratingComments: SaleRatingComment[];
};

export function OwnerPendingList({
  rows,
  requireStkCheck,
}: {
  rows: OwnerPendingRow[];
  requireStkCheck: boolean;
}) {
  const t = useTranslations('owner.pending');
  const tf = useTranslations('owner.settlements');
  const locale = useLocale();
  const { formatNumber, formatDateTime } = useFormat();
  const cityOptions = vnCityOptions(locale);

  const [query, setQuery] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [sale, setSale] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const overlapIds = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of rows) {
      const overlaps: string[] = [];
      for (const b of rows) {
        if (a.id === b.id || a.assetId !== b.assetId) continue;
        if (
          rangesOverlap(
            { checkIn: a.checkIn, checkOut: a.checkOut },
            { checkIn: b.checkIn, checkOut: b.checkOut }
          )
        ) {
          overlaps.push(b.id);
        }
      }
      if (overlaps.length) map.set(a.id, overlaps);
    }
    return map;
  }, [rows]);

  const saleOptions = useMemo(() => {
    const names = new Map<string, string>();
    for (const r of rows) {
      if (!r.saleId) continue;
      names.set(r.saleId, r.saleName || tf('saleUnknown'));
    }
    return [...names.entries()].map(([value, label]) => ({ value, label }));
  }, [rows, tf]);

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
      if (city && !locationMatchesCity(r.location, city)) return false;
      if (sale && r.saleId !== sale) return false;
      return true;
    });
  }, [rows, query, city, sale]);

  const filtersActive = Boolean(query.trim() || city || sale);

  return (
    <Stack gap="md">
      <Group gap="sm" align="flex-end" wrap="wrap">
        <TextInput
          label={tf('searchLabel')}
          placeholder={tf('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <Select
          label={tf('filterCity')}
          placeholder={tf('filterCityAll')}
          clearable
          searchable
          value={city}
          onChange={setCity}
          data={cityOptions}
          w={200}
        />
        <Select
          label={tf('filterSale')}
          placeholder={tf('filterSaleAll')}
          clearable
          value={sale}
          onChange={setSale}
          data={saleOptions}
          w={180}
        />
      </Group>
      {!narrowed.length ? (
        <EmptyState
          title={filtersActive ? tf('notFound') : t('emptyTitle')}
          description={filtersActive ? tf('emptyFilter') : t('emptyDesc')}
          actionLabel={filtersActive ? undefined : t('viewSettlements')}
          href={filtersActive ? undefined : '/owner/bookings'}
        />
      ) : (
        <Paper radius={radius.lg} style={{ border: `1px solid ${colors.border}` }}>
          <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
            <Table.Thead style={{ background: colors.surfaceMuted }}>
              <Table.Tr>
                <Table.Th style={{ width: 48 }}>{tf('colOrder')}</Table.Th>
                <Table.Th>{tf('colVilla')}</Table.Th>
                <Table.Th>{tf('colSale')}</Table.Th>
                <Table.Th>{tf('colPaid')}</Table.Th>
                <Table.Th>{tf('colStatus')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {narrowed.map((b, i) => {
                const open = openId === b.id;
                const overlaps = overlapIds.get(b.id) || [];
                const half = saleDepositToOwner(
                  b.listPrice,
                  b.amountCollected,
                  b.ownerEarn
                );
                const memo = ownerTransferMemo(b.id);

                return (
                  <Fragment key={b.id}>
                    <Table.Tr
                      onClick={() => setOpenId(open ? null : b.id)}
                      style={{
                        cursor: 'pointer',
                        background: overlaps.length ? colors.warningSoft : undefined,
                      }}
                    >
                      <Table.Td>
                        <Text size="sm" fw={600} c="dimmed">
                          #{i + 1}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {b.villaTitle || t('asset')}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {b.checkIn} → {b.checkOut}
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
                          <Text size="sm">{b.saleName || tf('saleUnknown')}</Text>
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
                        <Group gap={6} wrap="wrap">
                          <BookingStatusBadge status={b.status} />
                          {overlaps.length ? (
                            <Badge color="yellow" variant="filled">
                              {t('overlap')}
                            </Badge>
                          ) : null}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                    {open ? (
                      <Table.Tr>
                        <Table.Td
                          colSpan={5}
                          style={{ background: colors.surfaceMuted }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {overlaps.length ? (
                            <Alert color="yellow" mb="md" title={t('overlapTitle')}>
                              {t('overlapDesc', {
                                ids: overlaps
                                  .map((id) => `#${id.slice(0, 8)}`)
                                  .join(', '),
                              })}
                            </Alert>
                          ) : null}
                          <Group gap="xs" align="center">
                            <Text size="xs" c="dimmed">
                              {tf('memo')}
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
                                  message: tf('copiedMemo'),
                                  autoClose: 1400,
                                });
                              }}
                            >
                              {tf('copy')}
                            </Button>
                          </Group>
                          <Group gap="xl" mt="sm">
                            <div>
                              <Text size="xs" c="dimmed">
                                {t('depositHint')}
                              </Text>
                              <Text size="sm" fw={600}>
                                {formatNumber(half)}
                              </Text>
                            </div>
                            <div>
                              <Text size="xs" c="dimmed">
                                {tf('colCost')}
                              </Text>
                              <Text size="sm" fw={600}>
                                {formatNumber(b.ownerEarn)}
                              </Text>
                            </div>
                          </Group>
                          <Text size="xs" c="dimmed" mt="sm">
                            {b.salePhone || '—'}
                            {b.tierLabel ? ` · ${b.tierLabel}` : ''}
                          </Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            {t('sentAt')}{' '}
                            {b.submittedAt ? formatDateTime(b.submittedAt) : '—'}
                          </Text>
                          <SalePublicRatingCard
                            aggregate={b.ratingAggregate}
                            comments={b.ratingComments}
                          />
                          <Stack gap="sm" mt="md">
                            <OwnerBookingActions
                              bookingId={b.id}
                              requireStkCheck={requireStkCheck}
                            />
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
