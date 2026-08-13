import { createClient } from '@/lib/supabase/server';

export type GuestBookingListItem = {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  assetTitle: string;
  assetSlug: string | null;
  listPrice: number;
  amountCollected: number;
  remaining: number;
};

export type GuestBookingTimelineStep = {
  label: string;
  at: string | null;
};

export type GuestBookingDetail = GuestBookingListItem & {
  createdAt: string | null;
  timeline: GuestBookingTimelineStep[];
  saleName: string | null;
  salePhone: string | null;
  refundAmount: number;
};

/** Money the guest still owes on a booking, never negative. */
export function remainingToPay(
  listPrice: number,
  amountCollected: number
): number {
  return Math.max(0, Number(listPrice || 0) - Number(amountCollected || 0));
}

type AssetJoin = { title?: string; slug?: string } | null;

/** Supabase types a to-one join as an object or array depending on inference. */
function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function loadGuestBookings(
  guestId: string
): Promise<GuestBookingListItem[]> {
  const db = await createClient();
  const { data } = await db
    .from('bookings')
    .select(
      'id, status, check_in, check_out, list_price, amount_collected, assets(title, slug)'
    )
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false });

  return (data || []).map((b) => {
    const asset = firstJoin(b.assets as unknown as AssetJoin | AssetJoin[]);
    const listPrice = Number(b.list_price || 0);
    const amountCollected = Number(b.amount_collected || 0);
    return {
      id: b.id as string,
      status: b.status as string,
      checkIn: b.check_in as string,
      checkOut: b.check_out as string,
      assetTitle: asset?.title || 'Villa',
      assetSlug: asset?.slug || null,
      listPrice,
      amountCollected,
      remaining: remainingToPay(listPrice, amountCollected),
    };
  });
}

export async function loadGuestBookingDetail(
  guestId: string,
  bookingId: string
): Promise<GuestBookingDetail | null> {
  const db = await createClient();
  const { data: b } = await db
    .from('bookings')
    .select(
      'id, status, check_in, check_out, list_price, amount_collected, refund_amount, created_at, confirmed_at, checked_in_at, checked_out_at, cancelled_at, sale_id, assets(title, slug)'
    )
    .eq('guest_id', guestId)
    .eq('id', bookingId)
    .maybeSingle();

  if (!b) return null;

  const { data: sale } = b.sale_id
    ? await db
        .from('profiles')
        .select('full_name, phone')
        .eq('id', b.sale_id)
        .maybeSingle()
    : { data: null };

  const asset = firstJoin(b.assets as unknown as AssetJoin | AssetJoin[]);
  const listPrice = Number(b.list_price || 0);
  const amountCollected = Number(b.amount_collected || 0);

  const timeline: GuestBookingTimelineStep[] = [
    { label: 'Tạo booking', at: (b.created_at as string) || null },
    { label: 'Đã chốt', at: (b.confirmed_at as string) || null },
    { label: 'Nhận phòng', at: (b.checked_in_at as string) || null },
    { label: 'Trả phòng', at: (b.checked_out_at as string) || null },
  ];
  if (b.cancelled_at) {
    timeline.push({ label: 'Đã hủy', at: b.cancelled_at as string });
  }

  return {
    id: b.id as string,
    status: b.status as string,
    checkIn: b.check_in as string,
    checkOut: b.check_out as string,
    assetTitle: asset?.title || 'Villa',
    assetSlug: asset?.slug || null,
    listPrice,
    amountCollected,
    remaining: remainingToPay(listPrice, amountCollected),
    refundAmount: Number(b.refund_amount || 0),
    createdAt: (b.created_at as string) || null,
    timeline,
    saleName: sale?.full_name || null,
    salePhone: sale?.phone || null,
  };
}
