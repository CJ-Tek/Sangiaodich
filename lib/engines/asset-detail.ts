import { createClient } from '@/lib/supabase/server';
import { activeStayRanges } from '@/lib/engines/inventory';

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

  const { data: ranges } = await admin.rpc('asset_confirmed_ranges', {
    p_asset_id: asset.id,
  });

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
    confirmedRanges: activeStayRanges(
      ((ranges || []) as { check_in: string; check_out: string }[]).map((r) => ({
        checkIn: r.check_in,
        checkOut: r.check_out,
      }))
    ),
  };
}
