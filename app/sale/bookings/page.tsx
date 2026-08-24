import { createClient } from '@/lib/supabase/server';
import { LIST_VIEW_LIMIT } from '@/lib/supabase/query-guard';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  BookingStatusFilter,
  type BookingFilterStatus,
} from '@/components/sale/BookingStatusFilter';
import {
  SaleBookingsList,
  type SaleBookingListItem,
} from '@/components/sale/SaleBookingsList';
import { Stack } from '@mantine/core';
import { previewPricing } from '@/lib/engines/pricing';
import { resolveSaleCostDiscountPercent } from '@/lib/engines/sale-pricing';
import {
  hasOwnerPayoutInfo,
  mapOwnerPayoutInfo,
} from '@/lib/owner/payout-info';

const FILTER_META: Record<
  BookingFilterStatus,
  { emptyTitle: string; emptyDescription: string }
> = {
  ALL: {
    emptyTitle: 'Chưa có booking',
    emptyDescription: 'Booking của bạn sẽ hiện ở đây.',
  },
  PENDING: {
    emptyTitle: 'Không có booking chờ gửi Owner',
    emptyDescription: 'Thu cọc Guest ≥50% rồi bấm Gửi Owner.',
  },
  AWAITING_OWNER: {
    emptyTitle: 'Không có booking chờ Owner',
    emptyDescription: 'Đã gửi Owner — chờ chủ nhà xác nhận (ngày chưa khóa).',
  },
  CONFIRMED: {
    emptyTitle: 'Không có booking đã xác nhận',
    emptyDescription: 'Owner đã chốt — chủ nhà check-in khi khách đến.',
  },
  CHECKED_IN: {
    emptyTitle: 'Không có booking đang check-in',
    emptyDescription: 'Booking đã check-in sẽ hiện ở đây.',
  },
  CHECKED_OUT: {
    emptyTitle: 'Không có booking đã check-out',
    emptyDescription: 'Booking hoàn tất stay sẽ hiện ở đây.',
  },
  CANCELLED: {
    emptyTitle: 'Không có booking đã hủy',
    emptyDescription: 'Chỉ hiện khi bạn chọn tab Đã hủy.',
  },
};

function parseStatus(raw?: string): BookingFilterStatus {
  if (
    raw === 'ALL' ||
    raw === 'CONFIRMED' ||
    raw === 'AWAITING_OWNER' ||
    raw === 'CHECKED_IN' ||
    raw === 'CHECKED_OUT' ||
    raw === 'CANCELLED' ||
    raw === 'PENDING'
  ) {
    return raw;
  }
  return 'PENDING';
}

type OwnerProfile = {
  full_name: string | null;
  phone: string | null;
  payout_bank_name: string | null;
  payout_account_name: string | null;
  payout_account_number: string | null;
  payout_vietqr_bank: string | null;
  payout_qr_image_url: string | null;
  payout_note: string | null;
};

