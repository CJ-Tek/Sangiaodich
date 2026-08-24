import { describe, expect, it } from 'vitest';
import {
  guestPay,
  previewPricing,
  sumBaseCost,
  effectiveCost,
  nightCostBreakdown,
  minDepositToConfirm,
  minOwnerDepositToConfirm,
} from '@/lib/engines/pricing';
import {
  guestInvoiceAmounts,
  guestInvoiceQrAmount,
} from '@/lib/engines/guest-invoice';
import { computeCancelRefund } from '@/lib/engines/cancellation';
import { hasConfirmedConflict } from '@/lib/engines/inventory';
import { isSubscriptionActive } from '@/lib/engines/subscription';
import { addCalendarMonths, parseYearMonth } from '@/lib/dates';
import { planDurationLabel, planDiscount } from '@/lib/engines/subscription-plans';
import {
  applyGuestConfirmProgress,
  applyGuestProgress,
  applySaleConfirmVolume,
  recomputeGuestFromCollectedAmounts,
  recomputeSaleFromBaseCosts,
} from '@/lib/engines/membership';
import { quoteAssetCosts } from '@/lib/engines/pricing';
import {
  bookingNetPaid,
  matchesCustomerSearch,
  remainingToNextRank,
  sumNetPaid,
} from '@/lib/engines/sale-customer-stats';
import { tierProgressPercent } from '@/lib/engines/guest-overview';
import { remainingToPay } from '@/lib/engines/guest-bookings';
import { exploreListHref } from '@/lib/engines/explore-assets';
import {
  costColumnsForExplore,
  hasExploreQueryFilters,
  isSearchWeekend,
  parseBudgetVnd,
  parseExploreAdvancedParams,
  parseGuestsParam,
  parseStayRange,
} from '@/lib/engines/explore-filters';
import {
  guestRemaining,
  isGuestDepositCase,
  isGuestPaidInFull,
  remainderPayee,
  saleOwnerPayoutSatisfied,
} from '@/lib/engines/guest-balance';
import { normalizePhone } from '@/lib/auth/otp';
import {
  parseChannel,
  parseIntent,
  parseSavedStatus,
} from '@/lib/engines/sale-customers';
import {
  AdminUserError,
  hardDeleteBlockedMessage,
  matchesAdminUserSearch,
} from '@/lib/engines/admin-user-shared';
import { hardDeleteUser } from '@/lib/engines/admin-user-management';
import {
  matchesOwnerSettlementSearch,
  matchesSaleBookingSearch,
  ownerTransferMemo,
} from '@/lib/engines/booking-search';
import {
  phoneDigitsMatch,
  vnNationalDigits,
  vnPhoneSearchVariants,
} from '@/lib/phone/vn-search';

describe('pricing', () => {
  it('sums weekday and weekend nights', () => {
    // Fri 2026-08-07 to Mon 2026-08-10 => Fri, Sat, Sun
    const total = sumBaseCost('2026-08-07', '2026-08-10', 100, 200);
    expect(total).toBe(100 + 200 + 200);
  });

  it('lists per-night cost breakdown', () => {
    const rows = nightCostBreakdown('2026-08-07', '2026-08-10', 100, 200);
    expect(rows).toEqual([
      { date: '2026-08-07', weekend: false, cost: 100 },
      { date: '2026-08-08', weekend: true, cost: 200 },
      { date: '2026-08-09', weekend: true, cost: 200 },
    ]);
  });

  it('requires 50% list price as minimum deposit to confirm', () => {
    expect(minDepositToConfirm(11_000_000)).toBe(5_500_000);
    expect(minDepositToConfirm(10_700_001)).toBe(5_350_001);
  });

  it('requires 50% owner earn as Sale→Owner transfer before submit', () => {
    expect(minOwnerDepositToConfirm(3_200_000)).toBe(1_600_000);
    expect(minOwnerDepositToConfirm(3_200_001)).toBe(1_600_001);
  });

  it('applies floor on guestPay', () => {
    expect(guestPay(500, 800)).toBe(800);
    expect(guestPay(2000, 800)).toBe(2000);
  });

  it('computes effective cost from sale discount', () => {
    expect(effectiveCost(1000, 10)).toBe(900);
  });

  it('previewPricing respects floor', () => {
    const p = previewPricing({
      checkIn: '2026-08-10',
      checkOut: '2026-08-12',
      costWeekday: 1000,
      costWeekend: 1000,
      listSelling: 500,
      saleCostDiscountPercent: 0,
    });
    expect(p.baseCost).toBe(2000);
    expect(p.guestPay).toBe(2000);
  });

  it('quoteAssetCosts applies tier discount per night rate', () => {
    const tier0 = quoteAssetCosts(2_500_000, 4_200_000, 0);
    expect(tier0.effectiveWeekday).toBe(2_500_000);
    expect(tier0.effectiveWeekend).toBe(4_200_000);

    const tier1 = quoteAssetCosts(2_500_000, 4_200_000, 5);
    expect(tier1.effectiveWeekday).toBe(2_375_000);
    expect(tier1.effectiveWeekend).toBe(3_990_000);

    const tier2 = quoteAssetCosts(2_500_000, 4_200_000, 10);
    expect(tier2.effectiveWeekday).toBe(2_250_000);
    expect(tier2.effectiveWeekend).toBe(3_780_000);
  });

  it('different discount percents yield different quotes for same base', () => {
    const a = quoteAssetCosts(1_000_000, 1_000_000, 0);
    const b = quoteAssetCosts(1_000_000, 1_000_000, 5);
    expect(a.effectiveWeekday).not.toBe(b.effectiveWeekday);
  });
});

