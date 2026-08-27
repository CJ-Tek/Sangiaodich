import { todayDateOnly } from '@/lib/dates';

export type DateRange = { checkIn: string; checkOut: string };

/** Statuses that occupy inventory (post-confirm stay lifecycle). */
export const INVENTORY_LOCK_STATUSES = [
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
] as const;

export type InventoryLockStatus = (typeof INVENTORY_LOCK_STATUSES)[number];

/** Half-open ranges [checkIn, checkOut) overlap test. */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.checkIn < b.checkOut && b.checkIn < a.checkOut;
}

/**
 * Inventory lock policy: only CONFIRMED+ bookings block.
 * PENDING and AWAITING_OWNER do not block other sales (Owner confirm races).
 */
export function hasConfirmedConflict(
  candidate: DateRange,
  confirmedBookings: DateRange[]
): boolean {
  return confirmedBookings.some((b) => rangesOverlap(candidate, b));
}

/** True if calendar day (YYYY-MM-DD) is a night inside any [checkIn, checkOut). */
export function isNightBlocked(
  dateOnly: string,
  ranges: DateRange[]
): boolean {
  return ranges.some((r) => dateOnly >= r.checkIn && dateOnly < r.checkOut);
}

/**
 * Stay still belongs on free/busy calendars: checkout is today or later
 * (same cutoff as Sale's AWAITING_OWNER query). Inventory overlap still
 * includes fully-past CHECKED_OUT rows; only the public calendar drops them.
 */
export function isActiveStayRange(
  range: DateRange,
  today: string = todayDateOnly()
): boolean {
  return range.checkOut >= today;
}

export function activeStayRanges(
  ranges: DateRange[],
  today: string = todayDateOnly()
): DateRange[] {
  return ranges.filter((r) => isActiveStayRange(r, today));
}
