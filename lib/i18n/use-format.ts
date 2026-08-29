'use client';

import { useLocale } from 'next-intl';
import {
  formatDate,
  formatDateTime,
  formatDecimal,
  formatNumber,
  formatVnd,
  planDurationLabel,
} from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';

export function useFormat() {
  const locale = useLocale() as AppLocale;

  return {
    locale,
    formatNumber: (amount: number) => formatNumber(amount, locale),
    formatVnd: (amount: number) => formatVnd(amount, locale),
    formatDateTime: (
      value: Date | string | number,
      options?: Intl.DateTimeFormatOptions
    ) => formatDateTime(value, locale, options),
    formatDate: (
      value: Date | string | number,
      options?: Intl.DateTimeFormatOptions
    ) => formatDate(value, locale, options),
    formatDecimal: (amount: number, options?: Intl.NumberFormatOptions) =>
      formatDecimal(amount, locale, options),
    planDurationLabel: (months: number) => planDurationLabel(months, locale),
  };
}
