import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { assertActiveSubscription } from '@/lib/engines/subscription-access';
import {
  convertSavedCustomer,
  createSavedCustomer,
  listSavedCustomers,
  parseSavedStatus,
  updateSavedCustomer,
  type SavedCustomerStatus,
} from '@/lib/engines/sale-customers';
import { fail, ok } from '@/lib/types';

async function requireActiveSale() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'SALE') {
    return {
      error: NextResponse.json(fail('UNAUTHORIZED', 'Sale only'), {
        status: 401,
      }),
    } as const;
  }
  try {
    await assertActiveSubscription(profile.id);
  } catch {
    return {
      error: NextResponse.json(
        fail(
          'SUBSCRIPTION_INACTIVE',
          'Subscription hết hạn — gia hạn để tiếp tục'
        ),
        { status: 403 }
      ),
    } as const;
  }
  return { profile } as const;
}

export async function GET(request: Request) {
  const gate = await requireActiveSale();
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
    return NextResponse.json(fail('LIST_FAILED', String(result.error)), {
      status: 400,
    });
  }
  return NextResponse.json(ok({ customers: result.customers }));
}

export async function POST(request: Request) {
  const gate = await requireActiveSale();
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
      const message =
        result.error === 'NOT_FOUND'
          ? 'Không tìm thấy khách đã lưu'
          : result.error === 'BOOKING_NOT_FOUND'
            ? 'Booking không thuộc sale này'
            : result.error === 'BOOKING_NOT_CLOSED'
              ? 'Chỉ gắn booking đã chốt'
              : String(result.error);
      return NextResponse.json(fail(String(result.error), message), {
        status: 400,
      });
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
    const message =
      result.error === 'INVALID_PHONE'
        ? 'Số điện thoại không hợp lệ'
        : result.error === 'INVALID_NAME'
          ? 'Tên khách bắt buộc'
          : result.error === 'DUPLICATE_PHONE'
            ? 'Đã lưu SĐT này — mở bản ghi cũ để cập nhật'
            : String(result.error);
    return NextResponse.json(fail(String(result.error), message), {
      status: 400,
    });
  }
  return NextResponse.json(ok({ customer: result.customer }));
}

export async function PATCH(request: Request) {
  const gate = await requireActiveSale();
  if ('error' in gate) return gate.error;
  const { profile } = gate;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || '');
  if (!id) {
    return NextResponse.json(fail('INVALID', 'id required'), { status: 400 });
  }

  let status: SavedCustomerStatus | undefined;
  if (body.status != null) {
    const parsed = parseSavedStatus(body.status);
    if (!parsed) {
      return NextResponse.json(fail('INVALID_STATUS', 'status không hợp lệ'), {
        status: 400,
      });
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
      result.error === 'NOT_FOUND'
        ? 'Không tìm thấy khách đã lưu'
        : result.error === 'INVALID_PHONE'
          ? 'Số điện thoại không hợp lệ'
          : result.error === 'INVALID_NAME'
            ? 'Tên khách bắt buộc'
            : result.error === 'DUPLICATE_PHONE'
              ? 'SĐT đã tồn tại ở bản ghi ACTIVE khác'
              : String(result.error);
    return NextResponse.json(fail(String(result.error), message), {
      status: 400,
    });
  }
  return NextResponse.json(ok({ customer: result.customer }));
}