describe('inventory', () => {
  it('only confirmed ranges conflict', () => {
    const candidate = { checkIn: '2026-09-01', checkOut: '2026-09-05' };
    expect(
      hasConfirmedConflict(candidate, [
        { checkIn: '2026-09-03', checkOut: '2026-09-04' },
      ])
    ).toBe(true);
    expect(hasConfirmedConflict(candidate, [])).toBe(false);
  });
});

describe('subscription', () => {
  it('gates on ACTIVE and period_end', () => {
    expect(
      isSubscriptionActive({ status: 'ACTIVE', periodEnd: '2099-01-01' })
    ).toBe(true);
    expect(
      isSubscriptionActive({
        status: 'ACTIVE',
        periodEnd: '2020-01-01',
        today: '2026-01-01',
      })
    ).toBe(false);
    expect(
      isSubscriptionActive({ status: 'EXPIRED', periodEnd: '2099-01-01' })
    ).toBe(false);
  });
});

describe('calendar months', () => {
  it('adds calendar months and clamps end-of-month', () => {
    expect(addCalendarMonths('2026-01-15', 1)).toBe('2026-02-15');
    expect(addCalendarMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addCalendarMonths('2026-01-31', 12)).toBe('2027-01-31');
    expect(addCalendarMonths('2026-08-07', 3)).toBe('2026-11-07');
  });

  it('parses year-month bounds in Vietnam timezone', () => {
    const p = parseYearMonth('2026-08');
    expect(p.yearMonth).toBe('2026-08');
    expect(p.startDate).toBe('2026-08-01');
    expect(p.endDate).toBe('2026-09-01');
    expect(p.startIso).toBe('2026-08-01T00:00:00+07:00');
    expect(p.endIso).toBe('2026-09-01T00:00:00+07:00');
    expect(parseYearMonth('bad').yearMonth).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe('plan labels', () => {
  it('shows 1 năm for 12 months', () => {
    expect(planDurationLabel(12)).toBe('1 năm');
    expect(planDurationLabel(1)).toBe('1 tháng');
    expect(planDurationLabel(6)).toBe('6 tháng');
  });
});

describe('plan discount badge', () => {
  it('computes percent and save amount from compare_at', () => {
    const d = planDiscount({ amount: 200_000, compare_at_amount: 250_000 });
    expect(d).toEqual({
      compareAt: 250_000,
      amount: 200_000,
      saveAmount: 50_000,
      percent: 20,
    });
  });

  it('returns null when no compare or not higher', () => {
    expect(planDiscount({ amount: 200_000, compare_at_amount: null })).toBeNull();
    expect(
      planDiscount({ amount: 200_000, compare_at_amount: 200_000 })
    ).toBeNull();
    expect(
      planDiscount({ amount: 200_000, compare_at_amount: 150_000 })
    ).toBeNull();
  });
});

describe('membership', () => {
  it('upgrades sale tier by lifetime volume', () => {
    const tiers = [
      { id: '0', sort: 0, minLifetimeCostVolume: 0, costDiscountPercent: 0 },
      { id: '1', sort: 1, minLifetimeCostVolume: 100, costDiscountPercent: 5 },
    ];
    const r = applySaleConfirmVolume({
      lifetimeCostVolume: 50,
      addBaseCost: 60,
      tiers,
    });
    expect(r.tier.id).toBe('1');
    expect(r.lifetimeCostVolume).toBe(110);
  });

  it('resets guest progress after rank-up', () => {
    const tiers = [
      { id: '0', sort: 0, minBooks: 0, minGmv: 0 },
      { id: '1', sort: 1, minBooks: 2, minGmv: 100 },
    ];
    const r = applyGuestConfirmProgress({
      currentTier: tiers[0],
      progressBooks: 1,
      progressGmv: 50,
      lifetimeBooks: 1,
      lifetimeGmv: 50,
      addAmountCollected: 60,
      tiers,
    });
    expect(r.rankedUp).toBe(true);
    expect(r.currentTier.id).toBe('1');
    expect(r.progressBooks).toBe(0);
    expect(r.progressGmv).toBe(0);
  });

  it('adds later payments as gmv only, without counting a new book', () => {
    const tiers = [
      { id: '0', sort: 0, minBooks: 0, minGmv: 0 },
      { id: '1', sort: 1, minBooks: 2, minGmv: 100 },
    ];
    const r = applyGuestProgress({
      currentTier: tiers[0],
      progressBooks: 1,
      progressGmv: 50,
      lifetimeBooks: 1,
      lifetimeGmv: 50,
      addBooks: 0,
      addGmv: 60,
      tiers,
    });
    expect(r.lifetimeBooks).toBe(1);
    expect(r.progressBooks).toBe(1);
    expect(r.progressGmv).toBe(110);
    expect(r.rankedUp).toBe(false);
  });

  it('demotes sale tier when recomputing after lost volume', () => {
    const tiers = [
      { id: '0', sort: 0, minLifetimeCostVolume: 0, costDiscountPercent: 0 },
      { id: '1', sort: 1, minLifetimeCostVolume: 100, costDiscountPercent: 5 },
    ];
    const up = recomputeSaleFromBaseCosts([60, 50], tiers);
    expect(up.tier?.id).toBe('1');
    expect(up.lifetimeCostVolume).toBe(110);

    const down = recomputeSaleFromBaseCosts([60], tiers);
    expect(down.tier?.id).toBe('0');
    expect(down.lifetimeCostVolume).toBe(60);
  });

  it('demotes guest tier when replaying without cancelled booking', () => {
    const tiers = [
      { id: '0', sort: 0, minBooks: 0, minGmv: 0 },
      { id: '1', sort: 1, minBooks: 2, minGmv: 100 },
    ];
    const ranked = recomputeGuestFromCollectedAmounts([50, 60], tiers);
    expect(ranked.currentTier.id).toBe('1');
    expect(ranked.lifetimeBooks).toBe(2);
    expect(ranked.lifetimeGmv).toBe(110);

    const afterCancel = recomputeGuestFromCollectedAmounts([50], tiers);
    expect(afterCancel.currentTier.id).toBe('0');
    expect(afterCancel.lifetimeBooks).toBe(1);
    expect(afterCancel.lifetimeGmv).toBe(50);
    expect(afterCancel.progressBooks).toBe(1);
    expect(afterCancel.progressGmv).toBe(50);
  });
});

describe('sale customer stats', () => {
  it('computes net paid never below zero', () => {
    expect(bookingNetPaid(1_000_000, 200_000)).toBe(800_000);
    expect(bookingNetPaid(100_000, 200_000)).toBe(0);
    expect(bookingNetPaid(null, null)).toBe(0);
  });

  it('sums net paid across bookings', () => {
    expect(
      sumNetPaid([
        { amountCollected: 1_000_000, refundAmount: 100_000 },
        { amountCollected: 500_000, refundAmount: 0 },
      ])
    ).toBe(1_400_000);
  });

  it('remaining to next guest rank uses books + gmv', () => {
    const tiers = [
      { sort: 0, minBooks: 0, minGmv: 0, label: 'Bronze' },
      { sort: 1, minBooks: 3, minGmv: 10_000_000, label: 'Silver' },
    ];
    const r = remainingToNextRank({
      currentSort: 0,
      progressBooks: 1,
      progressGmv: 2_000_000,
      tiers,
    });
    expect(r.atMaxTier).toBe(false);
    expect(r.nextLabel).toBe('Silver');
    expect(r.remainingBooks).toBe(2);
    expect(r.remainingGmv).toBe(8_000_000);
  });

  it('tier progress tracks the requirement furthest behind', () => {
    // Books are complete but GMV is only halfway: must not read 100%.
    expect(
      tierProgressPercent({
        progressBooks: 3,
        progressGmv: 5_000_000,
        neededBooks: 3,
        neededGmv: 10_000_000,
      })
    ).toBe(50);

    expect(
      tierProgressPercent({
        progressBooks: 3,
        progressGmv: 10_000_000,
        neededBooks: 3,
        neededGmv: 10_000_000,
      })
    ).toBe(100);

    // No next tier requirements at all: treat as complete rather than divide by 0.
    expect(
      tierProgressPercent({
        progressBooks: 0,
        progressGmv: 0,
        neededBooks: 0,
        neededGmv: 0,
      })
    ).toBe(100);
  });

  it('remaining to pay never goes negative', () => {
    expect(remainingToPay(10_000_000, 4_000_000)).toBe(6_000_000);
    expect(remainingToPay(10_000_000, 12_000_000)).toBe(0);
    expect(remainingToPay(0, 0)).toBe(0);
    expect(remainingToPay(10_000_000, 5_000_000, 5_000_000)).toBe(0);
  });

  it('guest remaining and paid-in-full Case A vs B', () => {
    expect(isGuestDepositCase(10_000_000, 5_000_000)).toBe(true);
    expect(isGuestDepositCase(10_000_000, 10_000_000)).toBe(false);
    expect(guestRemaining(10_000_000, 5_000_000, 0)).toBe(5_000_000);
    expect(isGuestPaidInFull(10_000_000, 5_000_000, 0)).toBe(false);
    expect(isGuestPaidInFull(10_000_000, 5_000_000, 5_000_000)).toBe(true);
    expect(isGuestPaidInFull(10_000_000, 10_000_000, 0)).toBe(true);
    expect(
      remainderPayee({
        status: 'CONFIRMED',
        listPrice: 10_000_000,
        amountCollected: 5_000_000,
      })
    ).toBe('OWNER');
    expect(
      remainderPayee({
        status: 'PENDING',
        listPrice: 10_000_000,
        amountCollected: 5_000_000,
      })
    ).toBe('SALE');
    expect(
      remainderPayee({
        status: 'CONFIRMED',
        listPrice: 10_000_000,
        amountCollected: 10_000_000,
      })
    ).toBeNull();
  });

  it('Case A Sale is done after 50% cost; Case B needs full cost', () => {
    expect(
      saleOwnerPayoutSatisfied({
        listPrice: 10_000_000,
        amountCollected: 5_000_000,
        ownerEarn: 7_000_000,
        ownerPaid: 3_500_000,
      })
    ).toBe(true);
    expect(
      saleOwnerPayoutSatisfied({
        listPrice: 10_000_000,
        amountCollected: 10_000_000,
        ownerEarn: 7_000_000,
        ownerPaid: 3_500_000,
      })
    ).toBe(false);
    expect(
      saleOwnerPayoutSatisfied({
        listPrice: 10_000_000,
        amountCollected: 10_000_000,
        ownerEarn: 7_000_000,
        ownerPaid: 7_000_000,
      })
    ).toBe(true);
  });

  it('marks max tier when no next', () => {
    const r = remainingToNextRank({
      currentSort: 2,
      progressBooks: 0,
      progressGmv: 0,
      tiers: [{ sort: 2, minBooks: 0, minGmv: 0, label: 'Gold' }],
    });
    expect(r.atMaxTier).toBe(true);
    expect(r.remainingBooks).toBeNull();
  });

  it('matches customer search by name or phone digits', () => {
    expect(matchesCustomerSearch('', 'Guest Demo', '+840000000004')).toBe(
      true
    );
    expect(
      matchesCustomerSearch('guest', 'Guest Demo', '+840000000004')
    ).toBe(true);
    expect(matchesCustomerSearch('0004', 'Guest Demo', '+840000000004')).toBe(
      true
    );
    expect(matchesCustomerSearch('84 000', 'Guest Demo', '+840000000004')).toBe(
      true
    );
    expect(matchesCustomerSearch('xyz', 'Guest Demo', '+840000000004')).toBe(
      false
    );
    expect(
      matchesCustomerSearch('0365210936', 'Phuong', '84365210936')
    ).toBe(true);
    expect(
      matchesCustomerSearch('84365210936', 'Phuong', '+84365210936')
    ).toBe(true);
  });
});

describe('VN phone search (0 ↔ 84)', () => {
  it('canonicalizes national digits', () => {
    expect(vnNationalDigits('0365210936')).toBe('365210936');
    expect(vnNationalDigits('84365210936')).toBe('365210936');
    expect(vnNationalDigits('365210936')).toBe('365210936');
  });

  it('matches 0-prefix query against 84-stored phone', () => {
    expect(phoneDigitsMatch('0365210936', '84365210936')).toBe(true);
    expect(phoneDigitsMatch('84365210936', '0365210936')).toBe(true);
    expect(phoneDigitsMatch('365210936', '84365210936')).toBe(true);
  });

  it('builds search variants for SQL', () => {
    const v = vnPhoneSearchVariants('0365210936');
    expect(v).toEqual(
      expect.arrayContaining([
        '0365210936',
        '84365210936',
        '365210936',
        '+84365210936',
      ])
    );
  });
});

describe('booking list search', () => {
  it('matches owner settlements by villa, sale name, or sale phone', () => {
    const row = {
      villaTitle: 'Villa Biển Xanh',
      saleName: 'Sale Demo',
      salePhone: '+84365210936',
      bookingId: '2735497e-aaaa-bbbb-cccc-dddddddddddd',
    };
    expect(matchesOwnerSettlementSearch('', row)).toBe(true);
    expect(matchesOwnerSettlementSearch('biển', row)).toBe(true);
    expect(matchesOwnerSettlementSearch('sale demo', row)).toBe(true);
    expect(matchesOwnerSettlementSearch('0365210936', row)).toBe(true);
    expect(matchesOwnerSettlementSearch('zzz', row)).toBe(false);
  });

  it('matches owner settlements by transfer memo / booking id', () => {
    const bookingId = '2735497e-aaaa-bbbb-cccc-dddddddddddd';
    const row = {
      villaTitle: 'Villa',
      saleName: 'Sale',
      salePhone: null,
      bookingId,
    };
    expect(ownerTransferMemo(bookingId)).toBe('VBNB 2735497e');
    expect(matchesOwnerSettlementSearch('VBNB 2735497e', row)).toBe(true);
    expect(matchesOwnerSettlementSearch('2735497e', row)).toBe(true);
    expect(matchesOwnerSettlementSearch('vbnb2735497e', row)).toBe(true);
    expect(matchesOwnerSettlementSearch('aaaa', row)).toBe(true);
  });

  it('matches sale bookings by villa, guest name, phone, or transfer memo', () => {
    const bookingId = '2735497e-aaaa-bbbb-cccc-dddddddddddd';
    const row = {
      villaTitle: 'Villa Biển Xanh',
      guestName: 'Guest Demo',
      guestPhone: '84365210936',
      bookingId,
    };
    expect(matchesSaleBookingSearch('xanh', row)).toBe(true);
    expect(matchesSaleBookingSearch('guest', row)).toBe(true);
    expect(matchesSaleBookingSearch('0365210936', row)).toBe(true);
    expect(matchesSaleBookingSearch('VBNB 2735497e', row)).toBe(true);
    expect(matchesSaleBookingSearch('nope', row)).toBe(false);
  });
});

describe('guest invoice amounts', () => {
  it('splits 50% deposit vs remaining to list', () => {
    const a = guestInvoiceAmounts({ listPrice: 2_700_000, amountCollected: 0 });
    expect(a.depositChunk).toBe(1_350_000);
    expect(a.remainingFull).toBe(2_700_000);
    expect(guestInvoiceQrAmount('deposit', a)).toBe(1_350_000);
    expect(guestInvoiceQrAmount('full', a)).toBe(2_700_000);
  });

  it('disables deposit after 50% collected', () => {
    const a = guestInvoiceAmounts({
      listPrice: 2_700_000,
      amountCollected: 1_350_000,
    });
    expect(a.canDeposit).toBe(false);
    expect(a.remainingFull).toBe(1_350_000);
  });

  it('owner remainder is unpaid list after sale receipts', () => {
    expect(guestRemaining(2_700_000, 1_350_000, 0)).toBe(1_350_000);
    expect(
      guestInvoiceQrAmount(
        'full',
        guestInvoiceAmounts({
          listPrice: 2_700_000,
          amountCollected: 1_350_000,
        })
      )
    ).toBe(1_350_000);
  });
});

describe('sale saved customer parsers', () => {
  it('normalizes VN phone numbers', () => {
    expect(normalizePhone('0901234567')).toBe('+84901234567');
    expect(normalizePhone('+84 901 234 567')).toBe('+84901234567');
    expect(normalizePhone('12')).toBeNull();
  });

  it('parses channel / intent / status safely', () => {
    expect(parseChannel('zalo')).toBe('ZALO');
    expect(parseChannel('nope')).toBe('OTHER');
    expect(parseIntent('hot')).toBe('HOT');
    expect(parseIntent('x')).toBe('WARM');
    expect(parseSavedStatus('ACTIVE')).toBe('ACTIVE');
    expect(parseSavedStatus('nope')).toBeNull();
  });
});

describe('cancellation refund (Firm)', () => {
  it('PENDING always full refund of collected', () => {
    const r = computeCancelRefund({
      status: 'PENDING',
      checkIn: '2026-09-01',
      amountCollected: 5_000_000,
      today: '2026-08-20',
    });
    expect(r.refundPercent).toBe(100);
    expect(r.refundAmount).toBe(5_000_000);
    expect(r.keptAmount).toBe(0);
  });

  it('AWAITING_OWNER full refund like PENDING (not Firm)', () => {
    const r = computeCancelRefund({
      status: 'AWAITING_OWNER',
      checkIn: '2026-08-25',
      amountCollected: 5_000_000,
      today: '2026-08-20',
    });
    expect(r.daysUntilCheckIn).toBe(5);
    expect(r.refundPercent).toBe(100);
    expect(r.refundAmount).toBe(5_000_000);
    expect(r.band).toBe('PENDING_FULL');
  });

  it('CONFIRMED ≥30 days → 100%', () => {
    const r = computeCancelRefund({
      status: 'CONFIRMED',
      checkIn: '2026-09-30',
      amountCollected: 6_000_000,
      today: '2026-08-20',
    });
    expect(r.daysUntilCheckIn).toBe(41);
    expect(r.refundPercent).toBe(100);
    expect(r.refundAmount).toBe(6_000_000);
  });

  it('CONFIRMED 7–29 days → 50%', () => {
    const r = computeCancelRefund({
      status: 'CONFIRMED',
      checkIn: '2026-08-30',
      amountCollected: 6_000_000,
      today: '2026-08-20',
    });
    expect(r.daysUntilCheckIn).toBe(10);
    expect(r.refundPercent).toBe(50);
    expect(r.refundAmount).toBe(3_000_000);
    expect(r.keptAmount).toBe(3_000_000);
  });

  it('CONFIRMED <7 days → 0%', () => {
    const r = computeCancelRefund({
      status: 'CONFIRMED',
      checkIn: '2026-08-25',
      amountCollected: 6_000_000,
      today: '2026-08-20',
    });
    expect(r.daysUntilCheckIn).toBe(5);
    expect(r.refundPercent).toBe(0);
    expect(r.refundAmount).toBe(0);
    expect(r.keptAmount).toBe(6_000_000);
  });

  it('CHECKED_IN → 0% unless goodwill', () => {
    const policy = computeCancelRefund({
      status: 'CHECKED_IN',
      checkIn: '2026-08-18',
      amountCollected: 6_000_000,
      today: '2026-08-20',
    });
    expect(policy.refundAmount).toBe(0);

    const goodwill = computeCancelRefund({
      status: 'CHECKED_IN',
      checkIn: '2026-08-18',
      amountCollected: 6_000_000,
      today: '2026-08-20',
      goodwillFullRefund: true,
    });
    expect(goodwill.refundAmount).toBe(6_000_000);
    expect(goodwill.goodwill).toBe(true);
  });
});

describe('admin user management helpers', () => {
  it('matches search by name, email, or phone digits', () => {
    expect(
      matchesAdminUserSearch('Owner', 'Owner Demo', '+840000000002', 'owner@vbnb.local')
    ).toBe(true);
    expect(
      matchesAdminUserSearch(
        'owner@vbnb',
        'Owner Demo',
        '+840000000002',
        'owner@vbnb.local'
      )
    ).toBe(true);
    expect(
      matchesAdminUserSearch('000000002', 'Owner Demo', '+840000000002', null)
    ).toBe(true);
    expect(
      matchesAdminUserSearch('0365210936', 'Phuong', '84365210936', null)
    ).toBe(true);
    expect(
      matchesAdminUserSearch('84365210936', 'Phuong', '+84365210936', null)
    ).toBe(true);
    expect(
      matchesAdminUserSearch('zzz', 'Owner Demo', '+840000000002', 'owner@vbnb.local')
    ).toBe(false);
  });

  it('hard delete is permanently blocked by policy', () => {
    expect(() => hardDeleteUser({ profileId: 'x' })).toThrow(AdminUserError);
    try {
      hardDeleteUser();
    } catch (e) {
      expect(e).toBeInstanceOf(AdminUserError);
      expect((e as AdminUserError).code).toBe('HARD_DELETE_DISABLED');
      expect((e as AdminUserError).message).toBe(hardDeleteBlockedMessage());
    }
  });
});

describe('explore filters', () => {
  it('parses budget and guests, ignoring junk', () => {
    expect(parseBudgetVnd('6000000')).toBe(6_000_000);
    expect(parseBudgetVnd(['5000000', '1'])).toBe(5_000_000);
    expect(parseBudgetVnd('0')).toBeUndefined();
    expect(parseBudgetVnd('-1')).toBeUndefined();
    expect(parseBudgetVnd('abc')).toBeUndefined();
    expect(parseGuestsParam('6')).toBe(6);
    expect(parseGuestsParam('99')).toBe(50);
  });

  it('requires a real stay range', () => {
    expect(parseStayRange('2026-08-21', '2026-08-23')).toEqual({
      checkIn: '2026-08-21',
      checkOut: '2026-08-23',
    });
    expect(parseStayRange('2026-08-23', '2026-08-21')).toBeUndefined();
    expect(parseStayRange('2026-02-31', '2026-03-02')).toBeUndefined();
    expect(parseStayRange('2026-08-21', undefined)).toBeUndefined();
  });

  it('uses Vietnam calendar day for search-time weekend', () => {
    // Friday 23:59 VN
    expect(isSearchWeekend(new Date('2026-08-21T16:59:00.000Z'))).toBe(false);
    // Saturday 00:00 VN
    expect(isSearchWeekend(new Date('2026-08-21T17:00:00.000Z'))).toBe(true);
  });

  it('picks cost columns from stay nights, else search day', () => {
    expect(
      costColumnsForExplore({
        checkIn: '2026-08-21',
        checkOut: '2026-08-23',
      })
    ).toEqual({ weekday: true, weekend: true });
    expect(
      costColumnsForExplore({
        checkIn: '2026-08-22',
        checkOut: '2026-08-23',
      })
    ).toEqual({ weekday: false, weekend: true });
    expect(
      costColumnsForExplore({
        checkIn: '2026-08-24',
        checkOut: '2026-08-25',
      })
    ).toEqual({ weekday: true, weekend: false });
    expect(
      costColumnsForExplore({ now: new Date('2026-08-21T17:00:00.000Z') })
    ).toEqual({ weekday: false, weekend: true });
  });

  it('treats budgetMax as the only listing filter among budget fields', () => {
    expect(hasExploreQueryFilters({ budgetMax: 6_000_000 })).toBe(true);
    expect(hasExploreQueryFilters({ guests: 4 })).toBe(true);
    expect(hasExploreQueryFilters({})).toBe(false);
    const parsed = parseExploreAdvancedParams({
      budgetMin: '5000000',
      budgetMax: '6000000',
      guests: '4',
      checkIn: '2026-08-21',
      checkOut: '2026-08-23',
    });
    expect(parsed.budgetMin).toBe(5_000_000);
    expect(parsed.budgetMax).toBe(6_000_000);
    expect(parsed.guests).toBe(4);
    expect(parsed.checkIn).toBe('2026-08-21');
  });

  it('keeps advanced params on list URLs without forcing page=1', () => {
    expect(
      exploreListHref('/me/explore', {
        q: 'vung tau',
        budgetMin: 5_000_000,
        budgetMax: 6_000_000,
        guests: 6,
        checkIn: '2026-08-22',
        checkOut: '2026-08-24',
      })
    ).toBe(
      '/me/explore?q=vung+tau&budgetMin=5000000&budgetMax=6000000&guests=6&checkIn=2026-08-22&checkOut=2026-08-24'
    );
    expect(exploreListHref('/sale/marketplace', { q: 'id', page: 1 })).toBe(
      '/sale/marketplace?q=id'
    );
  });
});
