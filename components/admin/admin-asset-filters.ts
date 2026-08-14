import { matchesAssetSearch } from '@/lib/engines/asset-search';
import type { AssetStatus } from '@/lib/types';

export const ADMIN_ASSET_FILTERS = [
  'all',
  'pending',
  'active',
  'reject',
  'suspend',
] as const;

export type AdminAssetFilterStatus = (typeof ADMIN_ASSET_FILTERS)[number];

export const ADMIN_ASSET_FILTER_DB: Record<
  Exclude<AdminAssetFilterStatus, 'all'>,
  AssetStatus
> = {
  pending: 'PENDING_REVIEW',
  active: 'ACTIVE',
  reject: 'REJECTED',
  suspend: 'SUSPENDED',
};

/** Drafts stay on the owner until Submit for review. */
export const ADMIN_VISIBLE_ASSET_STATUSES: AssetStatus[] = [
  'PENDING_REVIEW',
  'ACTIVE',
  'REJECTED',
  'SUSPENDED',
  'INACTIVE',
];

export function parseAdminAssetFilter(
  raw?: string | null
): AdminAssetFilterStatus {
  if (raw && (ADMIN_ASSET_FILTERS as readonly string[]).includes(raw)) {
    return raw as AdminAssetFilterStatus;
  }
  return 'pending';
}

export function matchesAdminAssetQuery(
  query: string,
  asset: {
    id: string;
    slug: string;
    title: string;
    location: string;
    description: string | null;
    ownerName: string;
  }
): boolean {
  const raw = query.trim().toLowerCase();
  if (!raw) return true;
  if (matchesAssetSearch(query, asset)) return true;
  if (asset.ownerName.toLowerCase().includes(raw)) return true;
  if ((asset.description || '').toLowerCase().includes(raw)) return true;
  return false;
}
