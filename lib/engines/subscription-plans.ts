export type SubscriptionPlanRole = 'OWNER' | 'SALE';

export type SubscriptionPlan = {
  id: string;
  role: SubscriptionPlanRole;
  months: 1 | 3 | 6 | 12;
  amount: number;
  /** Optional list price for marketing discount badge. Payable = amount. */
  compare_at_amount: number | null;
  label: string;
  is_active: boolean;
  sort_order: number;
};

export type PlanDiscount = {
  compareAt: number;
  amount: number;
  saveAmount: number;
  percent: number;
};

import {
  formatVnd as formatVndLocale,
  planDurationLabel as planDurationLabelLocale,
} from '@/lib/i18n/format';
import type { AppLocale } from '@/lib/i18n/routing';

/** @deprecated Pass locale — use `planDurationLabel(months, locale)` from `@/lib/i18n/format`. */
export function planDurationLabel(months: number, locale: AppLocale = 'vi'): string {
  return planDurationLabelLocale(months, locale);
}

/** @deprecated Pass locale — use `formatVnd(amount, locale)` from `@/lib/i18n/format`. */
export function formatVnd(amount: number, locale: AppLocale = 'vi'): string {
  return formatVndLocale(amount, locale);
}

/** Marketing discount when compare_at_amount > amount. */
export function planDiscount(plan: {
  amount: number;
  compare_at_amount?: number | null;
}): PlanDiscount | null {
  const compareAt = Number(plan.compare_at_amount);
  const amount = Number(plan.amount);
  if (!Number.isFinite(compareAt) || !Number.isFinite(amount)) return null;
  if (compareAt <= amount) return null;
  const saveAmount = compareAt - amount;
  const percent = Math.round((saveAmount / compareAt) * 100);
  if (percent <= 0 || saveAmount <= 0) return null;
  return { compareAt, amount, saveAmount, percent };
}

export function mapSubscriptionPlan(row: {
  id: string;
  role: string;
  months: number;
  amount: number | string;
  compare_at_amount?: number | string | null;
  label?: string | null;
  is_active: boolean;
  sort_order: number;
}): SubscriptionPlan {
  const compareRaw = row.compare_at_amount;
  return {
    id: row.id,
    role: row.role as SubscriptionPlanRole,
    months: row.months as 1 | 3 | 6 | 12,
    amount: Number(row.amount),
    compare_at_amount:
      compareRaw == null || compareRaw === ''
        ? null
        : Number.isFinite(Number(compareRaw))
          ? Number(compareRaw)
          : null,
    label: row.label || '',
    is_active: row.is_active,
    sort_order: row.sort_order,
  };
}
