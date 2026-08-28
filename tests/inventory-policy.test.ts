import { describe, expect, it } from 'vitest';
import {
  activeStayRanges,
  hasClosedConflict,
  hasConfirmedConflict,
  isActiveStayRange,
  isNightBlocked,
  nightStatus,
} from '@/lib/engines/inventory';
import { parseBoardFrom } from '@/lib/engines/night-board-range';
import { isSimpleUi, parseUiMode } from '@/lib/engines/ui-mode';
import { parseSaleSettingTab } from '@/components/sale/sale-setting-tabs';
import {
  orderedStay,
  stayDisplayCost,
  stayHasBlockedNight,
} from '@/lib/engines/night-board-display';

describe('concurrent confirm semantics', () => {
  it('second confirm overlapping confirmed range is rejected by inventory check', () => {
    const existing = [{ checkIn: '2026-10-01', checkOut: '2026-10-05' }];
    const challenger = { checkIn: '2026-10-03', checkOut: '2026-10-06' };
    expect(hasConfirmedConflict(challenger, existing)).toBe(true);
  });

  it('pending-only ranges are not passed into confirmed conflict list', () => {
    // App only queries status=CONFIRMED into this list — PENDING ignored by design
    const confirmedOnly: { checkIn: string; checkOut: string }[] = [];
    const pendingCandidate = { checkIn: '2026-10-01', checkOut: '2026-10-05' };
    expect(hasConfirmedConflict(pendingCandidate, confirmedOnly)).toBe(false);
  });

  it('marks nights inside confirmed ranges as blocked', () => {
    const ranges = [{ checkIn: '2026-10-01', checkOut: '2026-10-05' }];
    expect(isNightBlocked('2026-10-01', ranges)).toBe(true);
    expect(isNightBlocked('2026-10-04', ranges)).toBe(true);
    expect(isNightBlocked('2026-10-05', ranges)).toBe(false);
  });
});

describe('active stay ranges for free/busy calendars', () => {
  const today = '2026-08-28';

  it('keeps stays that check out today or later', () => {
    expect(
      isActiveStayRange({ checkIn: '2026-08-28', checkOut: '2026-08-30' }, today)
    ).toBe(true);
    expect(
      isActiveStayRange({ checkIn: '2026-08-20', checkOut: '2026-08-28' }, today)
    ).toBe(true);
  });

  it('drops stays whose last night is already in the past', () => {
    expect(
      isActiveStayRange({ checkIn: '2026-08-25', checkOut: '2026-08-26' }, today)
    ).toBe(false);
  });

  it('filters a mixed list down to stays that still occupy today or later', () => {
    expect(
      activeStayRanges(
        [
          { checkIn: '2026-08-25', checkOut: '2026-08-26' },
          { checkIn: '2026-08-28', checkOut: '2026-08-30' },
        ],
        today
      )
    ).toEqual([{ checkIn: '2026-08-28', checkOut: '2026-08-30' }]);
  });
});

describe('shared night board status', () => {
  const board = {
    assetId: 'a1',
    confirmedStays: [
      {
        bookingId: 'b-lock',
        saleId: 's1',
        checkIn: '2026-09-10',
        checkOut: '2026-09-12',
      },
    ],
    holdStays: [
      {
        bookingId: 'b-hold',
        saleId: 's2',
        checkIn: '2026-09-14',
        checkOut: '2026-09-16',
      },
    ],
    closedNights: ['2026-09-20'],
    nightlyCosts: {},
  };

  it('paints the same locked/hold/closed set for calendar and form', () => {
    const dates = [
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-14',
      '2026-09-15',
      '2026-09-20',
      '2026-09-21',
    ];
    const statuses = dates.map((d) => nightStatus(d, board));
    expect(statuses).toEqual([
      'locked',
      'locked',
      'open',
      'hold',
      'hold',
      'closed',
      'open',
    ]);
  });

  it('lets locked win over a closed night on the same date', () => {
    expect(
      nightStatus('2026-09-10', {
        ...board,
        closedNights: ['2026-09-10'],
      })
    ).toBe('locked');
  });

  it('detects closed nights inside a candidate stay', () => {
    expect(
      hasClosedConflict(
        { checkIn: '2026-09-19', checkOut: '2026-09-22' },
        board.closedNights
      )
    ).toBe(true);
    expect(
      hasClosedConflict(
        { checkIn: '2026-09-21', checkOut: '2026-09-23' },
        board.closedNights
      )
    ).toBe(false);
  });
});

describe('board range and ui mode', () => {
  it('rejects past or invalid board start dates', () => {
    expect(parseBoardFrom('2020-01-01', '2026-08-28')).toBe('2026-08-28');
    expect(parseBoardFrom('nope', '2026-08-28')).toBe('2026-08-28');
    expect(parseBoardFrom('2026-09-01', '2026-08-28')).toBe('2026-09-01');
  });

  it('defaults unknown ui_mode to expert', () => {
    expect(parseUiMode('simple')).toBe('simple');
    expect(parseUiMode('expert')).toBe('expert');
    expect(parseUiMode('nope')).toBe('expert');
    expect(isSimpleUi('simple')).toBe(true);
    expect(isSimpleUi('expert')).toBe(false);
  });

  it('hides the payout settings tab in simple mode', () => {
    expect(parseSaleSettingTab('payout', { hidePayout: true })).toBe(
      'membership'
    );
    expect(parseSaleSettingTab(undefined, { hidePayout: true })).toBe(
      'membership'
    );
    expect(parseSaleSettingTab('payout')).toBe('payout');
  });
});

describe('stay cost over a night range', () => {
  const column = {
    assetId: 'a1',
    title: 'Villa',
    costWeekday: 1000,
    costWeekend: 2000,
    saleDiscountPercent: 10,
    board: {
      assetId: 'a1',
      confirmedStays: [],
      holdStays: [],
      closedNights: ['2026-08-30'],
      nightlyCosts: {},
    },
  };

  it('sums display cost for every occupied night, not just check-in', () => {
    // Fri 28 + Sat 29 + Sun 30
    expect(
      stayDisplayCost('2026-08-28', '2026-08-31', column, 'owner')
    ).toBe(1000 + 2000 + 2000);
    expect(
      stayDisplayCost('2026-08-28', '2026-08-31', column, 'sale')
    ).toBe(900 + 1800 + 1800);
  });

  it('builds a half-open stay from two inclusive nights', () => {
    expect(orderedStay('2026-08-28', '2026-08-30')).toEqual({
      checkIn: '2026-08-28',
      checkOut: '2026-08-31',
    });
    expect(orderedStay('2026-08-30', '2026-08-28').checkIn).toBe('2026-08-28');
  });

  it('rejects a stay that includes a closed night', () => {
    expect(
      stayHasBlockedNight('2026-08-28', '2026-08-31', column.board)
    ).toBe(true);
    expect(
      stayHasBlockedNight('2026-08-28', '2026-08-30', column.board)
    ).toBe(false);
  });
});
