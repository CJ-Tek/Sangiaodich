import { getTranslations } from 'next-intl/server';
import { Badge, Group, Image, Paper, Stack, Text } from '@mantine/core';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { AdminAssetFilters } from '@/components/admin/AdminAssetFilters';
import { VillaPagination } from '@/components/marketplace/VillaPagination';
import { listAdminAssets } from '@/lib/engines/admin-assets-list';
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
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q: qParam, status: statusParam, page: pageParam } = await searchParams;
  const t = await getTranslations('admin.assets');
  const tPropertyTypes = await getTranslations('propertyTypes');
  const { assets, counts, q, status, page, totalPages, total } =
    await listAdminAssets({
      q: qParam,
      status: statusParam,
      page: pageParam,
    });

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <AdminAssetFilters q={q} status={status} counts={counts} />
      {!assets.length ? (
        <EmptyState
          title={
            q || status !== 'pending'
              ? t('emptyNotFound')
              : t('emptyNoAssets')
          }
          description={
            q
              ? t('emptySearchHint')
              : status === 'pending'
                ? t('emptyPendingHint')
                : t('emptyStatusHint')
          }
          actionLabel={
            q || status !== 'pending' ? t('clearFilters') : undefined
          }
          href={q || status !== 'pending' ? '/admin/assets' : undefined}
        />
      ) : (
        <>
          <Stack gap="sm">
            {assets.map((a) => {
              const owner = ownerNameOf(a.profiles);
              const tone = adminAssetStatusTone(a.status);
              const images = (a.asset_images || []).sort(
                (b, c) => b.sort_order - c.sort_order
              );
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
                        {propertyTypeLabel(propertyType, tPropertyTypes)} ·{' '}
                        {a.location} · {t('ownerLabel')}:{' '}
                        {owner || '—'} ·{' '}
                        {t('imagesCount', { count: images.length })}
                      </Text>
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {a.description?.trim() || t('noDescription')}
                      </Text>
                      <LinkAnchor href={`/admin/assets/${a.id}`} size="sm">
                        {t('viewDetail')}
                      </LinkAnchor>
                    </Stack>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
          <VillaPagination
            page={page}
            totalPages={totalPages}
            total={total}
            itemLabel={t('itemLabel')}
          />
        </>
      )}
    </>
  );
}
