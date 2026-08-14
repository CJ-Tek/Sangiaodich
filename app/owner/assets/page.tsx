import { Paper, Stack, Text } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import {
  DASHBOARD_ASSET_PAGE_SIZE,
  parseDashboardPage,
} from '@/lib/supabase/query-guard';
import { getSessionProfile } from '@/lib/auth/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { OwnerAssetReviewControls } from '@/components/owner/OwnerAssetReviewControls';
import { VillaPagination } from '@/components/marketplace/VillaPagination';
import { colors, radius } from '@/config/design-tokens';

const ASSET_COLUMNS =
  'id, title, status, slug, location, property_type, bedrooms, bathrooms, asset_costs(cost_weekday, cost_weekend)';

export default async function OwnerAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const pageSize = DASHBOARD_ASSET_PAGE_SIZE;
  let page = parseDashboardPage(pageParam);
  const profile = await getSessionProfile();
  const admin = await createClient();

  const from = (page - 1) * pageSize;
  const first = await admin
    .from('assets')
    .select(ASSET_COLUMNS, { count: 'exact' })
    .eq('owner_id', profile!.id)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  let assets = first.data;
  const total = first.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / pageSize));

  if (page > 1 && !(assets || []).length && total > 0) {
    page = totalPages;
    const retryFrom = (page - 1) * pageSize;
    const retry = await admin
      .from('assets')
      .select(ASSET_COLUMNS, { count: 'exact' })
      .eq('owner_id', profile!.id)
      .order('created_at', { ascending: false })
      .range(retryFrom, retryFrom + pageSize - 1);
    assets = retry.data;
  }

  page = Math.min(page, totalPages);

  return (
    <>
      <PageHeader
        title="Properties"
        description="CRUD + cost WD/WE. Submit duyệt để lên sàn."
        action={
          <LinkButton href="/owner/assets/new" color="vbnbGreen">
            New asset
          </LinkButton>
        }
      />
      {!assets?.length ? (
        <EmptyState
          title="Chưa có asset"
          description="Tạo listing đầu tiên để gửi duyệt."
          actionLabel="New asset"
          href="/owner/assets/new"
        />
      ) : (
        <>
          <Stack gap="sm">
            {assets.map((a) => {
              const costs = a.asset_costs as unknown as {
                cost_weekday: number;
                cost_weekend: number;
              };
              return (
                <Paper
                  key={a.id}
                  p="lg"
                  radius={radius.lg}
                  style={{ border: `1px solid ${colors.border}` }}
                >
                  <OwnerAssetReviewControls assetId={a.id} status={a.status}>
                    <div>
                      <Text fw={600}>{a.title}</Text>
                      <Text size="sm" c="dimmed" mt={4}>
                        {a.property_type === 'APARTMENT' ? 'Căn hộ' : 'Villa'}
                        {a.location ? ` · ${a.location}` : ''}
                        {` · ${Number(a.bedrooms) || 0} PN · ${Number(a.bathrooms) || 0} WC`}
                      </Text>
                      <Text size="sm" c="dimmed" mt={6}>
                        Cost WD {Number(costs?.cost_weekday || 0).toLocaleString('vi-VN')} · WE{' '}
                        {Number(costs?.cost_weekend || 0).toLocaleString('vi-VN')}
                      </Text>
                    </div>
                  </OwnerAssetReviewControls>
                </Paper>
              );
            })}
          </Stack>
          <VillaPagination
            page={page}
            totalPages={totalPages}
            total={total}
            itemLabel="asset"
          />
        </>
      )}
    </>
  );
}
