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
import { ownerPayoutStatus } from '@/lib/owner/payout-info';

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
};

type PayoutFilter = 'all' | 'none' | 'partial' | 'full';

function formatVnd(n: number) {
  return n.toLocaleString('vi-VN');
}

const PAYOUT_BADGE = {
  none: { label: 'Chưa CK', color: 'red' as const },
  partial: { label: 'CK một phần', color: 'yellow' as const },
  full: { label: 'Đã đủ CK', color: 'vbnbGreen' as const },
};

export function OwnerSettlementsList({ rows }: { rows: OwnerSettlementRow[] }) {
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
      return (
        ownerPayoutStatus({
          ownerEarn: r.ownerEarn,
          ownerPaid: r.ownerPaid,
        }) === payoutFilter
      );
    });
  }, [rows, query, payoutFilter]);

  const counts = useMemo(() => {
    const c = { all: rows.length, none: 0, partial: 0, full: 0 };
    for (const r of rows) {
      c[ownerPayoutStatus({ ownerEarn: r.ownerEarn, ownerPaid: r.ownerPaid })] +=
        1;
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
                : 'Khi sale confirm booking trên villa của bạn, giao dịch sẽ hiện tại đây.'
          }
          actionLabel={q || payoutFilter !== 'all' ? undefined : 'Xem assets'}
          href={q || payoutFilter !== 'all' ? undefined : '/owner/assets'}
        />
      ) : (
        <Stack gap="sm">
          {filtered.map((b) => {
            const payoutStatus = ownerPayoutStatus({
              ownerEarn: b.ownerEarn,
              ownerPaid: b.ownerPaid,
            });
            const payoutMeta = PAYOUT_BADGE[payoutStatus];
            const remaining = Math.max(0, b.ownerEarn - b.ownerPaid);
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
                        <Text size="sm" fw={500}>
                          {b.saleName || 'Sale không xác định'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Tier {b.tierLabel}
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
                      Còn thiếu
                    </Text>
                    <Text
                      size="sm"
                      fw={500}
                      c={remaining > 0 ? 'red' : 'vbnbGreen.6'}
                    >
                      {formatVnd(remaining)}
                    </Text>
                  </div>
                </SimpleGrid>
                {b.ownerPaidAt ? (
                  <Text size="xs" c="dimmed" mt="sm">
                    Sale ghi nhận CK:{' '}
                    {new Date(b.ownerPaidAt).toLocaleString('vi-VN')}
                  </Text>
                ) : null}
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
