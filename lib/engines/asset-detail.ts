import { createClient } from '@/lib/supabase/server';
import { loadAssetNightBoard } from '@/lib/engines/asset-night-board';
import {
  stayRanges,
  type AssetNightBoard,
} from '@/lib/engines/inventory';

export type AssetDetailRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string | null;
  tags: string[];
  images: { url: string; sort_order: number }[];
  confirmedRanges: { checkIn: string; checkOut: string }[];
  nightBoard: AssetNightBoard;
};

/**
 * Villa detail shared by the public asset page and the guest dashboard, so
 * both render the same data without duplicating the query.
 */
export async function loadAssetDetail(
  slug: string
): Promise<AssetDetailRecord | null> {
  const admin = await createClient();

  const { data: asset } = await admin
    .from('assets')
    .select(
      'id, slug, title, description, location, capacity, bedrooms, bathrooms, property_type, tags, status, asset_images(url, sort_order)'
    )
    .eq('slug', slug)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!asset) return null;

  const board = await loadAssetNightBoard(asset.id);

  return {
    id: asset.id,
    slug: asset.slug,
    title: asset.title,
    description: asset.description,
    location: asset.location,
    capacity: asset.capacity,
    bedrooms: Number(asset.bedrooms) || 0,
    bathrooms: Number(asset.bathrooms) || 0,
    propertyType: asset.property_type,
    tags: Array.isArray(asset.tags) ? (asset.tags as string[]) : [],
    images: (asset.asset_images || []) as { url: string; sort_order: number }[],
    confirmedRanges: stayRanges(board.confirmedStays),
    nightBoard: board,
  };
}
