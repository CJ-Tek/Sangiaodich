'use client';

import { Badge } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { bookingStatusColors } from '@/config/booking-status';
import { getBookingStatusLabel } from '@/lib/i18n/booking-status';

export function BookingStatusBadge({ status }: { status: string }) {
  const t = useTranslations('bookingStatus');
  const key =
    status === 'CONFIRMED'
      ? 'confirmed'
      : status === 'CHECKED_IN'
        ? 'checkedIn'
        : status === 'CHECKED_OUT'
          ? 'checkedOut'
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
          maxWidth: 'none',
          overflow: 'visible',
          flexShrink: 0,
        },
        label: {
          overflow: 'visible',
          textOverflow: 'unset',
          whiteSpace: 'nowrap',
        },
      }}
    >
      {getBookingStatusLabel(status, t)}
    </Badge>
  );
}
