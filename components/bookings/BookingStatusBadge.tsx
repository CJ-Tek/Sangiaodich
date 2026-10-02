'use client';

import { Badge } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { getBookingStatusLabel } from '@/lib/i18n/booking-status';

const chipColors: Record<string, { bg: string; text: string; border: string }> = {
  confirmed: { bg: '#D5E6D8', text: '#173324', border: '#3D5142' },
  checkedIn: { bg: '#D2E4F3', text: '#14344C', border: '#2F5670' },
  checkedOut: { bg: '#E4DFD6', text: '#332C24', border: '#6A5C4E' },
  hold: { bg: '#F4E0B8', text: '#5C3B0A', border: '#A67C3D' },
  depositPending: { bg: '#F4E0B8', text: '#5C3B0A', border: '#A67C3D' },
  cancelled: { bg: '#F0D6D6', text: '#6E2424', border: '#A65D5D' },
  blocked: { bg: '#E4E4DF', text: '#2C2E2A', border: '#6E716B' },
};

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
  const colors = chipColors[key];
  return (
    <Badge
      variant="outline"
      size="md"
      styles={{
        root: {
          background: colors.bg,
          color: colors.text,
          borderColor: colors.border,
          borderWidth: 1,
          fontWeight: 700,
          textTransform: 'none',
          height: 'auto',
          paddingInline: 10,
          maxWidth: 'none',
          overflow: 'visible',
          flexShrink: 0,
        },
        label: {
          color: colors.text,
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1.35,
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
