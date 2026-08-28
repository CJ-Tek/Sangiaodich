/** Weekend = Saturday(6) or Sunday(0) in local date interpretation (UTC date parts). */

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function eachNight(checkIn: string, checkOut: string): Date[] {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  const nights: Date[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    nights.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return nights;
}

export function parseDateOnly(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function sumBaseCost(
  checkIn: string,
  checkOut: string,
  costWeekday: number,
  costWeekend: number,
  nightlyOverrides?: Record<string, number>
): number {
  return nightCostBreakdown(
    checkIn,
    checkOut,
    costWeekday,
    costWeekend,
    nightlyOverrides
  ).reduce((sum, night) => sum + night.cost, 0);
}

export type NightCostRow = {
  /** YYYY-MM-DD of the night occupied */
  date: string;
  weekend: boolean;
  cost: number;
};

/** Per-night cost rows for [checkIn, checkOut). Overrides replace WD/WE for that date. */
export function nightCostBreakdown(
  checkIn: string,
  checkOut: string,
  costWeekday: number,
  costWeekend: number,
  nightlyOverrides?: Record<string, number>
): NightCostRow[] {
  return eachNight(checkIn, checkOut).map((night) => {
    const weekend = isWeekend(night);
    const date = night.toISOString().slice(0, 10);
    const override = nightlyOverrides?.[date];
    return {
      date,
      weekend,
      cost:
        override != null && Number.isFinite(override)
          ? Number(override)
          : weekend
            ? costWeekend
            : costWeekday,
    };
  });
}

export function effectiveCost(
  baseCost: number,
  saleCostDiscountPercent: number
): number {
  return Math.round(baseCost * (1 - saleCostDiscountPercent / 100));
}

export type QuotedAssetCosts = {
  baseWeekday: number;
  baseWeekend: number;
  effectiveWeekday: number;
  effectiveWeekend: number;
  discountPercent: number;
};

/** Apply sale membership % off to weekday/weekend base costs (client-safe). */
export function quoteAssetCosts(
  baseWeekday: number,
  baseWeekend: number,
  discountPercent: number
): QuotedAssetCosts {
  const pct = Number(discountPercent) || 0;
  return {
    baseWeekday,
    baseWeekend,
    effectiveWeekday: effectiveCost(baseWeekday, pct),
    effectiveWeekend: effectiveCost(baseWeekend, pct),
    discountPercent: pct,
  };
}

/** List price, floored at effective cost so a booking never sells below cost. */
export function guestPay(
  listSelling: number,
  floorEffectiveCost: number
): number {
  return Math.max(Math.round(listSelling), floorEffectiveCost);
}

export function saleMargin(guestPayAmount: number, effective: number): number {
  return guestPayAmount - effective;
}

/** Minimum offline Guest→Sale deposit before Sale can submit to Owner (50% of list). */
export function minDepositToConfirm(listSelling: number): number {
  return Math.ceil(Number(listSelling || 0) * 0.5);
}

/**
 * Minimum Sale→Owner transfer before Sale can submit to Owner (50% of owner earn).
 * Full payout also qualifies.
 */
export function minOwnerDepositToConfirm(ownerEarn: number): number {
  return Math.ceil(Number(ownerEarn || 0) * 0.5);
}

export type PricingPreview = {
  baseCost: number;
  effectiveCost: number;
  guestPay: number;
  saleMargin: number;
  saleDiscountPercent: number;
};

export function previewPricing(input: {
  checkIn: string;
  checkOut: string;
  costWeekday: number;
  costWeekend: number;
  listSelling: number;
  saleCostDiscountPercent: number;
  /** Per-night owner cost overrides (YYYY-MM-DD → cost). */
  nightlyCosts?: Record<string, number>;
}): PricingPreview {
  const base = sumBaseCost(
    input.checkIn,
    input.checkOut,
    input.costWeekday,
    input.costWeekend,
    input.nightlyCosts
  );
  const eff = effectiveCost(base, input.saleCostDiscountPercent);
  const pay = guestPay(input.listSelling, eff);
  return {
    baseCost: base,
    effectiveCost: eff,
    guestPay: pay,
    saleMargin: saleMargin(pay, eff),
    saleDiscountPercent: input.saleCostDiscountPercent,
  };
}
