import {
  FIRM_POLICY,
  FIRM_POLICY_SUMMARY,
  CANCELLATION_POLICY_CODE,
} from '@/config/cancellation-policy';
import { daysBetweenDateOnly, todayDateOnly } from '@/lib/dates';
import type { BookingStatus } from '@/lib/types';

export type CancelRefundInput = {
  status: BookingStatus | string;
  checkIn: string;
  amountCollected: number;
  /** Sale goodwill override — full refund outside policy */
  goodwillFullRefund?: boolean;
  today?: string;
};

export type CancelRefundResult = {
  policyCode: typeof CANCELLATION_POLICY_CODE;
  policySummary: string;
  daysUntilCheckIn: number;
  refundPercent: number;
  amountCollected: number;
  refundAmount: number;
  keptAmount: number;
  goodwill: boolean;
  band: 'FULL' | 'PARTIAL' | 'NONE' | 'PENDING_FULL' | 'STAY_STARTED';
};

function clampMoney(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}

/**
 * Compute offline-deposit refund for a guest-side / sale cancel.
 * Money movement stays offline; this is the ledger amount sale should return.
 */
export function computeCancelRefund(input: CancelRefundInput): CancelRefundResult {
  const collected = clampMoney(Number(input.amountCollected || 0));
  const today = input.today ?? todayDateOnly();
  const daysUntilCheckIn = daysBetweenDateOnly(today, input.checkIn);
  const goodwill = Boolean(input.goodwillFullRefund);

  const base = {
    policyCode: CANCELLATION_POLICY_CODE,
    policySummary: FIRM_POLICY_SUMMARY,
    daysUntilCheckIn,
    amountCollected: collected,
    goodwill,
  };

  if (goodwill) {
    return {
      ...base,
      refundPercent: 100,
      refundAmount: collected,
      keptAmount: 0,
      band: 'FULL',
    };
  }

  if (input.status === 'PENDING' || input.status === 'AWAITING_OWNER') {
    return {
      ...base,
      refundPercent: 100,
      refundAmount: collected,
      keptAmount: 0,
      band: 'PENDING_FULL',
    };
  }

  if (input.status === 'CHECKED_IN') {
    return {
      ...base,
      refundPercent: 0,
      refundAmount: 0,
      keptAmount: collected,
      band: 'STAY_STARTED',
    };
  }

  // CONFIRMED (and any other pre-stay locked status)
  let refundPercent = 0;
  let band: CancelRefundResult['band'] = 'NONE';

  if (daysUntilCheckIn >= FIRM_POLICY.fullRefundDays) {
    refundPercent = 100;
    band = 'FULL';
  } else if (daysUntilCheckIn >= FIRM_POLICY.partialRefundDays) {
    refundPercent = FIRM_POLICY.partialRefundPercent;
    band = 'PARTIAL';
  }

  const refundAmount = clampMoney((collected * refundPercent) / 100);
  return {
    ...base,
    refundPercent,
    refundAmount,
    keptAmount: collected - refundAmount,
    band,
  };
}
