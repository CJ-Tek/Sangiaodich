import { dateOnlyAddDays, nightsInRange } from '@/lib/dates';
import {
  nightStatus,
  type AssetNightBoard,
} from '@/lib/engines/inventory';
import { isWeekend, parseDateOnly } from '@/lib/engines/pricing';

export type NightBoardColumn = {
  assetId: string;
  title: string;
  slug?: string;
  imageUrl?: string | null;
  bedrooms?: number;
  bathrooms?: number;
  capacity?: number;
  location?: string;
  costWeekday: number;
  costWeekend: number;
  /** Sale membership-adjusted rates. Owner columns omit this. */
  effectiveWeekday?: number;
  effectiveWeekend?: number;
  /** Sale membership % off owner cost. */
  saleDiscountPercent?: number;
  ownerName?: string;
  ownerPhone?: string | null;
  images?: { url: string; sort_order: number }[];
  /** Expert marketplace / edit page for this column. */
  detailHref?: string;
  board: AssetNightBoard;
};

export function weekdayLabel(dateOnly: string): string {
  const day = parseDateOnly(dateOnly).getUTCDay();
  return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day] ?? '';
}

export function compactCost(amount: number): string {
  if (!amount) return '—';
  if (amount >= 1000) return String(Math.round(amount / 1000));
  return String(amount);
}

export function nightBaseCost(
  dateOnly: string,
  column: NightBoardColumn
): number {
  const override = column.board.nightlyCosts[dateOnly];
  if (override != null) return override;
  return isWeekend(parseDateOnly(dateOnly))
    ? column.costWeekend
    : column.costWeekday;
}

export function nightDisplayCost(
  dateOnly: string,
  column: NightBoardColumn,
  audience: 'owner' | 'sale'
): number {
  const base = nightBaseCost(dateOnly, column);
  if (audience === 'owner') return base;
  const pct = column.saleDiscountPercent || 0;
  return Math.round(base * (1 - pct / 100));
}

/** Half-open stay from two inclusive night dates. */
export function orderedStay(
  a: string,
  b: string
): { checkIn: string; checkOut: string } {
  const checkIn = a <= b ? a : b;
  const last = a <= b ? b : a;
  return { checkIn, checkOut: dateOnlyAddDays(last, 1) };
}

/** Sum of per-night display cost over [checkIn, checkOut). */
export function stayDisplayCost(
  checkIn: string,
  checkOut: string,
  column: NightBoardColumn,
  audience: 'owner' | 'sale'
): number {
  return nightsInRange(checkIn, checkOut).reduce(
    (sum, night) => sum + nightDisplayCost(night, column, audience),
    0
  );
}

export function stayHasBlockedNight(
  checkIn: string,
  checkOut: string,
  board: AssetNightBoard
): boolean {
  return nightsInRange(checkIn, checkOut).some(
    (night) => nightStatus(night, board) !== 'open'
  );
}

export function isDateInInclusiveRange(
  date: string,
  start: string,
  end: string
): boolean {
  const lo = start <= end ? start : end;
  const hi = start <= end ? end : start;
  return date >= lo && date <= hi;
}
