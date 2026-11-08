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

type DayParts = { day: string; month: string; year: string };

function dayParts(value: Date | string | number): DayParts {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return { day: pick('day'), month: pick('month'), year: pick('year') };
}

const enDay: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

/** Calendar day: `20/11/2026` (vi) · `Nov 20, 2026` (en). */
export function formatDay(
  value: Date | string | number,
  locale: AppLocale
): string {
  if (locale === 'en') {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(localeToBcp47.en, enDay).format(date);
  }
  const { day, month, year } = dayParts(value);
  return `${day}/${month}/${year}`;
}

/** Stay or period range: `20–23/11/2026`, `28/11 – 02/12/2026` (vi) · `Nov 20 – 23, 2026` (en). */
export function formatDateRange(
  start: Date | string | number,
  end: Date | string | number,
  locale: AppLocale
): string {
  if (locale === 'en') {
    const a = start instanceof Date ? start : new Date(start);
    const b = end instanceof Date ? end : new Date(end);
    return new Intl.DateTimeFormat(localeToBcp47.en, enDay).formatRange(a, b);
  }
  const a = dayParts(start);
  const b = dayParts(end);
  if (a.day === b.day && a.month === b.month && a.year === b.year) {
    return `${a.day}/${a.month}/${a.year}`;
  }
  if (a.year !== b.year) {
    return `${a.day}/${a.month}/${a.year} – ${b.day}/${b.month}/${b.year}`;
  }
  if (a.month !== b.month) {
    return `${a.day}/${a.month} – ${b.day}/${b.month}/${b.year}`;
  }
  return `${a.day}–${b.day}/${b.month}/${b.year}`;
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
