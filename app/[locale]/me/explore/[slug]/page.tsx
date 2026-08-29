import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { localeRedirect } from '@/lib/i18n/navigation';
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
  const t = await getTranslations('guest.explore');
  const { slug } = await params;
  const { lead } = await searchParams;
  const profile = await getSessionProfile();
  if (!profile) return await localeRedirect(`/login?next=/me/explore/${slug}`);
  if (profile.role === 'SALE') return await localeRedirect(`/sale/marketplace/${slug}`);
  if (profile.role === 'OWNER') return await localeRedirect('/owner');
  if (profile.role === 'ADMIN') return await localeRedirect('/admin');

  const asset = await loadAssetDetail(slug);
  if (!asset) notFound();

  return (
    <>
      <Box mb="md">
        <LinkAnchor href="/me/explore" size="sm" c="vbnbGreen.6">
          {t('backToAll')}
        </LinkAnchor>
      </Box>
      <AssetDetailView asset={asset} isLoggedInGuest leadIntent={lead === '1'} />
    </>
  );
}
