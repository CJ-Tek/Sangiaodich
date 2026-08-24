'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Paper,
  Group,
  Stack,
  Text,
  Divider,
  TextInput,
  Button,
  Pagination,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
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

function ContactRow({
  label,
  name,
  phone,
  phoneLabel,
}: {
  label: string;
  name: string;
  phone: string;
  phoneLabel: string;
}) {
  return (
    <Group gap="sm" wrap="wrap" align="center">
      <Text size="sm" c="dimmed" w={72} style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <Text size="sm" style={{ minWidth: 100 }}>
        {name || '—'}
      </Text>
      <Text size="sm" c="dimmed" style={{ minWidth: 130 }}>
        {phone || 'Chưa có SĐT'}
      </Text>
      {phone ? (
        <Button
          size="compact-xs"
          variant="default"
          onClick={() => copyPhone(phoneLabel, phone)}
        >
          Copy SĐT
        </Button>
      ) : null}
    </Group>
  );
}

function copyPhone(label: string, phone: string) {
  void navigator.clipboard.writeText(phone);
  notifications.show({
    color: 'vbnbGreen',
    message: `Đã copy SĐT ${label}`,
    autoClose: 1600,
  });
}

const PAGE_SIZE = 10;

export function SaleBookingsList({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: SaleBookingListItem[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

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
        label="Tìm kiếm"
        placeholder="Mã CK VBNB…, tên villa, khách, SĐT..."
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        style={{ maxWidth: 420 }}
      />
      {!filtered.length ? (
        <EmptyState
          title={q ? 'Không tìm thấy booking' : emptyTitle}
          description={
            q
              ? 'Thử tên villa, tên khách, hoặc SĐT (0 hoặc 84) khác.'
              : emptyDescription
          }
          actionLabel={q ? undefined : 'Explore marketplace'}
          href={q ? undefined : '/sale/marketplace'}
        />
      ) : (
        <Stack gap="lg" pt={6}>
          {pageItems.map((b, i) => (
            <Paper
              key={b.id}
              p="lg"
              pt="xl"
              radius={radius.lg}
              style={{
                border: `1px solid ${colors.border}`,
                position: 'relative',
                overflow: 'visible',
              }}
            >
              <Badge
                variant="outline"
                color="gray"
                size="lg"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 16,
                  transform: 'translateY(-50%)',
                  background: colors.surface,
                  zIndex: 1,
                }}
              >
                #{(page - 1) * PAGE_SIZE + i + 1}
              </Badge>
              <Group
                justify="space-between"
                align="flex-start"
                mb="md"
                wrap="wrap"
              >
                <Stack gap={6}>
                  <Text fw={600}>{b.villaTitle}</Text>
                  <ContactRow
                    label="Khách"
                    name={b.guestName}
                    phone={b.guestPhone}
                    phoneLabel="khách"
                  />
                  <ContactRow
                    label="Chủ nhà"
                    name={b.ownerName}
                    phone={b.ownerPhone}
                    phoneLabel="chủ nhà"
                  />
                  <Text size="sm" mt={2}>
                    {b.check_in} → {b.check_out}
                  </Text>
                </Stack>
                <BookingStatusBadge status={b.status} />
              </Group>
              <Group gap="xl" mb="md">
                <div>
                  <Text size="xs" c="dimmed">
                    Giá bán
                  </Text>
                  <Text size="sm" fw={600}>
                    {b.list.toLocaleString('vi-VN')}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    Tiền lời
                  </Text>
                  <Text size="sm" fw={600} c="vbnbGreen.6">
                    {b.margin.toLocaleString('vi-VN')}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    Giá gốc
                  </Text>
                  <Text size="sm" c="dimmed">
                    {b.floor.toLocaleString('vi-VN')}
                  </Text>
                </div>
              </Group>
              <Divider mb="md" color={colors.border} />
              {b.status === 'CANCELLED' ? (
                <Text size="sm" c="dimmed">
                  Hoàn{' '}
                  {Number(b.refund_amount || 0).toLocaleString('vi-VN')}
                  {' · '}
                  giữ{' '}
                  {Number(b.refund_kept_amount || 0).toLocaleString('vi-VN')}
                  {b.refund_percent != null
                    ? ` (${Number(b.refund_percent)}%)`
                    : ''}
                  {b.cancel_reason === 'GOODWILL' ? ' · goodwill' : ''}
                  {b.cancellation_policy
                    ? ` · ${b.cancellation_policy}`
                    : ''}
                </Text>
              ) : (
                <Stack gap="md">
                  {[
                    'PENDING',
                    'AWAITING_OWNER',
                  ].includes(b.status) ? (
                    <GuestCollectedUpdate
                      bookingId={b.id}
                      listPrice={b.list}
                      amountCollected={Number(b.amountCollected || 0)}
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
                      amountCollected={Number(b.amountCollected || 0)}
                      payout={b.payout}
                    />
                  ) : null}
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
                  />
                </Stack>
              )}
            </Paper>
          ))}
          {totalPages > 1 ? (
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              color="vbnbGreen"
              mt="xs"
            />
          ) : null}
        </Stack>
      )}
    </Stack>
  );
}
