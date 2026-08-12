/** Calendar date helpers (date-only, no time-of-day). App timezone: Vietnam. */

export const APP_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Today's date as YYYY-MM-DD in app timezone. */
export function todayDateOnly(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** True when dateOnly (YYYY-MM-DD) is strictly before today. */
export function isPastDateOnly(dateOnly: string, today = todayDateOnly()): boolean {
  return Boolean(dateOnly) && dateOnly < today;
}

/** Whole calendar days from `from` to `to` (YYYY-MM-DD). Negative if `to` is before `from`. */
export function daysBetweenDateOnly(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const start = Date.UTC(fy, fm - 1, fd);
  const end = Date.UTC(ty, tm - 1, td);
  return Math.round((end - start) / 86_400_000);
}

/** Last day of calendar month (1-based month). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Current calendar month as YYYY-MM in app timezone. */
export function currentYearMonth(now: Date = new Date()): string {
  return todayDateOnly(now).slice(0, 7);
}

/**
 * Parse `YYYY-MM` (or invalid → current month).
 * Bounds use Asia/Ho_Chi_Minh midnight (+07:00).
 */
export function parseYearMonth(raw?: string | null): {
  yearMonth: string;
  year: number;
  month: number;
  /** Inclusive start ISO timestamptz */
  startIso: string;
  /** Exclusive end ISO timestamptz */
  endIso: string;
  /** Inclusive start date YYYY-MM-DD */
  startDate: string;
  /** Exclusive end date YYYY-MM-DD */
  endDate: string;
} {
  const fallback = currentYearMonth();
  const match = raw && /^(\d{4})-(\d{2})$/.exec(raw);
  let yearMonth = fallback;
  if (match) {
    const y = Number(match[1]);
    const m = Number(match[2]);
    if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
      yearMonth = `${match[1]}-${match[2]}`;
    }
  }
  const [ys, ms] = yearMonth.split('-');
  const year = Number(ys);
  const month = Number(ms);
  const startDate = `${yearMonth}-01`;
  const endDate = addCalendarMonths(startDate, 1);
  return {
    yearMonth,
    year,
    month,
    startDate,
    endDate,
    startIso: `${startDate}T00:00:00+07:00`,
    endIso: `${endDate}T00:00:00+07:00`,
  };
}

/**
 * Add N calendar months to a YYYY-MM-DD date.
 * Clamps day to end-of-month (e.g. 2026-01-31 + 1 month → 2026-02-28).
 */
export function addCalendarMonths(dateOnly: string, months: number): string {
  const [y, m, d] = dateOnly.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Invalid dateOnly: ${dateOnly}`);
  const totalMonths = (y * 12 + (m - 1)) + months;
  const ny = Math.floor(totalMonths / 12);
  const nm = (totalMonths % 12) + 1;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return `${ny.toString().padStart(4, '0')}-${nm.toString().padStart(2, '0')}-${nd.toString().padStart(2, '0')}`;
}
