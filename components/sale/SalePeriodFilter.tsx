'use client';

import { Group, Select } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/navigation';
import { currentYearMonth } from '@/lib/dates';

const MONTH_KEYS = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
] as const;

function yearOptions(around: number) {
  return [around - 2, around - 1, around, around + 1].map((y) => ({
    value: String(y),
    label: String(y),
  }));
}

export function SalePeriodFilter({ yearMonth }: { yearMonth: string }) {
  const t = useTranslations('sale.bookings');
  const router = useRouter();
  const pathname = usePathname();
  const [year, month] = yearMonth.split('-');
  const nowYm = currentYearMonth();
  const nowYear = Number(nowYm.slice(0, 4));

  const monthOptions = MONTH_KEYS.map((key) => ({
    value: key,
    label: t(`months.${key}`),
  }));

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
        aria-label={t('monthAria')}
        data={monthOptions}
        value={month}
        w={120}
        allowDeselect={false}
        onChange={(m) => {
          if (m) push(year, m);
        }}
      />
      <Select
        aria-label={t('yearAria')}
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
