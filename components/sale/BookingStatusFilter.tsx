'use client';

import { SegmentedControl } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/navigation';

export type BookingFilterStatus =
  | 'ALL'
  | 'PENDING'
  | 'AWAITING_OWNER'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED';

export function BookingStatusFilter({
  value,
}: {
  value: BookingFilterStatus;
}) {
  const t = useTranslations('sale.bookings');
  const router = useRouter();
  const pathname = usePathname();

  const options: { value: BookingFilterStatus; label: string }[] = [
    { value: 'ALL', label: t('filterAll') },
    { value: 'PENDING', label: t('filterPending') },
    { value: 'AWAITING_OWNER', label: t('filterAwaitingOwner') },
    { value: 'CONFIRMED', label: t('filterConfirmed') },
    { value: 'CHECKED_IN', label: t('filterCheckedIn') },
    { value: 'CHECKED_OUT', label: t('filterCheckedOut') },
    { value: 'CANCELLED', label: t('filterCancelled') },
  ];

  return (
    <div
      style={{
        overflowX: 'auto',
        maxWidth: '100%',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <SegmentedControl
        color="vbnbGreen"
        value={value}
        data={options}
        styles={{
          root: { width: 'max-content' },
          control: { flexShrink: 0 },
          label: { whiteSpace: 'nowrap' },
        }}
        onChange={(next) => {
          const params = new URLSearchParams();
          if (next !== 'PENDING') params.set('status', next);
          const qs = params.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
        }}
      />
    </div>
  );
}
