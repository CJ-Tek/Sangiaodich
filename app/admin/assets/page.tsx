import { Badge, Group, Image, Paper, Stack, Text } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { AdminAssetFilters } from '@/components/admin/AdminAssetFilters';
import {
  ADMIN_ASSET_FILTER_DB,
  matchesAdminAssetQuery,
  parseAdminAssetFilter,
  type AdminAssetFilterStatus,
} from '@/components/admin/admin-asset-filters';
import { adminAssetStatusTone } from '@/components/admin/admin-asset-status';
import { isPropertyType, propertyTypeLabel } from '@/config/asset-tags';
import { colors, radius } from '@/config/design-tokens';

const PLACEHOLDER = 'https://placehold.co/240x160/F3F3EF/536B58?text=VBNB';

function ownerNameOf(profiles: unknown): string {
  return (profiles as { full_name?: string } | null)?.full_name || '';
}

export default async function AdminAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q: qParam, status: statusParam } = await searchParams;
  const q = (qParam || '').trim();
  const status = parseAdminAssetFilter(statusParam);

  const admin = await createClient();
  const { data: assets } = await admin
    .from('assets')
    .select(
      'id, title, description, status, location, slug, property_type, profiles!assets_owner_id_fkey(full_name), asset_images(url, sort_order)'
    )
    .order('created_at', { ascending: false });

  const rows = assets || [];
  const counts: Record<AdminAssetFilterStatus, number> = {
    all: rows.length,
    pending: rows.filter((a) => a.status === 'PENDING_REVIEW').length,
    active: rows.filter((a) => a.status === 'ACTIVE').length,
    reject: rows.filter((a) => a.status === 'REJECTED').length,
    suspend: rows.filter((a) => a.status === 'SUSPENDED').length,
  };

  const byStatus =
    status === 'all'
      ? rows
      : rows.filter((a) => a.status === ADMIN_ASSET_FILTER_DB[status]);

  const ordered = byStatus.filter((a) =>
    matchesAdminAssetQuery(q, {
      id: a.id,
      slug: a.slug,
      title: a.title,
      location: a.location,
      description: a.description,
      ownerName: ownerNameOf(a.profiles),
    })
  );

  return (
    <>
      <PageHeader
        title="Asset approval"
        description="Mở chi tiết để xem ảnh + mô tả, rồi duyệt. PENDING_REVIEW → ACTIVE lên sàn."
      />
      <AdminAssetFilters q={q} status={status} counts={counts} />
      {!ordered.length ? (
        <EmptyState
          title={q || status !== 'pending' ? 'Không tìm thấy' : 'Không có asset'}
          description={
            q
              ? 'Thử từ khóa khác hoặc đổi trạng thái.'
              : status === 'pending'
                ? 'Chưa có listing chờ duyệt.'
                : 'Không có asset ở trạng thái này.'
          }
          actionLabel={q || status !== 'pending' ? 'Xóa bộ lọc' : undefined}
          href={q || status !== 'pending' ? '/admin/assets' : undefined}
        />
      ) : (
        <Stack gap="sm">
          {ordered.map((a) => {
            const owner = ownerNameOf(a.profiles);
            const tone = adminAssetStatusTone(a.status);
            const images = (
              (a.asset_images || []) as { url: string; sort_order: number }[]
            ).sort((b, c) => b.sort_order - c.sort_order);
            const cover = images[0]?.url || PLACEHOLDER;
            const propertyType = isPropertyType(a.property_type)
              ? a.property_type
              : 'VILLA';

            return (
              <Paper
                key={a.id}
                p="md"
                radius={radius.lg}
                style={{ border: `1px solid ${colors.border}` }}
              >
                <Group align="flex-start" wrap="nowrap" gap="md">
                  <Image
                    src={cover}
                    alt={a.title}
                    w={120}
                    h={88}
                    fit="cover"
                    radius={radius.md}
                    style={{ flexShrink: 0, background: colors.surfaceMuted }}
                  />
                  <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                    <Group justify="space-between" wrap="wrap" gap="xs">
                      <Text fw={600}>{a.title}</Text>
                      <Badge
                        variant="outline"
                        styles={{
                          root: {
                            background: tone.bg,
                            color: tone.text,
                            borderColor: tone.border,
                          },
                        }}
                      >
                        {a.status}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {propertyTypeLabel(propertyType)} · {a.location} · Owner:{' '}
                      {owner || '—'} · {images.length} ảnh
                    </Text>
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {a.description?.trim() || 'Chưa có mô tả.'}
                    </Text>
                    <LinkAnchor href={`/admin/assets/${a.id}`} size="sm">
                      Xem chi tiết
                    </LinkAnchor>
                  </Stack>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      )}
    </>
  );
}
