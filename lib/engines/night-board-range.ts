import { dateOnlyAddDays, todayDateOnly } from '@/lib/dates';

/** Inclusive list of YYYY-MM-DD nights starting at `from` (length = count). */
export function listNightsFrom(from: string, count: number): string[] {
  const n = Math.min(Math.max(count, 1), 62);
  return Array.from({ length: n }, (_, i) => dateOnlyAddDays(from, i));
}

/** Board start date: YYYY-MM-DD today or later. Invalid/past → today. */
export function parseBoardFrom(raw?: string | null, today = todayDateOnly()): string {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw >= today) return raw;
  return today;
}

