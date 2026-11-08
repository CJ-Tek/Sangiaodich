'use client';

import { Divider, Group, Paper, Stack, Text, Timeline } from '@mantine/core';
import { useLocale, useTranslations } from 'next-intl';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { colors, radius } from '@/config/design-tokens';
import { formatCurrency, formatDateRange, formatDay } from '@/lib/i18n/format';
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

  const lastDoneStep = booking.timeline.reduce(
    (last, step, i) => (step.at ? i : last),
    -1
  );

  function moment(iso: string | null) {
    if (!iso) return null;
    return formatDay(iso, locale);
  }

  return (
    <Stack gap="md">
      <Card>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <SectionTitle>{booking.assetTitle}</SectionTitle>
            <Text size="sm" c="dimmed" mt={4}>
              {formatDateRange(booking.checkIn, booking.checkOut, locale)}
            </Text>
            {booking.assetSlug ? (
              <LinkAnchor
                href={`/a/${booking.assetSlug}`}
                size="sm"
                c="vbnbGreen.6"
                mt={6}
                className="vbnb-tap-link"
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
          <SectionTitle level="card" order={2}>
            {t('payment')}
          </SectionTitle>
          <Row label={t('listPrice')} value={money(booking.listPrice)} />
          <Row
            label={t('collectedSale')}
            value={money(booking.amountCollected)}
          />
          <Row label={t('payOwner')} value={money(booking.ownerDue)} />
          {booking.guestPaidOwner > 0 ? (
            <Row
              label={t('collectedOwner')}
              value={money(booking.guestPaidOwner)}
            />
          ) : null}
          <Divider my={4} />
          <Group justify="space-between" wrap="nowrap" align="baseline">
            <Text size="sm" fw={600}>
              {t('remaining')}
            </Text>
            <Text
              fw={700}
              size="lg"
              className="vbnb-tabular-nums"
              c={booking.remaining > 0 ? colors.warningText : 'vbnbGreen.6'}
            >
              {money(booking.remaining)}
            </Text>
          </Group>
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
          <SectionTitle level="card" order={2}>
            {t('timeline')}
          </SectionTitle>
          <Timeline
            active={lastDoneStep}
            bulletSize={16}
            lineWidth={2}
            color="vbnbGreen"
            mt={6}
          >
            {booking.timeline.map((step) => (
              <Timeline.Item
                key={step.step}
                color={step.step === 'cancelled' ? 'red' : undefined}
                title={
                  <Text size="sm" fw={step.at ? 600 : 500} c={step.at ? undefined : 'dimmed'}>
                    {tTimeline(step.step)}
                  </Text>
                }
              >
                <Text size="xs" c="dimmed">
                  {moment(step.at) || t('notYet')}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        </Stack>
      </Card>

      <Card>
        <Stack gap="xs">
          <SectionTitle level="card" order={2}>
            {t('saleContact')}
          </SectionTitle>
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
