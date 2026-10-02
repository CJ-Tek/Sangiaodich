function money(n: number | undefined): number {
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

/** Sale margin kept from the guest's payment. Never negative. */
export function saleMarginKept(listPrice: number, ownerCost: number): number {
  return Math.max(0, money(listPrice) - money(ownerCost));
}

/**
 * What Sale forwards to Owner from money already collected.
 * Guest paid the full sale price: this is the whole cost.
 * Guest paid a deposit: collected minus sale margin (example 2_500_000 − 1_000_000 = 1_500_000).
 */
export function saleDepositToOwner(
  listPrice: number,
  amountCollected: number,
  ownerCost: number
): number {
  return Math.max(
    0,
    money(amountCollected) - saleMarginKept(listPrice, ownerCost)
  );
}

/**
 * What the guest still pays the owner. Capped so owner receipts never exceed cost.
 */
export function guestPaysOwner(input: {
  listPrice: number;
  amountCollected: number;
  ownerCost: number;
  ownerPaid: number;
  guestPaidOwner?: number;
}): number {
  const listLeft = guestRemaining(
    input.listPrice,
    input.amountCollected,
    input.guestPaidOwner
  );
  const costLeft = Math.max(
    0,
    money(input.ownerCost) -
      money(input.ownerPaid) -
      money(input.guestPaidOwner)
  );
  return Math.min(listLeft, costLeft);
}

/**
 * Whether Sale has finished their Owner-cost duty.
 * Deposit case: Sale has forwarded collected minus margin.
 * Guest paid in full: that amount is the whole owner cost.
 */
export function saleOwnerPayoutSatisfied(input: {
  listPrice: number;
  amountCollected: number;
  ownerEarn: number;
  ownerPaid: number;
}): boolean {
  const paid = money(input.ownerPaid);
  const due = saleDepositToOwner(
    input.listPrice,
    input.amountCollected,
    input.ownerEarn
  );
  return paid >= due;
}

export type SettlementPayout = 'none' | 'partial' | 'full';

/**
 * Owner settlement badge.
 * Partial: Sale has sent the deposit and the cost is not fully received.
 * Full: Sale plus guest transfers cover the owner cost.
 */
export function settlementPayoutStatus(input: {
  listPrice: number;
  amountCollected: number;
  guestPaidOwner?: number;
  ownerEarn: number;
  ownerPaid: number;
}): SettlementPayout {
  const earn = money(input.ownerEarn);
  const paid = money(input.ownerPaid);
  const guestPaid = money(input.guestPaidOwner);
  const received = paid + guestPaid;
  if (earn <= 0) return received > 0 ? 'full' : 'none';
  if (received >= earn) return 'full';
  const depositDue = saleDepositToOwner(
    input.listPrice,
    input.amountCollected,
    earn
  );
  if (depositDue > 0 && paid >= depositDue) return 'partial';
  return 'none';
}

export type RemainderPayee = 'SALE' | 'OWNER' | null;

/** Who should receive the unpaid remainder, if any. */
export function remainderPayee(input: {
  status: string;
  listPrice: number;
  amountCollected: number;
  guestPaidOwner?: number;
  ownerCost?: number;
  ownerPaid?: number;
}): RemainderPayee {
  const ownerDue =
    input.ownerCost != null
      ? guestPaysOwner({
          listPrice: input.listPrice,
          amountCollected: input.amountCollected,
          ownerCost: input.ownerCost,
          ownerPaid: input.ownerPaid ?? 0,
          guestPaidOwner: input.guestPaidOwner,
        })
      : 0;
  if (
    ownerDue > 0 &&
    (input.status === 'CONFIRMED' || input.status === 'CHECKED_IN')
  ) {
    return 'OWNER';
  }
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
    if (input.ownerCost != null) return ownerDue > 0 ? 'OWNER' : 'SALE';
    return isGuestDepositCase(input.listPrice, input.amountCollected)
      ? 'OWNER'
      : 'SALE';
  }
  return 'SALE';
}
