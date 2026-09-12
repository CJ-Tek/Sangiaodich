import { matchesAssetSearch } from '@/lib/engines/asset-search';
import { foldVn } from '@/lib/search/vn-fold';
import { isVnCityId, locationMatchesCity } from '@/lib/geo/vn-cities';

function firstParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseNonNegInt(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

export const NIGHT_BOARD_SORTS = [
  'default',
  'title_asc',
  'title_desc',
  'price_asc',
  'price_desc',
  'beds_asc',
  'beds_desc',
] as const;

export type NightBoardSort = (typeof NIGHT_BOARD_SORTS)[number];

export type NightBoardFilterValues = {
  q: string;
  city: string | null;
  propertyType: string | null;
  priceMin: number | null;
  priceMax: number | null;
  minBedrooms: number | null;
  sort: NightBoardSort;
};

export type NightBoardSortableAsset = {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  property_type?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  asset_costs?: { cost_weekday?: number | null } | null;
  costWeekday?: number | null;
};

function parseSort(raw: string | undefined): NightBoardSort {
  const v = raw?.trim().toLowerCase();
  if (v && (NIGHT_BOARD_SORTS as readonly string[]).includes(v)) {
    return v as NightBoardSort;
  }
  return 'default';
}

export function parseNightBoardFilters(params: {
  q?: string | string[];
  city?: string | string[];
  type?: string | string[];
  priceMin?: string | string[];
  priceMax?: string | string[];
  beds?: string | string[];
  sort?: string | string[];
}): NightBoardFilterValues {
  const type = firstParam(params.type)?.trim().toUpperCase() || null;
  const cityRaw = firstParam(params.city)?.trim() || null;
  return {
    q: firstParam(params.q)?.trim() || '',
    city: isVnCityId(cityRaw) ? cityRaw : null,
    propertyType:
      type === 'VILLA' || type === 'APARTMENT' ? type : null,
    priceMin: parseNonNegInt(firstParam(params.priceMin)),
    priceMax: parseNonNegInt(firstParam(params.priceMax)),
    minBedrooms: parseNonNegInt(firstParam(params.beds)),
    sort: parseSort(firstParam(params.sort)),
  };
}

export function nightBoardFiltersActive(
  filters: NightBoardFilterValues
): boolean {
  return (
    Boolean(filters.q) ||
    Boolean(filters.city) ||
    Boolean(filters.propertyType) ||
    filters.priceMin != null ||
    filters.priceMax != null ||
    filters.minBedrooms != null ||
    filters.sort !== 'default'
  );
}

/** URL query values to preserve when changing `from` / filters. */
export function nightBoardFilterParams(
  filters: NightBoardFilterValues
): Record<string, string | undefined> {
  return {
    q: filters.q || undefined,
    city: filters.city || undefined,
    type: filters.propertyType || undefined,
    priceMin:
      filters.priceMin != null ? String(filters.priceMin) : undefined,
    priceMax:
      filters.priceMax != null ? String(filters.priceMax) : undefined,
    beds:
      filters.minBedrooms != null
        ? String(filters.minBedrooms)
        : undefined,
    sort: filters.sort !== 'default' ? filters.sort : undefined,
  };
}

function weekdayCost(asset: NightBoardSortableAsset): number {
  if (asset.costWeekday != null) return Number(asset.costWeekday);
  return Number(asset.asset_costs?.cost_weekday || 0);
}

export function matchesNightBoardFilters(
  asset: NightBoardSortableAsset,
  filters: NightBoardFilterValues
): boolean {
  if (
    filters.q &&
    !matchesAssetSearch(filters.q, {
      id: asset.id,
      slug: asset.slug,
      title: asset.title,
      location: asset.location || '',
    })
  ) {
    return false;
  }

  if (filters.city && !locationMatchesCity(asset.location, filters.city)) {
    return false;
  }

  const propertyType = (
    asset.property_type ||
    asset.propertyType ||
    ''
  ).toUpperCase();
  if (filters.propertyType && propertyType !== filters.propertyType) {
    return false;
  }

  const cost = weekdayCost(asset);
  if (filters.priceMin != null && cost < filters.priceMin) return false;
  if (filters.priceMax != null && cost > filters.priceMax) return false;

  const beds = Number(asset.bedrooms || 0);
  if (filters.minBedrooms != null && beds < filters.minBedrooms) {
    return false;
  }

  return true;
}

export function sortNightBoardAssets<T extends NightBoardSortableAsset>(
  assets: T[],
  sort: NightBoardSort
): T[] {
  if (sort === 'default') return assets;
  const next = [...assets];
  next.sort((a, b) => {
    if (sort === 'title_asc' || sort === 'title_desc') {
      const cmp = foldVn(a.title).localeCompare(foldVn(b.title), 'vi');
      return sort === 'title_asc' ? cmp : -cmp;
    }
    if (sort === 'price_asc' || sort === 'price_desc') {
      const cmp = weekdayCost(a) - weekdayCost(b);
      return sort === 'price_asc' ? cmp : -cmp;
    }
    const cmp = Number(a.bedrooms || 0) - Number(b.bedrooms || 0);
    return sort === 'beds_asc' ? cmp : -cmp;
  });
  return next;
}
