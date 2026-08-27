'use client';

import { useMemo, useState } from 'react';
import {
  Paper,
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
import { colors, radius } from '@/config/design-tokens';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
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

function formatVnd(n: number) {
  return n.toLocaleString('vi-VN');
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

const PAYOUT_BADGE = {
  none: { label: 'Chưa CK', color: 'red' as const },
  partial: { label: 'CK một phần', color: 'yellow' as const },
  full: { label: 'Đã đủ CK', color: 'vbnbGreen' as const },
};

export function OwnerSettlementsList({
  rows,
  payout,
}: {
  rows: OwnerSettlementRow[];
  payout: OwnerPayoutInfo;
}) {
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
          { label: `Tất cả (${counts.all})`, value: 'all' },
          { label: `Chưa (${counts.none})`, value: 'none' },
          { label: `Một phần (${counts.partial})`, value: 'partial' },
          { label: `Đủ (${counts.full})`, value: 'full' },
        ]}
        color="vbnbGreen"
        fullWidth
      />
      <TextInput
        label="Tìm kiếm"
        placeholder="Mã CK VBNB…, tên sale, SĐT, villa..."
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        style={{ maxWidth: 420 }}
      />
      {!filtered.length ? (
        <EmptyState
          title={
            q || payoutFilter !== 'all'
              ? 'Không tìm thấy settlement'
              : 'Chưa có booking đã chốt'
          }
          description={
            q
              ? 'Thử mã CK (VBNB…), tên sale, SĐT (0 hoặc 84), hoặc tên villa.'
              : payoutFilter !== 'all'
                ? 'Không có booking trong nhóm CK này.'
                : 'Khi bạn xác nhận booking trên Chờ xác nhận, giao dịch sẽ hiện tại đây.'
          }
          actionLabel={q || payoutFilter !== 'all' ? undefined : 'Xem assets'}
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
              <Paper
                key={b.id}
                p="lg"
                radius={radius.lg}
                style={{ border: `1px solid ${colors.border}` }}
              >
                <Group
                  justify="space-between"
                  align="flex-start"
                  wrap="wrap"
                  mb="md"
                >
                  <div>
                    <Text fw={600}>{b.villaTitle || 'Asset'}</Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      {b.check_in} → {b.check_out}
                      {b.location ? ` · ${b.location}` : ''}
                    </Text>
                    <Group gap="xs" mt={6} align="center">
                      <Text size="xs" c="dimmed">
                        Mã CK
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
                            message: 'Đã copy mã CK',
                            autoClose: 1400,
                          });
                        }}
                      >
                        Copy
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
                            {b.saleName || 'Sale không xác định'}
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
                      Sale cần gửi bạn
                    </Text>
                    <Text size="sm" fw={600} c="vbnbGreen.6">
                      {formatVnd(b.ownerEarn)}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Sale đã CK
                    </Text>
                    <Text size="sm" fw={500}>
                      {formatVnd(b.ownerPaid)}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      {caseA && saleDone ? 'Sale (50% cost)' : 'Còn thiếu'}
                    </Text>
                    <Text
                      size="sm"
                      fw={500}
                      c={saleDone ? 'vbnbGreen.6' : remaining > 0 ? 'red' : 'vbnbGreen.6'}
                    >
                      {caseA && saleDone
                        ? 'Đã xong — khách CK nốt lúc CI'
                        : formatVnd(remaining)}
                    </Text>
                  </div>
                </SimpleGrid>
                {b.ownerPaidAt ? (
                  <Text size="xs" c="dimmed" mt="sm">
                    Sale ghi nhận CK:{' '}
                    {new Date(b.ownerPaidAt).toLocaleString('vi-VN')}
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
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
