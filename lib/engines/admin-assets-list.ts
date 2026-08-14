import { createClient } from '@/lib/supabase/server';
import {
  ADMIN_ASSET_FILTER_DB,
  ADMIN_VISIBLE_ASSET_STATUSES,
  parseAdminAssetFilter,
  type AdminAssetFilterStatus,
} from '@/components/admin/admin-asset-filters';
import { escapeIlikePattern } from '@/lib/phone/vn-search';
import {
  DASHBOARD_ASSET_PAGE_SIZE,
  parseDashboardPage,
} from '@/lib/supabase/query-guard';
import type { AssetStatus } from '@/lib/types';

const ASSET_COLUMNS =
  'id, title, description, status, location, slug, property_type, owner_id, profiles!assets_owner_id_fkey(full_name), asset_images(url, sort_order)';

export type AdminAssetListRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  location: string;
  slug: string;
  property_type: string | null;
  owner_id: string;
  profiles: { full_name?: string } | null;
  asset_images: { url: string; sort_order: number }[] | null;
};

export type AdminAssetsPage = {
  assets: AdminAssetListRow[];
  counts: Record<AdminAssetFilterStatus, number>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
  status: AdminAssetFilterStatus;
};

async function countVisible(
  status?: Exclude<AdminAssetFilterStatus, 'all'>
): Promise<number> {
  const admin = await createClient();
  let query = admin
    .from('assets')
    .select('id', { count: 'exact', head: true })
    .in('status', ADMIN_VISIBLE_ASSET_STATUSES);
  if (status) {
    query = query.eq('status', ADMIN_ASSET_FILTER_DB[status]);
  }
  const { count } = await query;
  return count ?? 0;
}

async function ownerIdsMatchingName(q: string): Promise<string[]> {
  const admin = await createClient();
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'OWNER')
    .ilike('full_name', `%${escapeIlikePattern(q)}%`)
    .limit(50);
  return (data || []).map((row) => row.id);
}

function searchOrFilter(q: string, ownerIds: string[]): string {
  const escaped = escapeIlikePattern(q);
  const parts = [
    `title.ilike.%${escaped}%`,
    `location.ilike.%${escaped}%`,
    `description.ilike.%${escaped}%`,
    `slug.ilike.%${escaped}%`,
  ];
  if (ownerIds.length) {
    parts.push(`owner_id.in.(${ownerIds.join(',')})`);
  }
  return parts.join(',');
}

export async function listAdminAssets(input: {
  q?: string;
  status?: string;
  page?: string | string[];
}): Promise<AdminAssetsPage> {
  const q = (input.q || '').trim();
  const status = parseAdminAssetFilter(input.status);
  const pageSize = DASHBOARD_ASSET_PAGE_SIZE;
  const requested = parseDashboardPage(input.page);

  const [all, pending, active, reject, suspend, ownerIds] = await Promise.all([
    countVisible(),
    countVisible('pending'),
    countVisible('active'),
    countVisible('reject'),
    countVisible('suspend'),
    q ? ownerIdsMatchingName(q) : Promise.resolve([] as string[]),
  ]);

  const counts: Record<AdminAssetFilterStatus, number> = {
    all,
    pending,
    active,
    reject,
    suspend,
  };

  return fetchAdminAssetsPage({
    q,
    status,
    page: requested,
    pageSize,
    counts,
    ownerIds,
  });
}

async function fetchAdminAssetsPage(input: {
  q: string;
  status: AdminAssetFilterStatus;
  page: number;
  pageSize: number;
  counts: Record<AdminAssetFilterStatus, number>;
  ownerIds: string[];
  retried?: boolean;
}): Promise<AdminAssetsPage> {
  const admin = await createClient();
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;
  const statuses: AssetStatus[] =
    input.status === 'all'
      ? ADMIN_VISIBLE_ASSET_STATUSES
      : [ADMIN_ASSET_FILTER_DB[input.status]];

  let query = admin
    .from('assets')
    .select(ASSET_COLUMNS, { count: 'exact' })
    .in('status', statuses)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (input.q) {
    query = query.or(searchOrFilter(input.q, input.ownerIds));
  }

  const { data, count } = await query;
  const total = count ?? 0;
  const assets = (data || []) as AdminAssetListRow[];
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / input.pageSize));

  if (!input.retried && input.page > 1 && assets.length === 0 && total > 0) {
    return fetchAdminAssetsPage({
      ...input,
      page: totalPages,
      retried: true,
    });
  }

  return {
    assets,
    counts: input.counts,
    total,
    page: Math.min(input.page, totalPages),
    pageSize: input.pageSize,
    totalPages,
    q: input.q,
    status: input.status,
  };
}
