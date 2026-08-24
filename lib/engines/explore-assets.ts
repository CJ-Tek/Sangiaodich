import { unstable_cache } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { AssetCardData } from '@/components/marketplace/AssetCard';
import { escapeIlikePattern } from '@/lib/phone/vn-search';
import {
  costColumnsForExplore,
  hasExploreQueryFilters,
  type ExploreListOpts,
} from '@/lib/engines/explore-filters';

export type { ExploreListOpts } from '@/lib/engines/explore-filters';

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

/**
 * A page number straight from the query string becomes an OFFSET, and Postgres
 * walks every skipped row. The ceiling caps that walk; anything past the real
 * end is answered by the last-page retry in `fetchExplorePage` instead.
 */
export const MAX_EXPLORE_PAGE = 1_000;

export function parseExplorePage(raw?: string | string[]): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), MAX_EXPLORE_PAGE);
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
  budgetMax?: number;
  guests?: number;
  checkIn?: string;
  checkOut?: string;
  page: number;
  pageSize: number;
  /** Service role for the unfiltered cached path and any cost-column filter. */
  useServiceRole?: boolean;
  /** Guards the last-page retry against recursing on an estimated total. */
  retried?: boolean;
}): Promise<ExploreAssetsPage> {
  const pageSize = Math.min(Math.max(input.pageSize, 1), 48);
  const page = Math.max(input.page, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const keyword = input.keyword?.trim();
  const tags = input.tags ?? [];
  const budgetMax = input.budgetMax;
  const guests = input.guests;

  const client = input.useServiceRole
    ? createServiceClient()
    : await createClient();

  // Inner-join costs only when filtering by budget. Select `asset_id` so
  // PostgREST can join; strip it before the row leaves this function.
  const select = budgetMax
    ? `${ASSET_COLUMNS}, asset_costs!inner(asset_id)`
    : ASSET_COLUMNS;

  let query = client
    .from('assets')
    // `exact` runs a COUNT(*) over every matching row on each page load, and
    // the filtered path is not cached. `estimated` stays exact while the result
    // set is small and falls back to the planner once it is not.
    .select(select, { count: 'estimated' })
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
  if (guests) {
    query = query.gte('capacity', guests);
  }
  if (budgetMax) {
    const columns = costColumnsForExplore({
      checkIn: input.checkIn,
      checkOut: input.checkOut,
    });
    if (columns.weekday) {
      query = query.lt('asset_costs.cost_weekday', budgetMax);
    }
    if (columns.weekend) {
      query = query.lt('asset_costs.cost_weekend', budgetMax);
    }
  }

  const result = await query;
  const total = result.count ?? 0;
  const assets = stripCostJoin(result.data);

  // Out-of-range page (e.g. stale bookmark): return last page instead of empty.
  if (!input.retried && page > 1 && assets.length === 0 && total > 0) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return fetchExplorePage({
      ...input,
      page: totalPages,
      pageSize,
      retried: true,
    });
  }

  return toPageResult(assets, total, page, pageSize);
}

function stripCostJoin(data: unknown): ExploreAssetRow[] {
  return (Array.isArray(data) ? data : []).map((row) => {
    if (!row || typeof row !== 'object') return row as ExploreAssetRow;
    const copy = { ...(row as Record<string, unknown>) };
    delete copy.asset_costs;
    return copy as unknown as ExploreAssetRow;
  });
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
  budgetMax?: number;
  guests?: number;
  checkIn?: string;
  checkOut?: string;
  page?: number;
  pageSize?: number;
}): Promise<ExploreAssetsPage> {
  const page = Math.max(input.page ?? 1, 1);
  const pageSize = input.pageSize ?? EXPLORE_PAGE_SIZE;
  const keyword = input.keyword?.trim();
  const tags = input.tags ?? [];
  const budgetMax = input.budgetMax;
  const guests = input.guests;

  if (
    !hasExploreQueryFilters({ keyword, tags, budgetMax, guests })
  ) {
    return getDefaultAssetsPageCached(page, pageSize);
  }

  return fetchExplorePage({
    keyword,
    tags,
    budgetMax,
    guests,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    page,
    pageSize,
    // Guest RLS cannot read asset_costs; service role filters without
    // returning the amounts.
    useServiceRole: Boolean(budgetMax),
  });
}

/** Build list URL with filters; omit page=1 to keep links clean. */
export function exploreListHref(
  basePath: string,
  opts: ExploreListOpts
): string {
  const params = new URLSearchParams();
  if (opts.q) params.set('q', opts.q);
  for (const tag of opts.tags ?? []) params.append('tags', tag);
  if (opts.budgetMin) params.set('budgetMin', String(opts.budgetMin));
  if (opts.budgetMax) params.set('budgetMax', String(opts.budgetMax));
  if (opts.guests) params.set('guests', String(opts.guests));
  if (opts.checkIn) params.set('checkIn', opts.checkIn);
  if (opts.checkOut) params.set('checkOut', opts.checkOut);
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
