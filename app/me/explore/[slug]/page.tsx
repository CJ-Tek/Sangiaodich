import { notFound, redirect } from 'next/navigation';
import { Box } from '@mantine/core';
import { getSessionProfile } from '@/lib/auth/session';
import { LinkAnchor } from '@/components/ui/LinkAnchor';
import { AssetDetailView } from '@/components/marketplace/AssetDetailView';
import { loadAssetDetail } from '@/lib/engines/asset-detail';

export default async function GuestExploreDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lead?: string }>;
}) {
  const { slug } = await params;
  const { lead } = await searchParams;
  const profile = await getSessionProfile();
  if (!profile) redirect(`/login?next=/me/explore/${slug}`);
  if (profile.role === 'SALE') redirect(`/sale/marketplace/${slug}`);
  if (profile.role === 'OWNER') redirect('/owner');
  if (profile.role === 'ADMIN') redirect('/admin');

  const asset = await loadAssetDetail(slug);
  if (!asset) notFound();

  return (
    <>
      <Box mb="md">
        <LinkAnchor href="/me/explore" size="sm" c="vbnbGreen.6">
          ← Tất cả villa
        </LinkAnchor>
      </Box>
      <AssetDetailView asset={asset} isLoggedInGuest leadIntent={lead === '1'} />
    </>
  );
}
