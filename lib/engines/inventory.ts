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