export default async function SaleBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const filter = parseStatus(statusParam);
  const profile = await getSessionProfile();
  const discountPercent = await resolveSaleCostDiscountPercent(profile!.id);
  const admin = await createClient();
  const { data: salePayoutRow } = await admin
    .from('profiles')
    .select(
      'payout_bank_name, payout_account_name, payout_account_number, payout_vietqr_bank, payout_qr_image_url, payout_note'
    )
    .eq('id', profile!.id)
    .maybeSingle();
  const salePayoutReady = hasOwnerPayoutInfo(mapOwnerPayoutInfo(salePayoutRow));
  let bookingsQuery = admin
    .from('bookings')
    .select(
      `id, status, check_in, check_out, list_price, amount_collected,
       effective_cost_snapshot, owner_earn_snapshot, owner_paid_amount,
       owner_payout_bank_name_snapshot, owner_payout_account_name_snapshot,
       owner_payout_account_number_snapshot,
       refund_amount, refund_kept_amount, refund_percent, cancellation_policy, cancel_reason,
       assets(
         title,
         asset_costs(cost_weekday, cost_weekend),
         profiles!assets_owner_id_fkey(
           full_name, phone,
           payout_bank_name, payout_account_name, payout_account_number,
           payout_vietqr_bank, payout_qr_image_url, payout_note
         )
       ),
       profiles!bookings_guest_id_fkey(full_name, phone)`
    )
    .eq('sale_id', profile!.id);
  if (filter !== 'ALL') {
    bookingsQuery = bookingsQuery.eq('status', filter);
  }
  const { data: bookings } = await bookingsQuery
    .order('created_at', { ascending: false })
    .limit(LIST_VIEW_LIMIT);

  const empty = FILTER_META[filter];

  const items: SaleBookingListItem[] = (bookings || []).map((b) => {
    const asset = b.assets as unknown as {
      title: string;
      asset_costs:
        | { cost_weekday: number; cost_weekend: number }
        | { cost_weekday: number; cost_weekend: number }[]
        | null;
      profiles: OwnerProfile | OwnerProfile[] | null;
    };
    const guest = b.profiles as unknown as {
      full_name: string;
      phone: string;
    };
    const ownerRaw = asset?.profiles;
    const owner = Array.isArray(ownerRaw) ? ownerRaw[0] : ownerRaw;
    const costsRaw = asset?.asset_costs;
    const costs = Array.isArray(costsRaw) ? costsRaw[0] : costsRaw;

    let floor =
      b.effective_cost_snapshot != null
        ? Number(b.effective_cost_snapshot)
        : NaN;
    if (!Number.isFinite(floor) && costs) {
      floor = previewPricing({
        checkIn: b.check_in,
        checkOut: b.check_out,
        costWeekday: Number(costs.cost_weekday),
        costWeekend: Number(costs.cost_weekend),
        listSelling: Number(b.list_price),
        saleCostDiscountPercent: discountPercent,
      }).effectiveCost;
    }
    if (!Number.isFinite(floor)) floor = 0;

    const list = Number(b.list_price);
    const margin = list - floor;
    const ownerEarn =
      b.owner_earn_snapshot != null ? Number(b.owner_earn_snapshot) : floor;
    const ownerPaid = Number(b.owner_paid_amount || 0);

    const livePayout = mapOwnerPayoutInfo(owner);
    const payout =
      b.status === 'PENDING'
        ? livePayout
        : {
            bankName:
              b.owner_payout_bank_name_snapshot?.trim() || livePayout.bankName,
            accountName:
              b.owner_payout_account_name_snapshot?.trim() ||
              livePayout.accountName,
            accountNumber:
              b.owner_payout_account_number_snapshot?.trim() ||
              livePayout.accountNumber,
            vietqrBank: livePayout.vietqrBank,
            qrImageUrl: livePayout.qrImageUrl,
            note: livePayout.note,
          };

            const showOwnerPayout =
              b.status === 'PENDING' ||
              b.status === 'AWAITING_OWNER' ||
              b.status === 'CONFIRMED' ||
              b.status === 'CHECKED_IN' ||
              b.status === 'CHECKED_OUT';

    return {
      id: b.id,
      status: b.status,
      check_in: b.check_in,
      check_out: b.check_out,
      villaTitle: asset?.title || 'Villa',
      guestName: guest?.full_name || 'Khách',
      guestPhone: guest?.phone || '',
      ownerName: owner?.full_name || 'Owner',
      ownerPhone: owner?.phone || '',
      list,
      margin,
      floor,
      ownerEarn,
      ownerPaid,
      amountCollected:
        b.amount_collected != null ? Number(b.amount_collected) : null,
      refund_amount: b.refund_amount != null ? Number(b.refund_amount) : null,
      refund_kept_amount:
        b.refund_kept_amount != null ? Number(b.refund_kept_amount) : null,
      refund_percent:
        b.refund_percent != null ? Number(b.refund_percent) : null,
      cancellation_policy: b.cancellation_policy,
      cancel_reason: b.cancel_reason,
      showOwnerPayout,
      payout,
      salePayoutReady,
    };
  });

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Thu cọc Guest → Xác nhận CK Owner (50% hoặc đủ) → Gửi Owner. Owner confirm mới khóa lịch."
      />
      <Stack gap="md" mb="lg">
        <BookingStatusFilter value={filter} />
      </Stack>
      <SaleBookingsList
        items={items}
        emptyTitle={empty.emptyTitle}
        emptyDescription={empty.emptyDescription}
      />
    </>
  );
}
