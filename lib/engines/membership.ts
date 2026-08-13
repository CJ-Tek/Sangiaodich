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

/** Place an already-summed sale volume on the tier ladder. */
export function resolveSaleVolumeTier(
  lifetimeCostVolume: number,
  tiers: SaleTier[]
): { lifetimeCostVolume: number; tier: SaleTier | null } {
  const clamped = Math.max(0, Number(lifetimeCostVolume) || 0);
  if (!tiers.length) {
    return { lifetimeCostVolume: clamped, tier: null };
  }
  return { lifetimeCostVolume: clamped, tier: pickSaleTier(clamped, tiers) };
}

/** Rebuild sale volume + tier from remaining confirmed booking base costs. */
export function recomputeSaleFromBaseCosts(
  baseCosts: number[],
  tiers: SaleTier[]
): { lifetimeCostVolume: number; tier: SaleTier | null } {
  return resolveSaleVolumeTier(
    baseCosts.reduce((sum, cost) => sum + Number(cost || 0), 0),
    tiers
  );
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
