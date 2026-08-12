import { Text, Stack, Title, Group, SimpleGrid, Paper } from '@mantine/core';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { saleHasActiveSub } from '@/lib/engines/booking-service';
import { resolveSaleCostDiscountPercent } from '@/lib/engines/sale-pricing';
import { quoteAssetCosts } from '@/lib/engines/pricing';
import { parseYearMonth } from '@/lib/dates';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinkButton } from '@/components/ui/LinkButton';
import { StatCard } from '@/components/ui/StatCard';
import { SubscriptionStatusBanner } from '@/components/ui/SubscriptionStatusBanner';
import { AssetCard } from '@/components/marketplace/AssetCard';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { SalePeriodFilter } from '@/components/sale/SalePeriodFilter';
import { colors, radius } from '@/config/design-tokens';

function sumMargin(
  rows: { sale_margin_snapshot: number | null }[] | null | undefined
): number {
  return (rows || []).reduce(
    (s, b) => s + Number(b.sale_margin_snapshot || 0),
    0
  );
}

function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export default async function SaleHomePage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const { ym: ymParam } = await searchParams;
  const period = parseYearMonth(ymParam);
  const profile = await getSessionProfile();
  const active = await saleHasActiveSub(profile!.id);
  const discountPercent = active
    ? await resolveSaleCostDiscountPercent(profile!.id)
    : 0;
  const admin = await createClient();

  const { count: leadCount } = await admin
    .from('lead_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('sale_id', profile!.id)
    .is('read_at', null);

  const { data: upcoming } = await admin
    .from('bookings')
    .select('id, status, check_in, check_out, assets(title)')
    .eq('sale_id', profile!.id)
    .in('status', ['PENDING', 'CONFIRMED', 'CHECKED_IN'])
    .gte('check_in', new Date().toISOString().slice(0, 10))
    .order('check_in', { ascending: true })
    .limit(5);

  const [
    { data: expectedRows },
    { data: periodCheckedOut },
    { count: lifetimeSuccessful },
    { data: sub },
  ] = await Promise.all([
    admin
      .from('bookings')
      .select('sale_margin_snapshot')
      .eq('sale_id', profile!.id)
      .in('status', ['CONFIRMED', 'CHECKED_IN']),
    admin
      .from('bookings')
      .select('sale_margin_snapshot')
      .eq('sale_id', profile!.id)
      .eq('status', 'CHECKED_OUT')
      .gte('checked_out_at', period.startIso)
      .lt('checked_out_at', period.endIso),
    admin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('sale_id', profile!.id)
      .eq('status', 'CHECKED_OUT'),
    admin
      .from('subscriptions')
      .select('period_end')
      .eq('profile_id', profile!.id)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const expectedRevenue = sumMargin(expectedRows);
  const actualRevenue = sumMargin(periodCheckedOut);
  const periodSuccessful = periodCheckedOut?.length || 0;

  const { data: assets } = active
    ? await admin
        .from('assets')
        .select(
          'id, slug, title, location, capacity, bedrooms, bathrooms, property_type, asset_images(url, sort_order), asset_costs(cost_weekday, cost_weekend)'
        )
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(3)
    : { data: [] as never[] };

  const periodLabel = `Tháng ${period.month}/${period.year}`;

  return (
    <Stack gap={40}>
      <PageHeader
        title={`Good morning, ${profile!.full_name?.split(' ')[0] || 'Sale'}`}
        action={<SalePeriodFilter yearMonth={period.yearMonth} />}
      />

      <SubscriptionStatusBanner
        active={active}
        periodEnd={sub?.period_end}
        href="/sale/settings?tab=subscription"
        activeDescription="Xem cost · nhận lead · tạo booking"
        inactiveDescription="Bị hạn chế — gia hạn để mở marketplace và tạo booking"
        activeActionLabel="Subscription"
        inactiveActionLabel="Gia hạn"
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <StatCard
          label="Doanh thu thực"
          value={formatVnd(actualRevenue)}
          hint={periodLabel}
          emphasis="hero"
        />
        <StatCard
          label="Doanh thu dự kiến"
          value={formatVnd(expectedRevenue)}
          hint="Pipeline (confirm + check-in)"
        />
        <StatCard
          label="Booking thành công"
          value={periodSuccessful}
          hint={`${periodLabel} · ${lifetimeSuccessful || 0} lifetime`}
        />
      </SimpleGrid>

      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4} fw={600}>
            Needs action
          </Title>
          {(leadCount || 0) > 0 ? (
            <LinkButton href="/sale/leads" variant="light" color="vbnbGreen" size="xs">
              {leadCount} unread leads
            </LinkButton>
          ) : null}
        </Group>
        {!upcoming?.length ? (
          <Paper p="lg" radius={radius.lg} style={{ border: `1px solid ${colors.border}` }}>
            <Text c="dimmed" size="sm">
              Không có booking sắp tới. Khám phá sàn để tạo booking mới.
            </Text>
            <LinkButton href="/sale/marketplace" color="vbnbGreen" mt="md" size="sm">
              Open marketplace
            </LinkButton>
          </Paper>
        ) : (
          <Stack gap="xs">
            {upcoming.map((b) => {
              const asset = b.assets as unknown as { title: string };
              return (
                <Link
                  key={b.id}
                  href="/sale/bookings"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Paper
                    p="md"
                    radius={radius.lg}
                    style={{ border: `1px solid ${colors.border}` }}
                  >
                    <Group justify="space-between" wrap="wrap">
                      <div>
                        <Text fw={600}>{asset?.title || 'Booking'}</Text>
                        <Text size="sm" c="dimmed">
                          {b.check_in} → {b.check_out}
                        </Text>
                      </div>
                      <BookingStatusBadge status={b.status} />
                    </Group>
                  </Paper>
                </Link>
              );
            })}
          </Stack>
        )}
      </Stack>

      {active ? (
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={4} fw={600}>
              Marketplace opportunities
            </Title>
            <LinkButton href="/sale/marketplace" variant="subtle" color="vbnbGreen">
              View all
            </LinkButton>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            {(assets || []).map((a) => {
              const images = (a.asset_images || []) as {
                url: string;
                sort_order: number;
              }[];
              images.sort((x, y) => x.sort_order - y.sort_order);
              const costs = a.asset_costs as unknown as {
                cost_weekday: number;
                cost_weekend: number;
              };
              const baseWd = Number(costs?.cost_weekday || 0);
              const baseWe = Number(costs?.cost_weekend || 0);
              const quoted = quoteAssetCosts(baseWd, baseWe, discountPercent);
              return (
                <AssetCard
                  key={a.id}
                  asset={{
                    id: a.id,
                    slug: a.slug,
                    title: a.title,
                    location: a.location,
                    capacity: a.capacity,
                    bedrooms: Number(a.bedrooms) || undefined,
                    bathrooms: Number(a.bathrooms) || undefined,
                    propertyType:
                      a.property_type === 'APARTMENT' ||
                      a.property_type === 'VILLA'
                        ? a.property_type
                        : undefined,
                    imageUrl: images[0]?.url,
                    showCost: true,
                    costWeekday: quoted.effectiveWeekday,
                    costWeekend: quoted.effectiveWeekend,
                    baseCostWeekday: quoted.baseWeekday,
                    baseCostWeekend: quoted.baseWeekend,
                    discountPercent: quoted.discountPercent,
                  }}
                />
              );
            })}
          </SimpleGrid>
        </Stack>
      ) : null}
    </Stack>
  );
}
