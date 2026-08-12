/**
 * Platform default cancellation policy (Firm-style, OTA-inspired).
 * Applies to offline deposit (`amount_collected`) when guest/sale cancels.
 *
 * - PENDING / AWAITING_OWNER: full refund of anything collected (inventory not locked)
 * - CONFIRMED: tiered by days until check-in
 * - CHECKED_IN: no policy refund (stay started); goodwill override only
 */
export const CANCELLATION_POLICY_CODE = 'FIRM' as const;

export const FIRM_POLICY = {
  code: CANCELLATION_POLICY_CODE,
  label: 'Firm',
  /** Full refund if cancel at least this many days before check-in */
  fullRefundDays: 30,
  /** Partial (50%) refund if cancel at least this many days before check-in */
  partialRefundDays: 7,
  partialRefundPercent: 50,
} as const;

export const FIRM_POLICY_SUMMARY =
  '≥30 ngày trước CI: hoàn 100% cọc · 7–29 ngày: hoàn 50% · <7 ngày / đã check-in: giữ 100% cọc';
