import { createServiceClient } from '@/lib/supabase/server';
import {
  RATING_COMMENT_MAX,
  canEditSaleRating,
  clampRatingScore,
  ratingOverall,
  saleRatingGate,
} from '@/lib/engines/sale-rating-math';

export {
  RATING_COMMENT_MAX,
  canEditSaleRating,
  clampRatingScore,
  ratingOverall,
  saleRatingGate,
} from '@/lib/engines/sale-rating-math';

export type SaleRatingScores = {
  scorePayment: number;
  scoreHandling: number;
  scoreCommunication: number;
};

export type SaleRatingRecord = SaleRatingScores & {
  id: string;
  bookingId: string;
  ownerId: string;
  saleId: string;
  comment: string | null;
  overall: number;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
};

export type SaleRatingAggregate = {
  saleId: string;
  ratingCount: number;
  avgPayment: number;
  avgHandling: number;
  avgCommunication: number;
  avgOverall: number;
};

export type SaleRatingComment = {
  saleId: string;
  ownerName: string;
  comment: string;
  overall: number;
  createdAt: string;
};

function mapRating(row: {
  id: string;
  booking_id: string;
  owner_id: string;
  sale_id: string;
  score_payment: number;
  score_handling: number;
  score_communication: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}): SaleRatingRecord {
  return {
    id: row.id,
    bookingId: row.booking_id,
    ownerId: row.owner_id,
    saleId: row.sale_id,
    scorePayment: Number(row.score_payment),
    scoreHandling: Number(row.score_handling),
    scoreCommunication: Number(row.score_communication),
    comment: row.comment,
    overall: ratingOverall(
      Number(row.score_payment),
      Number(row.score_handling),
      Number(row.score_communication)
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    canEdit: canEditSaleRating(row.created_at),
  };
}

export async function upsertSaleRating(input: {
  bookingId: string;
  ownerId: string;
  scorePayment: unknown;
  scoreHandling: unknown;
  scoreCommunication: unknown;
  comment?: string | null;
}): Promise<{ rating: SaleRatingRecord } | { error: string }> {
  const scorePayment = clampRatingScore(input.scorePayment);
  const scoreHandling = clampRatingScore(input.scoreHandling);
  const scoreCommunication = clampRatingScore(input.scoreCommunication);
  if (
    scorePayment == null ||
    scoreHandling == null ||
    scoreCommunication == null
  ) {
    return { error: 'INVALID_SCORE' };
  }

  const comment = input.comment?.trim()
    ? input.comment.trim().slice(0, RATING_COMMENT_MAX)
    : null;

  const admin = createServiceClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, sale_id, assets(owner_id)')
    .eq('id', input.bookingId)
    .maybeSingle();

  if (!booking) return { error: 'NOT_FOUND' };

  const asset = booking.assets as unknown as
    | { owner_id: string }
    | { owner_id: string }[]
    | null;
  const ownerId = Array.isArray(asset) ? asset[0]?.owner_id : asset?.owner_id;

  const { data: existing } = await admin
    .from('sale_ratings')
    .select(
      'id, booking_id, owner_id, sale_id, score_payment, score_handling, score_communication, comment, created_at, updated_at'
    )
    .eq('booking_id', input.bookingId)
    .maybeSingle();

  const gated = saleRatingGate({
    bookingStatus: booking.status,
    assetOwnerId: ownerId,
    actorOwnerId: input.ownerId,
    existing: existing
      ? { ownerId: existing.owner_id, createdAt: existing.created_at }
      : null,
  });
  if (gated) return { error: gated };

  const { data, error } = await admin
    .from('sale_ratings')
    .insert({
      booking_id: input.bookingId,
      owner_id: input.ownerId,
      sale_id: booking.sale_id,
      score_payment: scorePayment,
      score_handling: scoreHandling,
      score_communication: scoreCommunication,
      comment,
    })
    .select(
      'id, booking_id, owner_id, sale_id, score_payment, score_handling, score_communication, comment, created_at, updated_at'
    )
    .single();
  if (error || !data) return { error: error?.message || 'INSERT_FAILED' };

  await admin.rpc('refresh_sale_rating_aggregate', {
    p_sale_id: booking.sale_id,
  });

  return { rating: mapRating(data) };
}

export async function loadRatingsByBookingIds(
  bookingIds: string[]
): Promise<Map<string, SaleRatingRecord>> {
  const map = new Map<string, SaleRatingRecord>();
  const unique = [...new Set(bookingIds.filter(Boolean))];
  if (!unique.length) return map;
  const admin = createServiceClient();
  const { data } = await admin
    .from('sale_ratings')
    .select(
      'id, booking_id, owner_id, sale_id, score_payment, score_handling, score_communication, comment, created_at, updated_at'
    )
    .in('booking_id', unique)
    .limit(unique.length);
  for (const row of data || []) {
    map.set(row.booking_id, mapRating(row));
  }
  return map;
}

export async function loadSaleRatingAggregates(
  saleIds: string[]
): Promise<Map<string, SaleRatingAggregate>> {
  const map = new Map<string, SaleRatingAggregate>();
  const unique = [...new Set(saleIds.filter(Boolean))];
  if (!unique.length) return map;
  const admin = createServiceClient();
  const { data } = await admin
    .from('sale_rating_aggregates')
    .select(
      'sale_id, rating_count, avg_payment, avg_handling, avg_communication, avg_overall'
    )
    .in('sale_id', unique)
    .limit(unique.length);
  for (const row of data || []) {
    map.set(row.sale_id, {
      saleId: row.sale_id,
      ratingCount: Number(row.rating_count || 0),
      avgPayment: Number(row.avg_payment || 0),
      avgHandling: Number(row.avg_handling || 0),
      avgCommunication: Number(row.avg_communication || 0),
      avgOverall: Number(row.avg_overall || 0),
    });
  }
  return map;
}

export async function loadSaleRatingComments(input: {
  saleIds: string[];
  limit?: number;
}): Promise<SaleRatingComment[]> {
  const unique = [...new Set(input.saleIds.filter(Boolean))];
  if (!unique.length) return [];
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 50);
  const admin = createServiceClient();
  const { data: rows } = await admin
    .from('sale_ratings')
    .select(
      'sale_id, owner_id, score_payment, score_handling, score_communication, comment, created_at'
    )
    .in('sale_id', unique)
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  const rated = (rows || []).filter((r) => r.comment?.trim());
  const ownerIds = [...new Set(rated.map((r) => r.owner_id))];
  const nameById = new Map<string, string>();
  if (ownerIds.length) {
    const { data: owners } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', ownerIds)
      .limit(ownerIds.length);
    for (const o of owners || []) {
      nameById.set(o.id, o.full_name || 'Owner');
    }
  }

  return rated.map((r) => ({
    saleId: r.sale_id,
    ownerName: nameById.get(r.owner_id) || 'Owner',
    comment: String(r.comment).trim(),
    overall: ratingOverall(
      Number(r.score_payment),
      Number(r.score_handling),
      Number(r.score_communication)
    ),
    createdAt: r.created_at,
  }));
}
