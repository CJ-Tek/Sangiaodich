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

function ContactRow({
  label,
  name,
  phone,
  phoneLabel,
  noPhoneLabel,
  copyPhoneLabel,
  copiedMessage,
}: {
  label: string;
  name: string;
  phone: string;
  phoneLabel: string;
  noPhoneLabel: string;
  copyPhoneLabel: string;
  copiedMessage: string;
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
        {phone || noPhoneLabel}
      </Text>
      {phone ? (
        <Button
          size="compact-xs"
          variant="default"
          onClick={() => copyPhone(phoneLabel, phone, copiedMessage)}
        >
          {copyPhoneLabel}
        </Button>
      ) : null}
    </Group>
  );
}

function copyPhone(label: string, phone: string, copiedMessage: string) {
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
                    label={t('guestLabel')}
                    name={b.guestName}
                    phone={b.guestPhone}
                    phoneLabel="khách"
                    noPhoneLabel={t('noPhone')}
                    copyPhoneLabel={t('copyPhone')}
                    copiedMessage={t('copiedPhone', { label: 'khách' })}
                  />
                  <ContactRow
                    label={t('ownerLabel')}
                    name={b.ownerName}
                    phone={b.ownerPhone}
                    phoneLabel="chủ nhà"
                    noPhoneLabel={t('noPhone')}
                    copyPhoneLabel={t('copyPhone')}
                    copiedMessage={t('copiedPhone', { label: 'chủ nhà' })}
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
                    {t('listPrice')}
                  </Text>
                  <Text size="sm" fw={600}>
                    {formatNumber(b.list)}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('margin')}
                  </Text>
                  <Text size="sm" fw={600} c="vbnbGreen.6">
                    {formatNumber(b.margin)}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('floor')}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {formatNumber(b.floor)}
                  </Text>
                </div>
              </Group>
              <Divider mb="md" color={colors.border} />
              {b.status === 'CANCELLED' ? (
                <Text size="sm" c="dimmed">
                  {t('refundLine', {
                    refund: formatNumber(Number(b.refund_amount || 0)),
                    kept: formatNumber(Number(b.refund_kept_amount || 0)),
                    percent: Number(b.refund_percent ?? 0),
                  })}
                  {b.cancel_reason === 'GOODWILL' ? t('refundGoodwill') : ''}
                  {b.cancellation_policy
                    ? ` · ${b.cancellation_policy}`
                    : ''}
                </Text>
              ) : (
                <Stack gap="md">
                  {simpleUi ? null : (
                    <>
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
