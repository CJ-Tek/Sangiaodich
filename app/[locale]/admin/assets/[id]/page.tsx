import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Alert, Badge, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { AdminAssetActions } from '@/components/admin/AdminAssetActions';
import { adminAssetStatusTone } from '@/components/admin/admin-asset-status';
import {
  AssetDetailGallery,
  AssetDetailInfo,
} from '@/components/marketplace/AssetDetailBody';
import { isPropertyType, propertyTypeLabel } from '@/config/asset-tags';
import { colors, radius } from '@/config/design-tokens';

export default async function AdminAssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations('admin.assets');
  const tPropertyTypes = await getTranslations('propertyTypes');
  const admin = await createClient();
  const { data: asset } = await admin
    .from('assets')
    .select(
      'id, title, description, location, slug, status, capacity, bedrooms, bathrooms, property_type, tags, profiles!assets_owner_id_fkey(full_name), asset_images(url, sort_order)'
    )
    .eq('id', id)
    .neq('status', 'DRAFT')
    .maybeSingle();

  if (!asset) notFound();

  const owner = asset.profiles as unknown as { full_name: string } | null;
  const images = (
    (asset.asset_images || []) as { url: string; sort_order: number }[]
  ).sort((a, b) => a.sort_order - b.sort_order);
  const tags = Array.isArray(asset.tags) ? (asset.tags as string[]) : [];
  const propertyType = isPropertyType(asset.property_type)
    ? asset.property_type
    : 'VILLA';
  const tone = adminAssetStatusTone(asset.status);

  return (
    <>
      <LinkAnchor href="/admin/assets" size="sm" c="dimmed" mb="sm" display="inline-block">
        {t('backToList')}
      </LinkAnchor>
      <PageHeader
        title={asset.title}
        description={`${propertyTypeLabel(propertyType, tPropertyTypes)} · ${asset.location} · ${t('ownerLabel')}: ${owner?.full_name || '—'} · /a/${asset.slug}`}
        action={
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
            {asset.status}
          </Badge>
        }
      />

      <Stack gap="xl" pb="xl">
        <AssetDetailGallery title={asset.title} images={images} />

        <SimpleGrid cols={{ base: 1, md: 5 }} spacing="xl">
          <Stack gap="md" style={{ gridColumn: 'span 3' }}>
            {!images.length ? (
              <Alert color="yellow" title={t('noImagesTitle')}>
                {t('noImagesBody')}
              </Alert>
            ) : null}
            {!asset.description?.trim() ? (
              <Alert color="yellow" title={t('noDescTitle')}>
                {t('noDescBody')}
              </Alert>
            ) : null}
            <AssetDetailInfo
              asset={{
                title: asset.title,
                description: asset.description,
                location: asset.location,
                capacity: Number(asset.capacity) || 0,
                bedrooms: Number(asset.bedrooms) || 0,
                bathrooms: Number(asset.bathrooms) || 0,
                propertyType: asset.property_type,
                tags,
                images,
              }}
            />
          </Stack>

          <Paper
            p="lg"
            radius={radius.lg}
            style={{
              gridColumn: 'span 2',
              border: `1px solid ${colors.border}`,
              alignSelf: 'start',
            }}
          >
            <Text fw={600} mb="sm">
              {t('decisionTitle')}
            </Text>
            <Text size="sm" c="dimmed" mb="md">
              {t('decisionHint')}
            </Text>
            <AdminAssetActions assetId={asset.id} />
          </Paper>
        </SimpleGrid>
      </Stack>
    </>
  );
}
