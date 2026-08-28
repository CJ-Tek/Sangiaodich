import { nightsInRange, todayDateOnly } from '@/lib/dates';

export type DateRange = { checkIn: string; checkOut: string };

/** Soft-hold statuses — visible on Sale calendars, do not lock inventory. */
export const INVENTORY_HOLD_STATUSES = ['PENDING', 'AWAITING_OWNER'] as const;

export type InventoryHoldStatus = (typeof INVENTORY_HOLD_STATUSES)[number];

/**
 * One night on the shared ledger. `ui_mode` must never change this.
 * locked > closed > hold > open
 */
export type NightStatus = 'open' | 'hold' | 'locked' | 'closed';

export type StaySpan = DateRange & {
  bookingId: string;
  saleId: string;
  status?: string;
};

export type AssetNightBoard = {
  assetId: string;
  confirmedStays: StaySpan[];
  holdStays: StaySpan[];
  closedNights: string[];
  nightlyCosts: Record<string, number>;
};

export function emptyNightBoard(assetId: string): AssetNightBoard {
  return {
    assetId,
    confirmedStays: [],
    holdStays: [],
    closedNights: [],
    nightlyCosts: {},
  };
}

export function stayRanges(stays: StaySpan[]): DateRange[] {
  return stays.map((s) => ({ checkIn: s.checkIn, checkOut: s.checkOut }));
}

export function stayOnNight(
  dateOnly: string,
  stays: StaySpan[]
): StaySpan | undefined {
  return stays.find((s) => dateOnly >= s.checkIn && dateOnly < s.checkOut);
}

/**
 * Status of one calendar night. Does not take role or ui_mode.
 * Guest calendars treat `hold` as visually open (PENDING does not paint).
 */
export function nightStatus(
  dateOnly: string,
  board: AssetNightBoard
): NightStatus {
  if (isNightBlocked(dateOnly, stayRanges(board.confirmedStays))) {
    return 'locked';
  }
  if (board.closedNights.includes(dateOnly)) return 'closed';
  if (isNightBlocked(dateOnly, stayRanges(board.holdStays))) return 'hold';
  return 'open';
}

/** True when any occupied night of the stay is owner-closed. */
export function hasClosedConflict(
  candidate: DateRange,
  closedNights: string[]
): boolean {
  if (!closedNights.length) return false;
  const closed = new Set(closedNights);
  return nightsInRange(candidate.checkIn, candidate.checkOut).some((n) =>
    closed.has(n)
  );
}


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
