import { Badge, Group, Stack, Text, Title } from '@mantine/core';
import {
  ASSET_TAG_GROUPS,
  ASSET_TAGS,
  assetTagLabel,
  isPropertyType,
  propertyTypeLabel,
  type AssetTagGroupId,
} from '@/config/asset-tags';
import { colors } from '@/config/design-tokens';

export { AssetDetailGallery } from '@/components/marketplace/AssetDetailGallery';

export type AssetDetailData = {
  title: string;
  description: string | null;
  location: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string | null;
  tags: string[];
  images: { url: string; sort_order: number }[];
};

export function AssetDetailInfo({ asset }: { asset: AssetDetailData }) {
  const propertyType = isPropertyType(asset.propertyType)
    ? asset.propertyType
    : 'VILLA';
  const tags = asset.tags;

  return (
    <Stack gap="md">
      <div>
        <Group gap="sm" mb={6}>
          <Badge variant="light" color="vbnbGreen">
            {propertyTypeLabel(propertyType)}
          </Badge>
        </Group>
        <Title order={1} fw={600} style={{ letterSpacing: '-0.02em' }}>
          {asset.title}
        </Title>
        <Text c="dimmed" mt={6}>
          {asset.location}
        </Text>
        <Text size="sm" c="dimmed" mt={4}>
          {asset.capacity} khách · {asset.bedrooms} PN · {asset.bathrooms} WC
        </Text>
      </div>
      {asset.description ? (
        <Text style={{ lineHeight: 1.7, color: colors.textSecondary }}>
          {asset.description}
        </Text>
      ) : null}
      {tags.length > 0
        ? ASSET_TAG_GROUPS.map((group) => {
            const inGroup = tags.filter((id) =>
              ASSET_TAGS.some(
                (t) => t.id === id && t.group === (group.id as AssetTagGroupId)
              )
            );
            if (!inGroup.length) return null;
            return (
              <Stack key={group.id} gap={8}>
                <Text size="sm" fw={600}>
                  {group.label}
                </Text>
                <Group gap={8}>
                  {inGroup.map((id) => (
                    <Badge key={id} variant="outline" color="gray">
                      {assetTagLabel(id)}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            );
          })
        : null}
    </Stack>
  );
}
