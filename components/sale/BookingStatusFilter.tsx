'use client';

import { SegmentedControl } from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';

export type BookingFilterStatus =
  | 'ALL'
  | 'PENDING'
  | 'AWAITING_OWNER'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED';

const OPTIONS: { value: BookingFilterStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ gửi' },
  { value: 'AWAITING_OWNER', label: 'Chờ Owner' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'CHECKED_IN', label: 'Đã check-in' },
  { value: 'CHECKED_OUT', label: 'Đã check-out' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export function BookingStatusFilter({
  value,
}: {
  value: BookingFilterStatus;
}) {
  const router = useRouter();
  const pathname = usePathname();

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
        data={OPTIONS}
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
