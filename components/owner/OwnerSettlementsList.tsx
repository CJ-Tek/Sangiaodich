'use client';

import { useMemo, useState } from 'react';
import {
  Stack,
  Text,
  Group,
  SimpleGrid,
  Avatar,
  TextInput,
  Badge,
  SegmentedControl,
  Code,
  Button,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useFormat } from '@/lib/i18n/use-format';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
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
  const { formatNumber, formatDateTime } = useFormat();

  const PAYOUT_BADGE = {
    none: { label: t('notPaid'), color: 'red' as const },
    partial: { label: t('partial'), color: 'yellow' as const },
    full: { label: t('paidFull'), color: 'vbnbGreen' as const },
  };

  const [query, setQuery] = useState('');
  const [payoutFilter, setPayoutFilter] = useState<PayoutFilter>('all');

  const filtered = useMemo(() => {
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
      if (payoutFilter === 'all') return true;
      return saleDutyStatus(r) === payoutFilter;
    });
  }, [rows, query, payoutFilter]);

  const counts = useMemo(() => {
    const c = { all: rows.length, none: 0, partial: 0, full: 0 };
    for (const r of rows) {
      c[saleDutyStatus(r)] += 1;
    }
    return c;
  }, [rows]);

  const q = query.trim();

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
      <TextInput
        label={t('searchLabel')}
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        style={{ maxWidth: 420 }}
      />
      {!filtered.length ? (
        <EmptyState
          title={
            q || payoutFilter !== 'all'
              ? t('notFound')
              : t('emptyTitle')
          }
          description={
            q
              ? t('notFoundHint')
              : payoutFilter !== 'all'
                ? t('emptyFilter')
                : t('emptyDesc')
          }
          actionLabel={q || payoutFilter !== 'all' ? undefined : t('viewAssets')}
          href={q || payoutFilter !== 'all' ? undefined : '/owner/assets'}
        />
      ) : (
        <Stack gap="sm">
          {filtered.map((b) => {
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

            return (
              <SurfaceCard key={b.id}>
                <Group
                  justify="space-between"
                  align="flex-start"
                  wrap="wrap"
                  mb="md"
                >
                  <div>
                    <Text fw={600}>{b.villaTitle || t('assetFallback')}</Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      {b.check_in} → {b.check_out}
                      {b.location ? ` · ${b.location}` : ''}
                    </Text>
                    <Group gap="xs" mt={6} align="center">
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
                    <Group gap="sm" mt={8} wrap="nowrap">
                      <Avatar
                        src={b.saleAvatarUrl || undefined}
                        size={28}
                        radius="xl"
                        color="vbnbGreen"
                      >
                        {(b.saleName || '?').slice(0, 1).toUpperCase()}
                      </Avatar>
                      <div>
                        <Group gap="xs" wrap="wrap" align="center">
                          <Text size="sm" fw={500}>
                            {b.saleName || t('saleUnknown')}
                          </Text>
                          <SalePublicRatingCard
                            aggregate={b.ratingAggregate}
                            comments={b.ratingComments}
                          />
                        </Group>
                        <Text size="xs" c="dimmed">
                          {b.tierLabel}
                          {b.salePhone ? ` · ${b.salePhone}` : ''}
                        </Text>
                      </div>
                    </Group>
                  </div>
                  <Group gap="xs">
                    <Badge color={payoutMeta.color} variant="light">
                      {payoutMeta.label}
                    </Badge>
                    <BookingStatusBadge status={b.status} />
                  </Group>
                </Group>

                <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
                  <div>
                    <Text size="xs" c="dimmed">
                      {t('saleNeedsSend')}
                    </Text>
                    <Text size="sm" fw={600} c="vbnbGreen.6">
                      {formatNumber(b.ownerEarn)}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      {t('salePaid')}
                    </Text>
                    <Text size="sm" fw={500}>
                      {formatNumber(b.ownerPaid)}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      {caseA && saleDone ? t('saleCostHalf') : t('remaining')}
                    </Text>
                    <Text
                      size="sm"
                      fw={500}
                      c={saleDone ? 'vbnbGreen.6' : remaining > 0 ? 'red' : 'vbnbGreen.6'}
                    >
                      {caseA && saleDone
                        ? t('doneGuestPays')
                        : formatNumber(remaining)}
                    </Text>
                  </div>
                </SimpleGrid>
                {b.ownerPaidAt ? (
                  <Text size="xs" c="dimmed" mt="sm">
                    {t('saleRecordedAt')}{' '}
                    {formatDateTime(b.ownerPaidAt)}
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
              </SurfaceCard>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
