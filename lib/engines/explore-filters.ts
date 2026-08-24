import { todayDateOnly } from '@/lib/dates';
import { eachNight, isWeekend, parseDateOnly } from '@/lib/engines/pricing';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
/** Matches `asset_costs.cost_* numeric(12,0)`. */
export const MAX_EXPLORE_BUDGET_VND = 999_999_999_999;
export const MAX_EXPLORE_GUESTS = 50;

export type ExploreListOpts = {
  q?: string;
  tags?: string[];
  /** Round-tripped on the URL only — matching uses budgetMax. */
  budgetMin?: number;
  budgetMax?: number;
  guests?: number;
  checkIn?: string;
  checkOut?: string;
  page?: number;
};

export type CostColumnFilter = {
  weekday: boolean;
  weekend: boolean;
};

function firstParam(raw?: string | string[]): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function parsePositiveInt(
  raw?: string | string[],
  max = MAX_EXPLORE_BUDGET_VND
): number | undefined {
  const value = firstParam(raw);
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.min(Math.floor(n), max);
}

export function parseBudgetVnd(raw?: string | string[]): number | undefined {
  return parsePositiveInt(raw, MAX_EXPLORE_BUDGET_VND);
}

export function parseGuestsParam(raw?: string | string[]): number | undefined {
  return parsePositiveInt(raw, MAX_EXPLORE_GUESTS);
}

export function parseDateOnlyParam(
  raw?: string | string[]
): string | undefined {
  const value = firstParam(raw);
  if (!value || !DATE_ONLY.test(value)) return undefined;
  const date = parseDateOnly(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (date.toISOString().slice(0, 10) !== value) return undefined;
  return value;
}

export function parseStayRange(
  checkInRaw?: string | string[],
  checkOutRaw?: string | string[]
): { checkIn: string; checkOut: string } | undefined {
  const checkIn = parseDateOnlyParam(checkInRaw);
  const checkOut = parseDateOnlyParam(checkOutRaw);
  if (!checkIn || !checkOut || checkOut <= checkIn) return undefined;
  return { checkIn, checkOut };
}

export function isSearchWeekend(now: Date = new Date()): boolean {
  return isWeekend(parseDateOnly(todayDateOnly(now)));
}

/**
 * Which owner-cost columns the listing must beat (`cost < budgetMax`).
 * Stay nights win when CI/CO is valid; otherwise the VN calendar day of search.
 */
export function costColumnsForExplore(input: {
  checkIn?: string;
  checkOut?: string;
  now?: Date;
}): CostColumnFilter {
  const stay =
    input.checkIn && input.checkOut
      ? parseStayRange(input.checkIn, input.checkOut)
      : undefined;
  if (stay) {
    const nights = eachNight(stay.checkIn, stay.checkOut);
    if (nights.length) {
      return {
        weekday: nights.some((night) => !isWeekend(night)),
        weekend: nights.some((night) => isWeekend(night)),
      };
    }
  }
  const weekend = isSearchWeekend(input.now);
  return { weekday: !weekend, weekend };
}

export function hasExploreQueryFilters(input: {
  keyword?: string;
  tags?: string[];
  budgetMax?: number;
  guests?: number;
}): boolean {
  return Boolean(
    input.keyword?.trim() ||
      (input.tags && input.tags.length > 0) ||
      input.budgetMax ||
      input.guests
  );
}

export function parseExploreAdvancedParams(sp: {
  budgetMin?: string | string[];
  budgetMax?: string | string[];
  guests?: string | string[];
  checkIn?: string | string[];
  checkOut?: string | string[];
}): {
  budgetMin?: number;
  budgetMax?: number;
  guests?: number;
  checkIn?: string;
  checkOut?: string;
} {
  const stay = parseStayRange(sp.checkIn, sp.checkOut);
  return {
    budgetMin: parseBudgetVnd(sp.budgetMin),
    budgetMax: parseBudgetVnd(sp.budgetMax),
    guests: parseGuestsParam(sp.guests),
    checkIn: stay?.checkIn,
    checkOut: stay?.checkOut,
  };
}

export function hasAdvancedExploreDefaults(input: {
  budgetMin?: number;
  budgetMax?: number;
  guests?: number;
  checkIn?: string;
  checkOut?: string;
}): boolean {
  return Boolean(
    input.budgetMin ||
      input.budgetMax ||
      input.guests ||
      input.checkIn ||
      input.checkOut
  );
}
