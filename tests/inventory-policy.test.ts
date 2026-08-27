import { describe, expect, it } from 'vitest';
import {
  activeStayRanges,
  hasConfirmedConflict,
  isActiveStayRange,
  isNightBlocked,
} from '@/lib/engines/inventory';

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
