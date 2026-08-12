import { createServiceClient } from '@/lib/supabase/server';
import {
  pickSaleTier,
  type SaleTier,
} from '@/lib/engines/membership';

export type SaleTierRow = SaleTier & { label: string };

export type ResolvedSaleMembership = {
  discountPercent: number;
  tierId: string | null;
  tierLabel: string | null;
  lifetimeCostVolume: number;
  tiers: SaleTierRow[];
};

export function pickDiscountFromVolume(
  volume: number,
  tiers: SaleTier[]
): number {
  return pickSaleTier(volume, tiers)?.costDiscountPercent ?? 0;
}

export function pickTierFromVolume(
  volume: number,
  tiers: SaleTierRow[]
): SaleTierRow | null {
  if (!tiers.length) return null;
  return pickSaleTier(volume, tiers) as SaleTierRow;
}

function mapSaleTiers(
  rows: {
    id: string;
    sort: number;
    min_lifetime_cost_volume: number;
    cost_discount_percent: number;
    label?: string | null;
  }[]
): SaleTierRow[] {
  return rows.map((t) => ({
    id: t.id,
    sort: t.sort,
    minLifetimeCostVolume: Number(t.min_lifetime_cost_volume),
    costDiscountPercent: Number(t.cost_discount_percent),
    label: t.label || '',
  }));
}

/**
 * Resolve membership discount for a specific sale (session identity).
 * Server-only — do not import this module from Client Components.
 */
export async function resolveSaleMembership(
  saleId: string
): Promise<ResolvedSaleMembership> {
  const admin = createServiceClient();

  const { data: saleState } = await admin
    .from('sale_membership_states')
    .select('current_tier_id, lifetime_cost_volume')
    .eq('sale_id', saleId)
    .maybeSingle();

  const { data: saleTiersRaw } = await admin
    .from('sale_membership_tiers')
    .select('id, sort, min_lifetime_cost_volume, cost_discount_percent, label')
    .order('sort');

  const tiers = mapSaleTiers(saleTiersRaw || []);
  const volume = Number(saleState?.lifetime_cost_volume || 0);

  const byId = tiers.find((t) => t.id === saleState?.current_tier_id);
  const byVolume = pickTierFromVolume(volume, tiers);
  const tier = byId ?? byVolume;

  return {
    discountPercent: tier?.costDiscountPercent ?? 0,
    tierId: tier?.id ?? null,
    tierLabel: tier?.label || null,
    lifetimeCostVolume: volume,
    tiers,
  };
}

export async function resolveSaleCostDiscountPercent(
  saleId: string
): Promise<number> {
  const m = await resolveSaleMembership(saleId);
  return m.discountPercent;
}
