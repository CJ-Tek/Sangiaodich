import type { AppLocale } from './routing';

const localeToBcp47: Record<AppLocale, string> = {
  vi: 'vi-VN',
  en: 'en-US',
};

export function formatCurrency(
  amount: number,
  locale: AppLocale,
  currency = 'VND'
): string {
  return new Intl.NumberFormat(localeToBcp47[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number, locale: AppLocale): string {
  return new Intl.NumberFormat(localeToBcp47[locale]).format(amount);
}

export function formatDecimal(
  amount: number,
  locale: AppLocale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(localeToBcp47[locale], options).format(amount);
}

export function formatDateTime(
  value: Date | string | number,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(localeToBcp47[locale], {
    timeZone: 'Asia/Ho_Chi_Minh',
    ...options,
  }).format(date);
}

export function formatDate(
  value: Date | string | number,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  return formatDateTime(value, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatVnd(amount: number, locale: AppLocale): string {
  return `${formatNumber(amount, locale)}đ`;
}

const planDurationLabels: Record<
  AppLocale,
  { oneYear: string; oneMonth: string; months: (count: number) => string }
> = {
  vi: {
    oneYear: '1 năm',
    oneMonth: '1 tháng',
    months: (count) => `${count} tháng`,
  },
  en: {
    oneYear: '1 year',
    oneMonth: '1 month',
    months: (count) => `${count} months`,
  },
};

export function planDurationLabel(months: number, locale: AppLocale): string {
  if (months === 12) return planDurationLabels[locale].oneYear;
  if (months === 1) return planDurationLabels[locale].oneMonth;
  return planDurationLabels[locale].months(months);
}
