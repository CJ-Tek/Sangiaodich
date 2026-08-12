/** Mã villa gửi Guest → Sale (6 hex cuối UUID — seed local khác nhau ở đuôi). */
export function assetPublicCode(assetId: string): string {
  const compact = assetId.replace(/-/g, '').toLowerCase();
  return compact.slice(-6);
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, '');
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
  const raw = query.trim().toLowerCase();
  if (!raw) return true;
  if (asset.title.toLowerCase().includes(raw)) return true;
  if (asset.location.toLowerCase().includes(raw)) return true;
  if (asset.slug.toLowerCase().includes(raw)) return true;

  const compact = normalizeQuery(query);
  if (compact.length < 4) return false;
  const idCompact = asset.id.replace(/-/g, '').toLowerCase();
  const code = assetPublicCode(asset.id);
  if (code === compact || compact.endsWith(code) || code.startsWith(compact)) {
    return true;
  }
  if (idCompact.endsWith(compact) || idCompact.includes(compact)) return true;
  if (asset.id.toLowerCase().includes(raw)) return true;
  return false;
}
