import { createServiceClient } from '@/lib/supabase/server';
import { LIST_VIEW_LIMIT, warnIfTruncated } from '@/lib/supabase/query-guard';

export type AssetOwnerContact = {
  ownerName: string;
  ownerPhone: string | null;
  images: { url: string; sort_order: number }[];
};

/**
 * Owner name/phone + all photos for calendar columns.
 * Uses the service client: Sale RLS only exposes Owner profiles after a booking.
 * Does not read `ui_mode` or payout/STK fields.
 */
export async function loadAssetOwnerContacts(
  assetIds: string[]
): Promise<Map<string, AssetOwnerContact>> {
  const map = new Map<string, AssetOwnerContact>();
  if (!assetIds.length) return map;

  const admin = createServiceClient();
  const { data: assets, error } = await admin
    .from('assets')
    .select('id, owner_id, asset_images(url, sort_order)')
    .in('id', assetIds)
    .limit(LIST_VIEW_LIMIT);

  if (error) {
    throw new Error(`Asset owner contacts failed: ${error.message}`);
  }
  warnIfTruncated('asset-owner-contacts.assets', assets);

  const ownerIds = [
    ...new Set(
      (assets || []).map((row) => row.owner_id as string).filter(Boolean)
    ),
  ];

  const owners = new Map<string, { full_name: string; phone: string | null }>();
  if (ownerIds.length) {
    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', ownerIds)
      .limit(ownerIds.length);
    if (profileError) {
      throw new Error(`Owner profiles failed: ${profileError.message}`);
    }
    for (const row of profiles || []) {
      owners.set(row.id, {
        full_name: row.full_name || 'Owner',
        phone: row.phone || null,
      });
    }
  }

  for (const row of assets || []) {
    const owner = owners.get(row.owner_id);
    const images = (
      (row.asset_images || []) as { url: string; sort_order: number }[]
    ).sort((a, b) => a.sort_order - b.sort_order);
    map.set(row.id, {
      ownerName: owner?.full_name || 'Owner',
      ownerPhone: owner?.phone ?? null,
      images,
    });
  }

  return map;
}
