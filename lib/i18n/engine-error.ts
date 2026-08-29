type ErrorTranslator = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

export function translateEngineError(
  t: ErrorTranslator,
  code: string,
  opts?: { amount?: string; status?: string }
): string {
  switch (code) {
    case 'INVALID_DISCOUNT_PERCENT':
      return t('INVALID.discountPercentRange');
    case 'INVALID_DISCOUNT_THRESHOLD':
      return t('INVALID.discountThresholdInvalid');
    case 'DUPLICATE_DISCOUNT_THRESHOLD':
      return t('INVALID.discountThresholdDuplicate');
    case 'TOO_MANY_DISCOUNT_RULES':
      return t('INVALID.discountRulesTooMany');
    case 'INVALID_DISCOUNT_RULES':
      return t('INVALID.discountRulesInvalid');
    case 'PAST_NIGHT':
      return t('PAST_NIGHT');
    case 'LOCKED':
      return t('LOCKED.night');
    case 'HOLD':
      return t('HOLD');
    case 'INVALID_DATE':
      return t('INVALID_DATE');
    case 'INVALID_COST':
      return t('INVALID_COST');
    case 'FORBIDDEN':
      return t('FORBIDDEN.notYourProperty');
    case 'NOT_FOUND':
      return t('NOT_FOUND.booking');
    case 'INVALID_STATUS':
      return t('INVALID_STATUS.ownerConfirm');
    case 'OVERLAP':
      return t('OVERLAP.ownerConfirm');
    case 'CLOSED':
      return t('CLOSED.ownerConfirm');
    case 'INVALID_SCORE':
      return t('INVALID_SCORE');
    case 'NOT_CHECKED_OUT':
      return t('NOT_CHECKED_OUT');
    case 'INVALID_PHONE':
      return t('INVALID_PHONE');
    case 'INVALID_NAME':
      return t('INVALID.invalidName');
    case 'DUPLICATE_PHONE':
      return t('CONFLICT.duplicatePhone');
    case 'DUPLICATE_PHONE_ACTIVE':
      return t('CONFLICT.duplicatePhoneActive');
    case 'BOOKING_NOT_FOUND':
      return t('BOOKING_NOT_FOUND');
    case 'BOOKING_NOT_CLOSED':
      return t('BOOKING_NOT_CLOSED');
    case 'BELOW_FLOOR':
      return opts?.amount
        ? t('BOOKING_CREATE_FAILED.belowFloor', { amount: opts.amount })
        : t('BOOKING_CREATE_FAILED.generic');
    case 'NO_OWNER_EARN':
      return t('NO_OWNER_EARN');
    case 'BELOW_OWNER_PAYOUT':
      return opts?.amount
        ? t('BELOW_OWNER_PAYOUT', { amount: opts.amount })
        : t('BELOW_OWNER_PAYOUT', { amount: '—' });
    case 'BELOW_DEPOSIT':
      return opts?.amount
        ? t('BELOW_DEPOSIT', { amount: opts.amount })
        : t('BELOW_DEPOSIT', { amount: '—' });
    case 'GUEST_DUPLICATE':
      return t('BOOKING_CREATE_FAILED.guestDuplicate');
    case 'SUBSCRIPTION_INACTIVE':
      return t('SUBSCRIPTION_INACTIVE');
    case 'AMOUNT_REGRESSION':
      return t('AMOUNT_REGRESSION.payment');
    case 'ABOVE_LIST':
      return t('ABOVE_LIST');
    case 'LOCKED_AFTER_CONFIRM':
      return t('LOCKED_AFTER_CONFIRM');
    case 'ABOVE_OWNER_EARN':
      return t('ABOVE_OWNER_EARN');
    case 'INVALID_STATUS_OWNER_PAYOUT':
      return t('INVALID_STATUS.ownerPayout');
    default:
      return code;
  }
}

export async function requireActiveRole(
  role: 'OWNER' | 'SALE',
  t: ErrorTranslator
) {
  const { getSessionProfile } = await import('@/lib/auth/session');
  const { assertActiveSubscription } = await import(
    '@/lib/engines/subscription-access'
  );
  const { fail } = await import('@/lib/types');
  const { NextResponse } = await import('next/server');

  const profile = await getSessionProfile();
  const unauthorized =
    role === 'OWNER'
      ? t('UNAUTHORIZED.ownerOnly')
      : t('UNAUTHORIZED.saleOnly');
  if (!profile || profile.role !== role) {
    return {
      error: NextResponse.json(fail('UNAUTHORIZED', unauthorized), {
        status: 401,
      }),
    } as const;
  }
  try {
    await assertActiveSubscription(profile.id);
  } catch {
    return {
      error: NextResponse.json(
        fail('SUBSCRIPTION_INACTIVE', t('SUBSCRIPTION_INACTIVE')),
        { status: 403 }
      ),
    } as const;
  }
  return { profile } as const;
}
