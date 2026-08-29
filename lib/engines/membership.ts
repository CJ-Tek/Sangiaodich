export type SaleTier = {
  id: string;
  sort: number;
  minCheckedOutCount: number;
  costDiscountPercent: number;
};

export type GuestTier = {
  id: string;
  sort: number;
  minBooks: number;
  minGmv: number;
};

export const MAX_ASSET_DISCOUNT_RULES = 10;

export type OwnerDiscountRuleInput = {
  minCheckedOutCount: number;
  costDiscountPercent: number;
};

/**
 * Owner form/API: drop blank 0% rows, reject bad numbers, cap length.
 * Percent 0–100 is a math bound (cost cannot go negative), not an Admin ceiling.
 */
export function parseOwnerDiscountRules(
  raw: unknown
): { rules: OwnerDiscountRuleInput[] } | { error: string } {
  if (raw == null) return { rules: [] };
  if (!Array.isArray(raw)) return { error: 'INVALID_DISCOUNT_RULES' };

  const rules: OwnerDiscountRuleInput[] = [];
  const seen = new Set<number>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const min = Math.round(Number(row.minCheckedOutCount ?? row.min_checked_out_count));
    const pct = Number(row.costDiscountPercent ?? row.cost_discount_percent);
    if (!Number.isFinite(min) || min < 0) return { error: 'INVALID_DISCOUNT_THRESHOLD' };
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return { error: 'INVALID_DISCOUNT_PERCENT' };
    }
    if (pct === 0) continue;
    if (seen.has(min)) return { error: 'DUPLICATE_DISCOUNT_THRESHOLD' };
    seen.add(min);
    rules.push({ minCheckedOutCount: min, costDiscountPercent: pct });
    if (rules.length > MAX_ASSET_DISCOUNT_RULES) {
      return { error: 'TOO_MANY_DISCOUNT_RULES' };
    }
  }
  rules.sort((a, b) => a.minCheckedOutCount - b.minCheckedOutCount);
  return { rules };
}

/**
 * Highest matching rule: discount applies when checkout count is *strictly
 * greater* than the threshold (21 unlocks “trên 20”). No match → 0%.
 */
export function pickSaleTierFromCount(
  checkoutCount: number,
  tiers: SaleTier[]
): SaleTier | null {
  if (!tiers.length) return null;
  const sorted = [...tiers].sort(
    (a, b) =>
      a.minCheckedOutCount - b.minCheckedOutCount || a.sort - b.sort
  );
  const count = Math.max(0, Number(checkoutCount) || 0);
  let current: SaleTier | null = null;
  for (const tier of sorted) {
    if (count > tier.minCheckedOutCount) current = tier;
  }
  return current;
}

export function pickSaleDiscountFromCount(
  checkoutCount: number,
  tiers: SaleTier[]
): number {
  return pickSaleTierFromCount(checkoutCount, tiers)?.costDiscountPercent ?? 0;
}

export function saleDiscountSnapshotLabel(percent: number): string {
  const p = Math.round(Number(percent) || 0);
  if (p <= 0) return '0%';
  return `-${p}%`;
}

export type GuestProgressState = {
  currentTier: GuestTier;
  progressBooks: number;
  progressGmv: number;
  lifetimeBooks: number;
  lifetimeGmv: number;
  rankedUp: boolean;
};

/**
 * Single source of truth for the guest rank-up rule: both the book count and
 * the GMV threshold of the next tier must be met, and ranking up consumes
 * progress. `addBooks` is 0 when only more money lands on an existing confirm.
 */
export function applyGuestProgress(input: {
  currentTier: GuestTier;
  progressBooks: number;
  progressGmv: number;
  lifetimeBooks: number;
  lifetimeGmv: number;
  addBooks: number;
  addGmv: number;
  tiers: GuestTier[];
}): GuestProgressState {
  const sorted = [...input.tiers].sort((a, b) => a.sort - b.sort);
  const lifetimeBooks = input.lifetimeBooks + input.addBooks;
  const lifetimeGmv = input.lifetimeGmv + input.addGmv;
  let progressBooks = input.progressBooks + input.addBooks;
  let progressGmv = input.progressGmv + input.addGmv;
  let currentTier = input.currentTier;
  let rankedUp = false;

  const next = sorted.find((t) => t.sort === currentTier.sort + 1);
  if (
    next &&
    progressBooks >= next.minBooks &&
    progressGmv >= next.minGmv
  ) {
    currentTier = next;
    progressBooks = 0;
    progressGmv = 0;
    rankedUp = true;
  }

  return {
    currentTier,
    progressBooks,
    progressGmv,
    lifetimeBooks,
    lifetimeGmv,
    rankedUp,
  };
}

/**
 * Guest progress advances on confirm. Tier can also go down when membership
 * is recomputed after cancel (replay remaining confirms).
 */
export function applyGuestConfirmProgress(input: {
  currentTier: GuestTier;
  progressBooks: number;
  progressGmv: number;
  lifetimeBooks: number;
  lifetimeGmv: number;
  addAmountCollected: number;
  tiers: GuestTier[];
}): GuestProgressState {
  return applyGuestProgress({
    currentTier: input.currentTier,
    progressBooks: input.progressBooks,
    progressGmv: input.progressGmv,
    lifetimeBooks: input.lifetimeBooks,
    lifetimeGmv: input.lifetimeGmv,
    addBooks: 1,
    addGmv: input.addAmountCollected,
    tiers: input.tiers,
  });
}

/**
 * Replay guest confirms in order (amountCollected per booking).
 * Used after cancel so tier/progress can demote correctly.
 */
export function recomputeGuestFromCollectedAmounts(
  amountsCollected: number[],
  tiers: GuestTier[]
): {
  currentTier: GuestTier;
  progressBooks: number;
  progressGmv: number;
  lifetimeBooks: number;
  lifetimeGmv: number;
} {
  const sorted = [...tiers].sort((a, b) => a.sort - b.sort);
  if (!sorted.length) {
    return {
      currentTier: {
        id: '',
        sort: 0,
        minBooks: 0,
        minGmv: 0,
      },
      progressBooks: 0,
      progressGmv: 0,
      lifetimeBooks: 0,
      lifetimeGmv: 0,
    };
  }

  let state = {
    currentTier: sorted[0],
    progressBooks: 0,
    progressGmv: 0,
    lifetimeBooks: 0,
    lifetimeGmv: 0,
    rankedUp: false as boolean,
  };

  for (const amount of amountsCollected) {
    state = applyGuestConfirmProgress({
      currentTier: state.currentTier,
      progressBooks: state.progressBooks,
      progressGmv: state.progressGmv,
      lifetimeBooks: state.lifetimeBooks,
      lifetimeGmv: state.lifetimeGmv,
      addAmountCollected: Number(amount || 0),
      tiers: sorted,
    });
  }

  return {
    currentTier: state.currentTier,
    progressBooks: state.progressBooks,
    progressGmv: state.progressGmv,
    lifetimeBooks: state.lifetimeBooks,
    lifetimeGmv: state.lifetimeGmv,
  };
}
