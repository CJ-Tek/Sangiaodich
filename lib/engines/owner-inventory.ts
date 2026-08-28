import { createServiceClient } from '@/lib/supabase/server';
import { isPastDateOnly } from '@/lib/dates';
import { isNightBlocked, type DateRange } from '@/lib/engines/inventory';
import { loadAssetNightBoard } from '@/lib/engines/asset-night-board';

export async function assertOwnerAsset(
  ownerId: string,
  assetId: string
): Promise<{ ok: true } | { error: 'NOT_FOUND' | 'FORBIDDEN' }> {
  const admin = createServiceClient();
  const { data: asset } = await admin
    .from('assets')
    .select('id, owner_id')
    .eq('id', assetId)
    .maybeSingle();
  if (!asset) return { error: 'NOT_FOUND' };
  if (asset.owner_id !== ownerId) return { error: 'FORBIDDEN' };
  return { ok: true };
}

export async function setAssetNightClosed(input: {
  ownerId: string;
  assetId: string;
  night: string;
  closed: boolean;
}): Promise<{ error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.night)) {
    return { error: 'INVALID_DATE' };
  }
  if (isPastDateOnly(input.night)) return { error: 'PAST_NIGHT' };

  const owned = await assertOwnerAsset(input.ownerId, input.assetId);
  if ('error' in owned) return { error: owned.error };

  const board = await loadAssetNightBoard(input.assetId);
  const locked: DateRange[] = board.confirmedStays.map((s) => ({
    checkIn: s.checkIn,
    checkOut: s.checkOut,
  }));
  const held: DateRange[] = board.holdStays.map((s) => ({
    checkIn: s.checkIn,
    checkOut: s.checkOut,
  }));
  if (input.closed && isNightBlocked(input.night, locked)) {
    return { error: 'LOCKED' };
  }
  if (input.closed && isNightBlocked(input.night, held)) {
    return { error: 'HOLD' };
  }

  const admin = createServiceClient();
  if (input.closed) {
    const { error } = await admin.from('asset_closed_nights').upsert(
      {
        asset_id: input.assetId,
        night: input.night,
        created_by: input.ownerId,
      },
      { onConflict: 'asset_id,night' }
    );
    if (error) return { error: error.message };
    return {};
  }

  const { error } = await admin
    .from('asset_closed_nights')
    .delete()
    .eq('asset_id', input.assetId)
    .eq('night', input.night);
  if (error) return { error: error.message };
  return {};
}

export async function setAssetNightlyCost(input: {
  ownerId: string;
  assetId: string;
  night: string;
  cost: number | null;
}): Promise<{ error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.night)) {
    return { error: 'INVALID_DATE' };
  }
  if (isPastDateOnly(input.night)) return { error: 'PAST_NIGHT' };

  const owned = await assertOwnerAsset(input.ownerId, input.assetId);
  if ('error' in owned) return { error: owned.error };

  const admin = createServiceClient();
  if (input.cost == null || input.cost < 0) {
    const { error } = await admin
      .from('asset_nightly_costs')
      .delete()
      .eq('asset_id', input.assetId)
      .eq('night', input.night);
    if (error) return { error: error.message };
    return {};
  }

  const { error } = await admin.from('asset_nightly_costs').upsert(
    {
      asset_id: input.assetId,
      night: input.night,
      cost: Math.round(input.cost),
      updated_by: input.ownerId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'asset_id,night' }
  );
  if (error) return { error: error.message };
  return {};
}
