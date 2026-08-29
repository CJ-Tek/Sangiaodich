import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { AssetForm } from '@/components/owner/NewAssetForm';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';

export default async function NewOwnerAssetPage() {
  const t = await getTranslations('owner.assetNew');
  const tAssets = await getTranslations('owner.assets');
  const profile = await getSessionProfile();
  const admin = await createClient();
  const { count } = await admin
    .from('assets')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', profile!.id)
    .eq('status', 'DRAFT');

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[
          { label: tAssets('title'), href: '/owner/assets' },
          { label: t('breadcrumb') },
        ]}
      />
      <SurfaceCard maw={720}>
        <AssetForm key="create" mode="create" draftCount={count ?? 0} />
      </SurfaceCard>
    </>
  );
}
