import { Box, Group, SimpleGrid, Title } from '@mantine/core';
import { AssetCard, type AssetCardData } from '@/components/marketplace/AssetCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { landingContainer } from '@/components/landing/landing-media';

export function FeaturedStays({ assets }: { assets: AssetCardData[] }) {
  return (
    <Box
      component="section"
      aria-labelledby="featured-heading"
      style={{
        ...landingContainer,
        paddingTop: 'clamp(48px, 8vw, 96px)',
        paddingBottom: 'clamp(48px, 8vw, 96px)',
      }}
    >
      <Group justify="space-between" align="baseline" mb="xl">
        <Title
          id="featured-heading"
          order={2}
          fw={700}
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
            letterSpacing: '-0.03em',
          }}
        >
          Villa nổi bật
        </Title>
        <LinkButton href="/marketplace" variant="subtle" color="vbnbGreen">
          Khám phá tất cả
        </LinkButton>
      </Group>

      {!assets.length ? (
        <EmptyState
          title="Chưa có listing"
          description="Asset ACTIVE sẽ xuất hiện tại đây sau khi admin duyệt."
          actionLabel="Đăng nhập"
          href="/login"
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
