import { Box, Skeleton, Stack, SimpleGrid } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';

export function AssetCardSkeleton() {
  return (
    <Stack gap="md">
      <Skeleton height={200} radius={radius.lg} />
      <Skeleton height={20} width="70%" radius="sm" />
      <Skeleton height={14} width="40%" radius="sm" />
    </Stack>
  );
}

export function DashboardSkeleton() {
  return (
    <Stack gap="xl">
      <Skeleton height={48} width={200} radius="sm" />
      <Skeleton height={56} width={120} radius="sm" />
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Skeleton height={88} radius={radius.lg} />
        <Skeleton height={88} radius={radius.lg} />
        <Skeleton height={88} radius={radius.lg} />
      </SimpleGrid>
    </Stack>
  );
}

/**
 * Route-level fallback shared by the role sections. Kept neutral (header plus
 * blocks) because one boundary covers both dashboards and list pages.
 */
export function RouteSkeleton() {
  return (
    <Stack gap="xl">
      <Stack gap={6}>
        <Skeleton height={32} width={220} radius="sm" />
        <Skeleton height={14} width={320} radius="sm" />
      </Stack>
      <Stack gap="sm">
        <Skeleton height={72} radius={radius.lg} />
        <Skeleton height={72} radius={radius.lg} />
        <Skeleton height={72} radius={radius.lg} />
      </Stack>
    </Stack>
  );
}

export function PageSkeleton() {
  return (
    <Box
      p="md"
      style={{
        background: colors.background,
        minHeight: 240,
      }}
    >
      <DashboardSkeleton />
    </Box>
  );
}
