import { notFound } from 'next/navigation';
import { localeRedirect } from '@/lib/i18n/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { GuestShell } from '@/components/shells/GuestShell';
import { AssetDetailView } from '@/components/marketplace/AssetDetailView';
import { loadAssetDetail } from '@/lib/engines/asset-detail';

export const revalidate = 60;

export default async function AssetPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lead?: string }>;
}) {
  const { slug } = await params;
  const { lead } = await searchParams;
  const profile = await getSessionProfile();
  if (profile?.role === 'SALE') {
    return await localeRedirect(`/sale/marketplace/${slug}`);
  }
  if (profile?.role === 'GUEST') {
    return await localeRedirect(
      lead === '1' ? `/me/explore/${slug}?lead=1` : `/me/explore/${slug}`
    );
  }

  const asset = await loadAssetDetail(slug);
  if (!asset) notFound();

  return (
    <GuestShell isLoggedIn={!!profile}>
      <AssetDetailView
        asset={asset}
        isLoggedInGuest={false}
        leadIntent={lead === '1'}
      />
    </GuestShell>
  );
}
