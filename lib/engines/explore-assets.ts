import { unstable_cache } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { AssetCardData } from '@/components/marketplace/AssetCard';
import { escapeIlikePattern } from '@/lib/phone/vn-search';

/**
 * Villa browsing shared by the public marketplace and the guest dashboard.
 * Only the first image is rendered, so the database picks it instead of
 * shipping every image row for every asset.
 */
const ASSET_COLUMNS =
  'id, slug, title, location, capacity, bedrooms, bathrooms, property_type, asset_images(url, sort_order)';

export const EXPLORE_PAGE_SIZE = 12;

export type ExploreAssetRow = {
  id: string;
  slug: string;
  title: string;
  location: string;
  capacity: number;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: string | null;
  asset_images: { url: string; sort_order: number }[] | null;
};

export type ExploreAssetsPage = {
  assets: ExploreAssetRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function parseExplorePage(raw?: string | string[]): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), 10_000);
}

function toPageResult(
  assets: ExploreAssetRow[],
  total: number,
  page: number,
  pageSize: number
): ExploreAssetsPage {
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / pageSize));
  const safePage = Math.min(page, totalPages);
  return {
    assets,
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

async function fetchExplorePage(input: {
  keyword?: string;
  tags?: string[];
  page: number;
  pageSize: number;
  /** Service role for the unfiltered cached path; cookie client otherwise. */
  useServiceRole?: boolean;
}): Promise<ExploreAssetsPage> {
  const pageSize = Math.min(Math.max(input.pageSize, 1), 48);
  const page = Math.max(input.page, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const keyword = input.keyword?.trim();
  const tags = input.tags ?? [];

  const client = input.useServiceRole
    ? createServiceClient()
    : await createClient();

  let query = client
    .from('assets')
    .select(ASSET_COLUMNS, { count: 'exact' })
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .order('sort_order', { ascending: true, foreignTable: 'asset_images' })
    .limit(1, { foreignTable: 'asset_images' })
    .range(from, to);

  if (keyword) {
    const escaped = escapeIlikePattern(keyword);
    query = query.or(
      `title.ilike.%${escaped}%,location.ilike.%${escaped}%`
    );
  }
  if (tags.length) {
    query = query.contains('tags', tags);
  }

  const result = await query;
  const total = result.count ?? 0;
  const assets = (result.data || []) as ExploreAssetRow[];

  // Out-of-range page (e.g. stale bookmark): return last page instead of empty.
  if (page > 1 && assets.length === 0 && total > 0) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return fetchExplorePage({
      ...input,
      page: totalPages,
      pageSize,
    });
  }

  return toPageResult(assets, total, page, pageSize);
}

const getDefaultAssetsPageCached = unstable_cache(
  async (page: number, pageSize: number) =>
    fetchExplorePage({ page, pageSize, useServiceRole: true }),
  ['marketplace-assets-page-v1'],
  { revalidate: 60 }
);

/** Unfiltered listing is cached per page; filtered listings always hit the DB. */
export async function loadExploreAssets(input: {
  keyword?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
}): Promise<ExploreAssetsPage> {
  const page = Math.max(input.page ?? 1, 1);
  const pageSize = input.pageSize ?? EXPLORE_PAGE_SIZE;
  const keyword = input.keyword?.trim();
  const tags = input.tags ?? [];

  if (!keyword && tags.length === 0) {
    return getDefaultAssetsPageCached(page, pageSize);
  }

  return fetchExplorePage({
    keyword,
    tags,
    page,
    pageSize,
  });
}

/** Build list URL with filters; omit page=1 to keep links clean. */
export function exploreListHref(
  basePath: string,
  opts: { q?: string; tags?: string[]; page?: number }
): string {
  const params = new URLSearchParams();
  if (opts.q) params.set('q', opts.q);
  for (const tag of opts.tags ?? []) params.append('tags', tag);
  if (opts.page && opts.page > 1) params.set('page', String(opts.page));
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}

/** `hrefBase` decides whether cards stay inside a dashboard or go public. */
export function toAssetCardData(
  row: ExploreAssetRow,
  hrefBase?: string
): AssetCardData {
  const images = row.asset_images || [];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    location: row.location,
    capacity: row.capacity,
    bedrooms: Number(row.bedrooms) || undefined,
    bathrooms: Number(row.bathrooms) || undefined,
    propertyType:
      row.property_type === 'APARTMENT' || row.property_type === 'VILLA'
        ? row.property_type
        : undefined,
    imageUrl: images[0]?.url,
    hrefBase,
  };
}
