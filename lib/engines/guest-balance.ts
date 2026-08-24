import { minOwnerDepositToConfirm } from '@/lib/engines/pricing';

function money(n: number): number {
  const v = Number(n || 0);
  return Number.isFinite(v) ? v : 0;
}

/** Guest still owes anyone (Sale + Owner receipts). Never negative. */
export function guestRemaining(
  listPrice: number,
  saleCollected: number,
  guestPaidOwner = 0
): number {
  return Math.max(
    0,
    money(listPrice) - money(saleCollected) - money(guestPaidOwner)
  );
}

export function isGuestPaidInFull(
  listPrice: number,
  saleCollected: number,
  guestPaidOwner = 0
): boolean {
  return guestRemaining(listPrice, saleCollected, guestPaidOwner) <= 0;
}

/** Case A: guest still has a remainder after Sale receipts (typically 50% deposit). */
export function isGuestDepositCase(
  listPrice: number,
  saleCollected: number
): boolean {
  return money(saleCollected) < money(listPrice);
}

/**
 * Whether Sale has finished their Owner-cost duty.
 * Case A: 50% cost is enough (remainder is Guest → Owner at check-in).
 * Case B: Sale must transfer full owner earn.
 */
export function saleOwnerPayoutSatisfied(input: {
  listPrice: number;
  amountCollected: number;
  ownerEarn: number;
  ownerPaid: number;
}): boolean {
  const paid = money(input.ownerPaid);
  const earn = money(input.ownerEarn);
  if (isGuestDepositCase(input.listPrice, input.amountCollected)) {
    return paid >= minOwnerDepositToConfirm(earn);
  }
  return earn <= 0 || paid >= earn;
}

export type RemainderPayee = 'SALE' | 'OWNER' | null;

/** Who should receive the unpaid remainder, if any. */
export function remainderPayee(input: {
  status: string;
  listPrice: number;
  amountCollected: number;
  guestPaidOwner?: number;
}): RemainderPayee {
  if (
    guestRemaining(
      input.listPrice,
      input.amountCollected,
      input.guestPaidOwner
    ) <= 0
  ) {
    return null;
  }
  if (input.status === 'CONFIRMED' || input.status === 'CHECKED_IN') {
    return isGuestDepositCase(input.listPrice, input.amountCollected)
      ? 'OWNER'
      : 'SALE';
  }
  return 'SALE';
}
