/** Decision layer for matching an incoming SePay transfer to a payment intent. */

export type PaymentMatchDecision =
  | { action: 'ALREADY_PAID'; note: string }
  | { action: 'AMOUNT_MISMATCH'; note: string }
  | { action: 'CLAIM'; note: string };

/**
 * Money is already in the bank account, so every non-PAID intent stays claimable
 * as long as the amount is exact — an expired, cancelled or previously
 * mismatched intent must not strand a real transfer.
 */
export function decidePaymentMatch(input: {
  intentStatus: string;
  expectedAmount: number;
  transferAmount: number;
}): PaymentMatchDecision {
  if (input.intentStatus === 'PAID') {
    return { action: 'ALREADY_PAID', note: 'ALREADY_PAID' };
  }

  if (Number(input.transferAmount) !== Number(input.expectedAmount)) {
    return {
      action: 'AMOUNT_MISMATCH',
      note: `AMOUNT_MISMATCH expected=${input.expectedAmount} got=${input.transferAmount}`,
    };
  }

  return { action: 'CLAIM', note: 'CLAIM' };
}

/** Keep the origin status in the audit note when a late transfer is honoured. */
export function buildActivationNote(input: {
  extended: boolean;
  claimedFromStatus: string;
}): string {
  const base = input.extended ? 'EXTENDED' : 'ACTIVATED';
  if (input.claimedFromStatus === 'PENDING') return base;
  return `${base}_FROM_${input.claimedFromStatus}`;
}
