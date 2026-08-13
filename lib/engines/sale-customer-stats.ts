import { digitsOnly, phoneFieldMatch } from '@/lib/phone/vn-search';

export { digitsOnly };

export type GuestTierProgressInput = {
  currentSort: number;
  progressBooks: number;
  progressGmv: number;
  tiers: Array<{
    sort: number;
    minBooks: number;
    minGmv: number;
    label: string;
  }>;
};

export type RemainingToRank = {
  nextLabel: string | null;
  remainingBooks: number | null;
  remainingGmv: number | null;
  atMaxTier: boolean;
};

/** Net paid for one booking line (never negative). */
export function bookingNetPaid(
  amountCollected: number | null | undefined,
  refundAmount: number | null | undefined
): number {
  const collected = Number(amountCollected || 0);
  const refund = Number(refundAmount || 0);
  return Math.max(0, collected - refund);
}

export function sumNetPaid(
  rows: Array<{
    amountCollected?: number | null;
    refundAmount?: number | null;
  }>
): number {
  return rows.reduce(
    (sum, row) => sum + bookingNetPaid(row.amountCollected, row.refundAmount),
    0
  );
}

export function remainingToNextRank(
  input: GuestTierProgressInput
): RemainingToRank {
  const sorted = [...input.tiers].sort((a, b) => a.sort - b.sort);
  const next = sorted.find((t) => t.sort === input.currentSort + 1);
  if (!next) {
    return {
      nextLabel: null,
      remainingBooks: null,
      remainingGmv: null,
      atMaxTier: true,
    };
  }
  return {
    nextLabel: next.label,
    remainingBooks: Math.max(0, next.minBooks - input.progressBooks),
    remainingGmv: Math.max(0, next.minGmv - input.progressGmv),
    atMaxTier: false,
  };
}

/**
 * Match customer by name (case-insensitive substring) or phone digits substring.
 * Empty query matches everything. VN trunk 0 and country 84 are equivalent.
 */
export function matchesCustomerSearch(
  query: string,
  fullName: string,
  phone: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (fullName.toLowerCase().includes(q)) return true;
  if (phoneFieldMatch(q, phone)) return true;
  return false;
}
