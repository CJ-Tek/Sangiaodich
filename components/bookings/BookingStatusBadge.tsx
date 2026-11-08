'use client';

import { Badge } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { getBookingStatusLabel } from '@/lib/i18n/booking-status';

/** Soft tinted pill + status dot; text ≥ 5.5:1 on its tint. */
const chipColors: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed: { bg: '#E6F4F1', text: '#0B6D61', dot: '#10A18E' },
  checkedIn: { bg: '#E8F1F8', text: '#1F4E73', dot: '#3B7BB0' },
  checkedOut: { bg: '#F1EFEA', text: '#4A4238', dot: '#8A7F70' },
  hold: { bg: '#FBF1E1', text: '#7A5212', dot: '#C08A2E' },
  depositPending: { bg: '#FBF1E1', text: '#7A5212', dot: '#C08A2E' },
  cancelled: { bg: '#F9E9E9', text: '#8A2F2F', dot: '#C25454' },
  blocked: { bg: '#F0F0EC', text: '#4A4D48', dot: '#8B8D87' },
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
      variant="light"
      size="lg"
      radius="xl"
      leftSection={
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: colors.dot,
            display: 'block',
          }}
        />
      }
      styles={{
        root: {
          background: colors.bg,
          color: colors.text,
          border: 'none',
          textTransform: 'none',
          letterSpacing: 0,
          paddingInline: 10,
          maxWidth: 'none',
          overflow: 'visible',
          flexShrink: 0,
        },
        section: {
          marginInlineEnd: 6,
        },
        label: {
          color: colors.text,
          fontSize: 12.5,
          fontWeight: 600,
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
