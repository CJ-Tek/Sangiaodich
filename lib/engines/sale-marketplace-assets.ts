import { createClient } from '@/lib/supabase/server';
import { escapeIlikePattern } from '@/lib/phone/vn-search';
import { assetPublicCode } from '@/lib/engines/asset-search';
import {
  EXPLORE_PAGE_SIZE,
  parseExplorePage,
} from '@/lib/engines/explore-assets';

export { EXPLORE_PAGE_SIZE, parseExplorePage };

const SALE_ASSET_COLUMNS =
  'id, slug, title, location, capacity, bedrooms, bathrooms, property_type, asset_images(url, sort_order), asset_costs(cost_weekday, cost_weekend)';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SaleMarketplaceAssetRow = {
  id: string;
  slug: string;
  title: string;
  location: string;
  capacity: number;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: string | null;
  asset_images: { url: string; sort_order: number }[] | null;
  asset_costs: {
    cost_weekday: number;
    cost_weekend: number;
  } | null;
};

export type SaleMarketplacePage = {
  assets: SaleMarketplaceAssetRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function looksLikePublicCode(q: string): boolean {
  const compact = q.trim().toLowerCase().replace(/\s+/g, '');
  return /^[0-9a-f]{4,32}$/.test(compact) && compact.length >= 4;
}

function toPageResult(
  assets: SaleMarketplaceAssetRow[],
  total: number,
  page: number,
  pageSize: number
): SaleMarketplacePage {
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / pageSize));
  return {
    assets,
    total,
    page: Math.min(page, totalPages),
    pageSize,
    totalPages,
  };
}

/**
 * ACTIVE assets for the sale marketplace, paginated in the database.
 * Search hits title / location / slug / public_code (and exact UUID).
 */
export async function loadSaleMarketplaceAssets(input: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<SaleMarketplacePage> {
  const pageSize = Math.min(
    Math.max(input.pageSize ?? EXPLORE_PAGE_SIZE, 1),
    48
  );
  const page = Math.max(input.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const q = input.q?.trim() || '';

  const admin = await createClient();
  let query = admin
    .from('assets')
    .select(SALE_ASSET_COLUMNS, { count: 'exact' })
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .order('sort_order', { ascending: true, foreignTable: 'asset_images' })
    .limit(1, { foreignTable: 'asset_images' })
    .range(from, to);

  if (q) {
    const escaped = escapeIlikePattern(q);
    const parts = [
      `title.ilike.%${escaped}%`,
      `location.ilike.%${escaped}%`,
      `slug.ilike.%${escaped}%`,
    ];
    if (UUID_RE.test(q)) {
      parts.push(`id.eq.${q}`);
    } else if (looksLikePublicCode(q)) {
      const compact = q.trim().toLowerCase().replace(/\s+/g, '');
      parts.push(`public_code.ilike.%${escapeIlikePattern(compact)}%`);
    }
    query = query.or(parts.join(','));
  }

  const result = await query;

  // Column missing / filter rejected — fall back to in-memory code match.
  if (result.error && q && looksLikePublicCode(q)) {
    const fallback = await loadSaleMarketplaceAssetsByCodeFallback({
      q,
      page,
      pageSize,
    });
    if (fallback) return fallback;
  }

  if (result.error) {
    console.error('[sale-marketplace] list failed', result.error.message);
    return toPageResult([], 0, 1, pageSize);
  }

  const assets = (result.data || []) as unknown as SaleMarketplaceAssetRow[];
  const total = result.count ?? 0;

  if (page > 1 && assets.length === 0 && total > 0) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return loadSaleMarketplaceAssets({
      q,
      page: totalPages,
      pageSize,
    });
  }

  return toPageResult(assets, total, page, pageSize);
}

/** Last-resort when public_code is unavailable — scan ACTIVE then page. */
async function loadSaleMarketplaceAssetsByCodeFallback(input: {
  q: string;
  page: number;
  pageSize: number;
}): Promise<SaleMarketplacePage | null> {
  const admin = await createClient();
  const { data, error } = await admin
    .from('assets')
    .select(SALE_ASSET_COLUMNS)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .order('sort_order', { ascending: true, foreignTable: 'asset_images' })
    .limit(1, { foreignTable: 'asset_images' });

  if (error || !data) return null;

  const compact = input.q.trim().toLowerCase().replace(/\s+/g, '');
  const raw = input.q.trim().toLowerCase();
  const matched = (data as unknown as SaleMarketplaceAssetRow[]).filter((a) => {
    if (a.title.toLowerCase().includes(raw)) return true;
    if (a.location.toLowerCase().includes(raw)) return true;
    if (a.slug.toLowerCase().includes(raw)) return true;
    const code = assetPublicCode(a.id);
    const idCompact = a.id.replace(/-/g, '').toLowerCase();
    return (
      code === compact ||
      code.startsWith(compact) ||
      compact.endsWith(code) ||
      idCompact.includes(compact)
    );
  });

  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / input.pageSize));
  const page = Math.min(input.page, totalPages);
  const start = (page - 1) * input.pageSize;
  return toPageResult(
    matched.slice(start, start + input.pageSize),
    total,
    page,
    input.pageSize
  );
}
