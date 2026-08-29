'use client';

import { Badge } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { bookingStatusColors } from '@/config/booking-status';
import { getBookingStatusLabel } from '@/lib/i18n/booking-status';

export function BookingStatusBadge({ status }: { status: string }) {
  const t = useTranslations('bookingStatus');
  const key =
    status === 'CONFIRMED' || status === 'CHECKED_IN'
      ? 'confirmed'
      : status === 'CHECKED_OUT'
        ? 'selected'
        : status === 'PENDING'
          ? 'hold'
          : status === 'AWAITING_OWNER'
            ? 'depositPending'
            : status === 'CANCELLED'
              ? 'cancelled'
              : 'blocked';
  const colors = bookingStatusColors[key];
  return (
    <Badge
      variant="outline"
      styles={{
        root: {
          background: colors.bg,
          color: colors.text,
          borderColor: colors.border,
        },
      }}
    >
      {getBookingStatusLabel(status, t)}
    </Badge>
  );
}
