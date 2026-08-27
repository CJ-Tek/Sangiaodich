export const RATING_COMMENT_MAX = 1000;

export function clampRatingScore(n: unknown): number | null {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v) || v < 1 || v > 10) return null;
  return v;
}

export function ratingOverall(
  scorePayment: number,
  scoreHandling: number,
  scoreCommunication: number
): number {
  return (
    Math.round(
      ((Number(scorePayment) +
        Number(scoreHandling) +
        Number(scoreCommunication)) /
        3) *
        10
    ) / 10
  );
}

/** One rating per booking — never editable after insert. */
export function canEditSaleRating(_createdAt?: string): boolean {
  return false;
}

/** Shared checks for create/update — unit-tested without the database. */
export function saleRatingGate(input: {
  bookingStatus: string;
  assetOwnerId: string | null | undefined;
  actorOwnerId: string;
  existing?: { ownerId: string; createdAt: string } | null;
  nowMs?: number;
}): string | null {
  if (input.bookingStatus !== 'CHECKED_OUT') return 'NOT_CHECKED_OUT';
  if (!input.assetOwnerId || input.assetOwnerId !== input.actorOwnerId) {
    return 'FORBIDDEN';
  }
  if (input.existing) {
    if (input.existing.ownerId !== input.actorOwnerId) return 'FORBIDDEN';
    return 'LOCKED';
  }
  return null;
}
