'use client';

import { Group, Select } from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';
import { currentYearMonth } from '@/lib/dates';

const MONTH_OPTIONS = [
  { value: '01', label: 'Tháng 1' },
  { value: '02', label: 'Tháng 2' },
  { value: '03', label: 'Tháng 3' },
  { value: '04', label: 'Tháng 4' },
  { value: '05', label: 'Tháng 5' },
  { value: '06', label: 'Tháng 6' },
  { value: '07', label: 'Tháng 7' },
  { value: '08', label: 'Tháng 8' },
  { value: '09', label: 'Tháng 9' },
  { value: '10', label: 'Tháng 10' },
  { value: '11', label: 'Tháng 11' },
  { value: '12', label: 'Tháng 12' },
];

function yearOptions(around: number) {
  return [around - 2, around - 1, around, around + 1].map((y) => ({
    value: String(y),
    label: String(y),
  }));
}

export function SalePeriodFilter({ yearMonth }: { yearMonth: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [year, month] = yearMonth.split('-');
  const nowYm = currentYearMonth();
  const nowYear = Number(nowYm.slice(0, 4));

  function push(nextYear: string, nextMonth: string) {
    const next = `${nextYear}-${nextMonth}`;
    const params = new URLSearchParams();
    if (next !== nowYm) params.set('ym', next);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Group gap="xs" wrap="nowrap">
      <Select
        aria-label="Tháng"
        data={MONTH_OPTIONS}
        value={month}
        w={120}
        allowDeselect={false}
        onChange={(m) => {
          if (m) push(year, m);
        }}
      />
      <Select
        aria-label="Năm"
        data={yearOptions(nowYear)}
        value={year}
        w={100}
        allowDeselect={false}
        onChange={(y) => {
          if (y) push(y, month);
        }}
      />
    </Group>
  );
}
