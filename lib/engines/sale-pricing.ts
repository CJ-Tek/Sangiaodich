import { createServiceClient } from '@/lib/supabase/server';
import {
  MAX_ASSET_DISCOUNT_RULES,
  pickSaleDiscountFromCount,
  pickSaleTierFromCount,
  saleDiscountSnapshotLabel,
  type OwnerDiscountRuleInput,
  type SaleTier,
} from '@/lib/engines/membership';

export { saleDiscountSnapshotLabel };

export type SaleTierRow = SaleTier & { label: string };

export type ResolvedSaleAssetDiscount = {
  discountPercent: number;
  checkoutCount: number;
  /** Always null — booking FK still points at legacy sale_membership_tiers. */
  tierId: string | null;
  tierLabel: string | null;
  tiers: SaleTierRow[];
};

export type SaleAssetDiscountProgress = {
  assetId: string;
  assetTitle: string;
  assetSlug: string | null;
  assetLocation: string | null;
  checkoutCount: number;
  discountPercent: number;
  tierLabel: string | null;
  nextThreshold: number | null;
  nextPercent: number | null;
};

export type ResolvedSaleDiscountProgress = {
  assets: SaleAssetDiscountProgress[];
};

type RuleRow = {
  id: string;
  asset_id?: string;
  sort: number;
  min_checked_out_count: number;
  cost_discount_percent: number;
};

function mapRules(rows: RuleRow[]): SaleTierRow[] {
  return rows.map((t) => ({
    id: t.id,
    sort: t.sort,
    minCheckedOutCount: Number(t.min_checked_out_count),
    costDiscountPercent: Number(t.cost_discount_percent),
    label: saleDiscountSnapshotLabel(Number(t.cost_discount_percent)),
  }));
}

function nextRung(
  checkoutCount: number,
  tiers: SaleTierRow[]
): { nextThreshold: number | null; nextPercent: number | null } {
  const sorted = [...tiers].sort(
    (a, b) =>
      a.minCheckedOutCount - b.minCheckedOutCount || a.sort - b.sort
  );
  const next = sorted.find((t) => checkoutCount <= t.minCheckedOutCount);
  return {
    nextThreshold: next ? next.minCheckedOutCount : null,
    nextPercent: next ? next.costDiscountPercent : null,
  };
}

export async function loadAssetDiscountRules(
  assetId: string
): Promise<SaleTierRow[]> {
  const byId = await loadAssetDiscountRulesByAssetIds([assetId]);
  return byId.get(assetId) ?? [];
}

export async function loadAssetDiscountRulesByAssetIds(
  assetIds: string[]
): Promise<Map<string, SaleTierRow[]>> {
  const unique = [...new Set(assetIds.filter(Boolean))];
  const map = new Map<string, SaleTierRow[]>();
  for (const id of unique) map.set(id, []);
  if (!unique.length) return map;

  const admin = createServiceClient();
  const { data } = await admin
    .from('asset_sale_discount_rules')
    .select('id, asset_id, sort, min_checked_out_count, cost_discount_percent')
    .in('asset_id', unique)
    .order('min_checked_out_count')
    .limit(unique.length * MAX_ASSET_DISCOUNT_RULES);

  for (const row of (data || []) as RuleRow[]) {
    const id = String(row.asset_id || '');
    const list = map.get(id);
    if (!list) continue;
    list.push(...mapRules([row]));
  }
  return map;
}

export async function replaceAssetDiscountRules(
  assetId: string,
  rules: OwnerDiscountRuleInput[]
): Promise<{ error?: string }> {
  const admin = createServiceClient();
  const { error: delError } = await admin
    .from('asset_sale_discount_rules')
    .delete()
    .eq('asset_id', assetId);
  if (delError) return { error: delError.message };
  if (!rules.length) return {};

  const { error } = await admin.from('asset_sale_discount_rules').insert(
    rules.map((r, i) => ({
      asset_id: assetId,
      sort: i,
      min_checked_out_count: r.minCheckedOutCount,
      cost_discount_percent: r.costDiscountPercent,
    }))
  );
  if (error) return { error: error.message };
  return {};
}

