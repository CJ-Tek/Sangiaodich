import { foldVn } from '@/lib/search/vn-fold';

/** Mã villa gửi Guest → Sale (6 hex cuối UUID — seed local khác nhau ở đuôi). */
export function assetPublicCode(assetId: string): string {
  const compact = assetId.replace(/-/g, '').toLowerCase();
  return compact.slice(-6);
}

function normalizeQuery(q: string): string {
  return foldVn(q).replace(/\s+/g, '');
}

export function matchesAssetSearch(
  query: string,
  asset: {
    id: string;
    slug: string;
    title: string;
    location: string;
  }
): boolean {
  const raw = foldVn(query.trim());
  if (!raw) return true;
  if (foldVn(asset.title).includes(raw)) return true;
  if (foldVn(asset.location).includes(raw)) return true;
  if (foldVn(asset.slug).includes(raw)) return true;

  const compact = normalizeQuery(query);
  if (compact.length < 4) return false;
  const idCompact = asset.id.replace(/-/g, '').toLowerCase();
  const code = assetPublicCode(asset.id);
  if (code === compact || compact.endsWith(code) || code.startsWith(compact)) {
    return true;
  }
  if (idCompact.endsWith(compact) || idCompact.includes(compact)) return true;
  if (foldVn(asset.id).includes(raw)) return true;
  return false;
}
