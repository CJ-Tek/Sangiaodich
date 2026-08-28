import { createClient } from '@/lib/supabase/server';
import { LIST_VIEW_LIMIT } from '@/lib/supabase/query-guard';
import { getSessionProfile } from '@/lib/auth/session';
import { isSimpleUi } from '@/lib/engines/ui-mode';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { OwnerBookingActions } from '@/components/owner/OwnerBookingActions';
import {
  Alert,
  Avatar,
  Badge,
  Code,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import { rangesOverlap } from '@/lib/engines/inventory';
import { ownerTransferMemo } from '@/lib/engines/booking-search';
import { minOwnerDepositToConfirm } from '@/lib/engines/pricing';
import { ownerPayoutStatus } from '@/lib/owner/payout-info';
import { SalePublicRatingCard } from '@/components/owner/SalePublicRatingCard';
import {
  loadSaleRatingAggregates,
  loadSaleRatingComments,
} from '@/lib/engines/sale-ratings';

function formatVnd(n: number) {
  return n.toLocaleString('vi-VN');
}

export default async function OwnerPendingBookingsPage() {
  const profile = await getSessionProfile();
  const admin = await createClient();

  const { data: assets } = await admin
    .from('assets')
    .select('id, title, location')
    .eq('owner_id', profile!.id)
    .limit(LIST_VIEW_LIMIT);

  const assetIds = (assets || []).map((a) => a.id);
  const assetById = new Map((assets || []).map((a) => [a.id, a]));

  const { data: bookings } = assetIds.length
    ? await admin
        .from('bookings')
        .select(
          `id, asset_id, status, check_in, check_out, submitted_to_owner_at, sale_id,
           owner_earn_snapshot, owner_paid_amount,
           sale_tier_label_snapshot`
        )
        .in('asset_id', assetIds)
        .eq('status', 'AWAITING_OWNER')
        .order('submitted_to_owner_at', { ascending: false })
        .limit(LIST_VIEW_LIMIT)
    : { data: [] as never[] };

  const saleIds = [
    ...new Set((bookings || []).map((b) => b.sale_id).filter(Boolean)),
  ] as string[];

  const saleById = new Map<
    string,
    { full_name: string; avatar_url: string | null; phone: string | null }
  >();

  if (saleIds.length) {
    const { data: sales } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url, phone')
      .in('id', saleIds)
      .eq('role', 'SALE')
      .limit(saleIds.length);
    for (const s of sales || []) {
      saleById.set(s.id, {
        full_name: s.full_name || 'Sale',
        avatar_url: s.avatar_url,
        phone: s.phone,
      });
    }
  }

  const rows = bookings || [];

  const [aggregates, comments] = await Promise.all([
    loadSaleRatingAggregates(saleIds),
    loadSaleRatingComments({ saleIds, limit: 30 }),
  ]);

  /** Per booking: other awaiting ids on same asset with overlapping nights */
  const overlapIdsByBooking = new Map<string, string[]>();
  for (const a of rows) {
    const overlaps: string[] = [];
    for (const b of rows) {
      if (a.id === b.id) continue;
      if (a.asset_id !== b.asset_id) continue;
      if (
        rangesOverlap(
          { checkIn: a.check_in, checkOut: a.check_out },
          { checkIn: b.check_in, checkOut: b.check_out }
        )
      ) {
        overlaps.push(b.id);
      }
    }
    if (overlaps.length) overlapIdsByBooking.set(a.id, overlaps);
  }

  return (
    <>
      <PageHeader
        title="Chờ xác nhận"
        description="Đối chiếu STK với mã CK (VBNB…) rồi Confirm — lịch mới khóa. Nhiều Sale có thể chờ cùng ngày; ai bạn confirm trước sẽ thắng."
      />
      {!rows.length ? (
        <EmptyState
          title="Không có booking chờ"
          description="Khi Sale gửi booking sau khi thu cọc Guest, yêu cầu sẽ hiện tại đây."
          actionLabel="Xem Settlements"
          href="/owner/bookings"
        />
      ) : (
        <Stack gap="sm">
          {rows.map((b) => {
            const asset = assetById.get(b.asset_id);
            const sale = saleById.get(b.sale_id);
            const ownerEarn = Number(b.owner_earn_snapshot || 0);
            const ownerPaid = Number(b.owner_paid_amount || 0);
            const payoutStatus = ownerPayoutStatus({ ownerEarn, ownerPaid });
            const halfCost = minOwnerDepositToConfirm(ownerEarn);
            const memo = ownerTransferMemo(b.id);
            const overlaps = overlapIdsByBooking.get(b.id) || [];
            const shortOverlaps = overlaps.map((id) => id.slice(0, 8));

            return (
              <Paper
                key={b.id}
                p="lg"
                radius={radius.lg}
                style={{
                  border: overlaps.length
                    ? `2px solid ${colors.warning}`
                    : `1px solid ${colors.border}`,
                  background: overlaps.length ? colors.warningSoft : undefined,
                }}
              >
                <Group
                  justify="space-between"
                  align="flex-start"
                  wrap="wrap"
                  mb="md"
                >
                  <div>
                    <Text fw={600}>{asset?.title || 'Asset'}</Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      {b.check_in} → {b.check_out}
                      {asset?.location ? ` · ${asset.location}` : ''}
                    </Text>
                    <Group gap="sm" mt={8} wrap="nowrap">
                      <Avatar
                        src={sale?.avatar_url || undefined}
                        size={28}
                        radius="xl"
                        color="vbnbGreen"
                      >
                        {(sale?.full_name || '?').slice(0, 1).toUpperCase()}
                      </Avatar>
                      <div>
                        <Group gap="xs" wrap="wrap" align="center">
                          <Text size="sm" fw={500}>
                            {sale?.full_name || 'Sale'}
                          </Text>
                          <SalePublicRatingCard
                            aggregate={aggregates.get(b.sale_id) ?? null}
                            comments={comments.filter(
                              (c) => c.saleId === b.sale_id
                            )}
                          />
                        </Group>
                        <Text size="xs" c="dimmed">
                          {sale?.phone || '—'}
                          {b.sale_tier_label_snapshot
                            ? ` · ${b.sale_tier_label_snapshot}`
                            : ''}
                        </Text>
                      </div>
                    </Group>
                  </div>
                  <Group gap="xs">
                    <BookingStatusBadge status={b.status} />
                    {overlaps.length ? (
                      <Badge color="yellow" variant="filled">
                        Trùng ngày
                      </Badge>
                    ) : null}
                  </Group>
                </Group>

                {overlaps.length ? (
                  <Alert color="yellow" mb="md" title="Trùng lịch với booking chờ khác">
                    Cùng asset / overlap với:{' '}
                    {shortOverlaps.map((s) => `#${s}`).join(', ')}. Ai confirm
                    trước sẽ khóa ngày; cái còn lại sẽ fail nếu trùng.
                  </Alert>
                ) : null}

                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="md">
                  <div>
                    <Text size="xs" c="dimmed">
                      Mã CK (search Settlements)
                    </Text>
                    <Code>{memo}</Code>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Gợi ý cọc 50% cost
                    </Text>
                    <Text size="sm" fw={600}>
                      {formatVnd(halfCost)}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Sale cần gửi bạn
                    </Text>
                    <Text size="sm" fw={600} c="vbnbGreen.6">
                      {formatVnd(ownerEarn)}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Sale đã ghi CK
                    </Text>
                    <Text size="sm" fw={500}>
                      {formatVnd(ownerPaid)}
                      {payoutStatus === 'full'
                        ? ' · đủ'
                        : payoutStatus === 'partial'
                          ? ' · một phần'
                          : ' · chưa'}
                    </Text>
                  </div>
                </SimpleGrid>
                <Text size="xs" c="dimmed" mb="md">
                  Gửi lúc:{' '}
                  {b.submitted_to_owner_at
                    ? new Date(b.submitted_to_owner_at).toLocaleString('vi-VN')
                    : '—'}
                </Text>

                <OwnerBookingActions
                  bookingId={b.id}
                  requireStkCheck={!isSimpleUi(profile!.uiMode)}
                />
              </Paper>
            );
          })}
        </Stack>
      )}
    </>
  );
}
