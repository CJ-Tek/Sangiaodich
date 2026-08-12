'use client';

import { Badge } from '@mantine/core';
import { bookingStatusColors, bookingStatusLabels } from '@/config/booking-status';

export function BookingStatusBadge({ status }: { status: string }) {
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
      {bookingStatusLabels[status] || status}
    </Badge>
  );
}