/**
 * Resolve % off cost for one sale on one asset from CHECKED_OUT count
 * against that asset's Owner rules. Empty rules → 0%.
 * Server-only — do not import this module from Client Components.
 */
export async function resolveSaleAssetDiscount(
  saleId: string,
  assetId: string
): Promise<ResolvedSaleAssetDiscount> {
  const admin = createServiceClient();
  const [tiers, { data: countRaw }] = await Promise.all([
    loadAssetDiscountRules(assetId),
    admin.rpc('sale_asset_checkout_count', {
      p_sale_id: saleId,
      p_asset_id: assetId,
    }),
  ]);
  const checkoutCount = Number(countRaw ?? 0);
  const tier = pickSaleTierFromCount(checkoutCount, tiers);
  return {
    discountPercent: tier?.costDiscountPercent ?? 0,
    checkoutCount,
    tierId: null,
    tierLabel: saleDiscountSnapshotLabel(tier?.costDiscountPercent ?? 0),
    tiers,
  };
}

export async function resolveSaleAssetDiscounts(
  saleId: string,
  assetIds: string[]
): Promise<Map<string, number>> {
  const unique = [...new Set(assetIds.filter(Boolean))];
  const map = new Map<string, number>();
  if (!unique.length) return map;

  const admin = createServiceClient();
  const [rulesByAsset, { data: rows }] = await Promise.all([
    loadAssetDiscountRulesByAssetIds(unique),
    admin.rpc('sale_asset_checkout_counts', {
      p_sale_id: saleId,
      p_asset_ids: unique,
    }),
  ]);

  const countByAsset = new Map<string, number>();
  for (const row of rows || []) {
    countByAsset.set(
      String((row as { asset_id: string }).asset_id),
      Number((row as { checkout_count: number }).checkout_count || 0)
    );
  }

  for (const id of unique) {
    map.set(
      id,
      pickSaleDiscountFromCount(
        countByAsset.get(id) ?? 0,
        rulesByAsset.get(id) ?? []
      )
    );
  }
  return map;
}

export async function resolveSaleDiscountProgress(
  saleId: string
): Promise<ResolvedSaleDiscountProgress> {
  const admin = createServiceClient();
  const { data: progress } = await admin.rpc('sale_checkout_progress', {
    p_sale_id: saleId,
  });

  const rows = (progress || []) as {
    asset_id: string;
    checkout_count: number;
  }[];
  const assetIds = rows.map((r) => r.asset_id);
  const metaById = new Map<
    string,
    { title: string; slug: string | null; location: string | null }
  >();
  const rulesByAsset = await loadAssetDiscountRulesByAssetIds(assetIds);
  if (assetIds.length) {
    const { data: assets } = await admin
      .from('assets')
      .select('id, title, slug, location')
      .in('id', assetIds)
      .limit(assetIds.length);
    for (const a of assets || []) {
      metaById.set(a.id, {
        title: a.title || 'Asset',
        slug: a.slug || null,
        location: a.location || null,
      });
    }
  }

  const assets: SaleAssetDiscountProgress[] = rows
    .map((r) => {
      const checkoutCount = Number(r.checkout_count || 0);
      const tiers = rulesByAsset.get(r.asset_id) ?? [];
      const tier = pickSaleTierFromCount(checkoutCount, tiers);
      const next = nextRung(checkoutCount, tiers);
      const meta = metaById.get(r.asset_id);
      return {
        assetId: r.asset_id,
        assetTitle: meta?.title || 'Asset',
        assetSlug: meta?.slug ?? null,
        assetLocation: meta?.location ?? null,
        checkoutCount,
        discountPercent: tier?.costDiscountPercent ?? 0,
        tierLabel: saleDiscountSnapshotLabel(tier?.costDiscountPercent ?? 0),
        nextThreshold: next.nextThreshold,
        nextPercent: next.nextPercent,
      };
    })
    .sort((a, b) => b.checkoutCount - a.checkoutCount);

  return { assets };
}
