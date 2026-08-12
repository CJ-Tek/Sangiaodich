export type SaleTier = {
  id: string;
  sort: number;
  minLifetimeCostVolume: number;
  costDiscountPercent: number;
};

export type GuestTier = {
  id: string;
  sort: number;
  minBooks: number;
  minGmv: number;
  discountPercent: number;
};

export function pickSaleTier(
  lifetimeCostVolume: number,
  tiers: SaleTier[]
): SaleTier {
  const sorted = [...tiers].sort((a, b) => a.sort - b.sort);
  let current = sorted[0];
  for (const tier of sorted) {
    if (lifetimeCostVolume >= tier.minLifetimeCostVolume) current = tier;
  }
  return current;
}

export function applySaleConfirmVolume(input: {
  lifetimeCostVolume: number;
  addBaseCost: number;
  tiers: SaleTier[];
}): { lifetimeCostVolume: number; tier: SaleTier } {
  const lifetimeCostVolume = input.lifetimeCostVolume + input.addBaseCost;
  return {
    lifetimeCostVolume,
    tier: pickSaleTier(lifetimeCostVolume, input.tiers),
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
}): {
  currentTier: GuestTier;
  progressBooks: number;
  progressGmv: number;
  lifetimeBooks: number;
  lifetimeGmv: number;
  rankedUp: boolean;
} {
  const sorted = [...input.tiers].sort((a, b) => a.sort - b.sort);
  const lifetimeBooks = input.lifetimeBooks + 1;
  const lifetimeGmv = input.lifetimeGmv + input.addAmountCollected;
  let progressBooks = input.progressBooks + 1;
  let progressGmv = input.progressGmv + input.addAmountCollected;
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

/** Rebuild sale volume + tier from remaining confirmed booking base costs. */
export function recomputeSaleFromBaseCosts(
  baseCosts: number[],
  tiers: SaleTier[]
): { lifetimeCostVolume: number; tier: SaleTier | null } {
  const lifetimeCostVolume = Math.max(
    0,
    baseCosts.reduce((sum, cost) => sum + Number(cost || 0), 0)
  );
  if (!tiers.length) {
    return { lifetimeCostVolume, tier: null };
  }
  return {
    lifetimeCostVolume,
    tier: pickSaleTier(lifetimeCostVolume, tiers),
  };
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
        discountPercent: 0,
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

export function guestDiscountFromTier(
  currentTierId: string | null,
  tiers: GuestTier[]
): number {
  const sorted = [...tiers].sort((a, b) => a.sort - b.sort);
  const tier = tiers.find((t) => t.id === currentTierId) ?? sorted[0];
  return tier?.discountPercent ?? 0;
}
