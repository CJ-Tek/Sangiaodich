'use client';

import { Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useLocale, useTranslations } from 'next-intl';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { colors, radius } from '@/config/design-tokens';
import { formatCurrency, formatDateTime } from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';
import type { GuestBookingDetail } from '@/lib/engines/guest-bookings';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500} ta="right">
        {value}
      </Text>
    </Group>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      p="lg"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      {children}
    </Paper>
  );
}

export function GuestBookingDetailCard({
  booking,
}: {
  booking: GuestBookingDetail;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('guest.bookingDetail');
  const tTimeline = useTranslations('membership.guestTimeline');

  function money(n: number) {
    return formatCurrency(Number(n || 0), locale);
  }

  function moment(iso: string | null) {
    if (!iso) return null;
    return formatDateTime(iso, locale);
  }

  return (
    <Stack gap="md">
      <Card>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <Title order={4} fw={600}>
              {booking.assetTitle}
            </Title>
            <Text size="sm" c="dimmed" mt={4}>
              {booking.checkIn} → {booking.checkOut}
            </Text>
            {booking.assetSlug ? (
              <LinkAnchor
                href={`/a/${booking.assetSlug}`}
                size="sm"
                c="vbnbGreen.6"
                mt={6}
                display="inline-block"
              >
                {t('viewVilla')}
              </LinkAnchor>
            ) : null}
          </div>
          <BookingStatusBadge status={booking.status} />
        </Group>
      </Card>

      <Card>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            {t('payment')}
          </Text>
          <Row label={t('listPrice')} value={money(booking.listPrice)} />
          <Row
            label={t('collectedSale')}
            value={money(booking.amountCollected)}
          />
          {booking.guestPaidOwner > 0 ? (
            <Row
              label={t('collectedOwner')}
              value={money(booking.guestPaidOwner)}
            />
          ) : null}
          <Divider my={4} />
          <Row label={t('remaining')} value={money(booking.remaining)} />
          {booking.refundAmount > 0 ? (
            <Row label={t('refunded')} value={money(booking.refundAmount)} />
          ) : null}
          <Text size="xs" c="dimmed" mt={4}>
            {booking.remainderPayee === 'OWNER'
              ? t('remainderOwnerNote')
              : booking.remaining > 0
                ? t('remainderSaleNote')
                : t('paidFullNote')}
          </Text>
        </Stack>
      </Card>

      <Card>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            {t('timeline')}
          </Text>
          {booking.timeline.map((step) => (
            <Row
              key={step.step}
              label={tTimeline(step.step)}
              value={moment(step.at) || t('notYet')}
            />
          ))}
        </Stack>
      </Card>

      <Card>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            {t('saleContact')}
          </Text>
          {booking.saleName || booking.salePhone ? (
            <>
              <Row label={t('saleName')} value={booking.saleName || '—'} />
              <Row label={t('salePhone')} value={booking.salePhone || '—'} />
            </>
          ) : (
            <Text size="sm" c="dimmed">
              {t('noSaleInfo')}
            </Text>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
