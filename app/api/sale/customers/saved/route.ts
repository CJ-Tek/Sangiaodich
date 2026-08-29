import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import {
  convertSavedCustomer,
  createSavedCustomer,
  listSavedCustomers,
  parseSavedStatus,
  updateSavedCustomer,
  type SavedCustomerStatus,
} from '@/lib/engines/sale-customers';
import { getApiRouteContext } from '@/lib/i18n/api-route-context';
import { translateEngineError } from '@/lib/i18n/engine-error';
import { fail, ok } from '@/lib/types';

async function requireActiveSale(
  t: Awaited<ReturnType<typeof import('@/lib/i18n/api-route-context').getApiRouteContext>>['t']
) {
  const { assertActiveSubscription } = await import(
    '@/lib/engines/subscription-access'
  );
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'SALE') {
    return {
      error: NextResponse.json(fail('UNAUTHORIZED', t('UNAUTHORIZED.saleOnly')), {
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

export async function GET(request: Request) {
  const { t } = await getApiRouteContext();
  const gate = await requireActiveSale(t);
  if ('error' in gate) return gate.error;
  const { profile } = gate;

  const url = new URL(request.url);
  const status = parseSavedStatus(url.searchParams.get('status'));
  const q = url.searchParams.get('q');
  const dueRaw = url.searchParams.get('due');
  const due =
    dueRaw === 'overdue' || dueRaw === 'today' || dueRaw === 'week'
      ? dueRaw
      : null;
  const limit = Number(url.searchParams.get('limit') || 50);
  const offset = Number(url.searchParams.get('offset') || 0);

  const result = await listSavedCustomers({
    saleId: profile.id,
    status,
    q,
    due,
    limit,
    offset,
  });
  if ('error' in result && result.error) {
    return NextResponse.json(fail('LIST_FAILED', t('LIST_FAILED')), {
      status: 400,
    });
  }
  return NextResponse.json(ok({ customers: result.customers }));
}

export async function POST(request: Request) {
  const { t } = await getApiRouteContext();
  const gate = await requireActiveSale(t);
  if ('error' in gate) return gate.error;
  const { profile } = gate;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || 'create');

  if (action === 'convert') {
    const result = await convertSavedCustomer({
      saleId: profile.id,
      id: String(body.id || ''),
      bookingId: body.bookingId ? String(body.bookingId) : null,
    });
    if ('error' in result && result.error) {
      return NextResponse.json(
        fail(String(result.error), translateEngineError(t, result.error)),
        { status: 400 }
      );
    }
    return NextResponse.json(ok({ customer: result.customer }));
  }

  const result = await createSavedCustomer({
    saleId: profile.id,
    fullName: String(body.fullName || ''),
    phone: String(body.phone || ''),
    channel: body.channel,
    intentLevel: body.intentLevel,
    note: body.note != null ? String(body.note) : null,
    nextFollowUpAt: body.nextFollowUpAt
      ? String(body.nextFollowUpAt)
      : null,
    guestId: body.guestId ? String(body.guestId) : null,
  });

  if ('error' in result && result.error) {
    return NextResponse.json(
      fail(String(result.error), translateEngineError(t, result.error)),
      { status: 400 }
    );
  }
  return NextResponse.json(ok({ customer: result.customer }));
}

export async function PATCH(request: Request) {
  const { t } = await getApiRouteContext();
  const gate = await requireActiveSale(t);
  if ('error' in gate) return gate.error;
  const { profile } = gate;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || '');
  if (!id) {
    return NextResponse.json(fail('INVALID', t('INVALID.idRequired')), {
      status: 400,
    });
  }

  let status: SavedCustomerStatus | undefined;
  if (body.status != null) {
    const parsed = parseSavedStatus(body.status);
    if (!parsed) {
      return NextResponse.json(
        fail('INVALID_STATUS', t('INVALID_STATUS.generic')),
        { status: 400 }
      );
    }
    status = parsed;
  }

  const result = await updateSavedCustomer({
    saleId: profile.id,
    id,
    fullName: body.fullName != null ? String(body.fullName) : undefined,
    phone: body.phone != null ? String(body.phone) : undefined,
    channel: body.channel,
    intentLevel: body.intentLevel,
    note: body.note !== undefined ? (body.note as string | null) : undefined,
    nextFollowUpAt:
      body.nextFollowUpAt !== undefined
        ? body.nextFollowUpAt
          ? String(body.nextFollowUpAt)
          : null
        : undefined,
    status,
    markContacted: Boolean(body.markContacted),
  });

  if ('error' in result && result.error) {
    const message =
      result.error === 'DUPLICATE_PHONE'
        ? t('CONFLICT.duplicatePhoneActive')
        : translateEngineError(t, result.error);
    return NextResponse.json(fail(String(result.error), message), {
      status: 400,
    });
  }
  return NextResponse.json(ok({ customer: result.customer }));
}
