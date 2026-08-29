import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { issueGuestInvoice } from '@/lib/engines/guest-invoice-issue';
import { assertActiveSubscription } from '@/lib/engines/subscription-access';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { fail, ok } from '@/lib/types';

export async function POST(request: Request) {
  const { t } = await getApiRouteContext();
  const profile = await getSessionProfile();
  if (!profile || (profile.role !== 'SALE' && profile.role !== 'OWNER')) {
    return NextResponse.json(
      fail('UNAUTHORIZED', t('UNAUTHORIZED.saleOrOwnerOnly')),
      { status: 401 }
    );
  }
  try {
    await assertActiveSubscription(profile.id);
  } catch {
    return NextResponse.json(
      fail('SUBSCRIPTION_INACTIVE', t('SUBSCRIPTION_INACTIVE')),
      { status: 403 }
    );
  }

  const body = await request.json();
  const bookingId = String(body.bookingId || '');
  if (!bookingId) {
    return NextResponse.json(fail('INVALID', t('INVALID.bookingIdRequired')), {
      status: 400,
    });
  }

  const payee = profile.role === 'OWNER' ? 'OWNER' : 'SALE';
  const result = await issueGuestInvoice({
    bookingId,
    issuedBy: profile.id,
    payee,
  });

  if ('error' in result) {
    const messages: Record<string, { status: number; message: string }> = {
      NOT_FOUND: { status: 404, message: t('NOT_FOUND.booking') },
      FORBIDDEN: { status: 403, message: t('FORBIDDEN.notYourBooking') },
      INVALID_STATUS: {
        status: 400,
        message: t('INVALID_STATUS.bookingInvoice'),
      },
      ALREADY_PAID: { status: 400, message: t('ALREADY_PAID') },
      NO_PAYOUT: { status: 400, message: t('NO_PAYOUT') },
      INSERT_FAILED: {
        status: 500,
        message: result.message || t('INSERT_FAILED'),
      },
    };
    const errorCode = result.error;
    const meta =
      (errorCode ? messages[errorCode] : undefined) || {
        status: 500,
        message: t('INSERT_FAILED'),
      };
    return NextResponse.json(fail(errorCode ?? 'UNKNOWN', meta.message), {
      status: meta.status,
    });
  }

  const origin = new URL(request.url).origin;
  return NextResponse.json(
    ok({
      token: result.token,
      expiresAt: result.expiresAt,
      url: `${origin}/pay/${result.token}`,
    })
  );
}
