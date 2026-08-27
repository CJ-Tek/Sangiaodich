import { PageHeader } from '@/components/ui/PageHeader';
import { AssetForm } from '@/components/owner/NewAssetForm';
import { Paper } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { colors, radius } from '@/config/design-tokens';

export default async function NewOwnerAssetPage() {
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
        title="New asset"
        description="Villa hoặc Căn hộ · set cost WD/WE và chiết khấu Sale theo căn — không set giá bán."
      />
      <Paper
        p="lg"
        radius={radius.lg}
        maw={720}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <AssetForm key="create" mode="create" draftCount={count ?? 0} />
      </Paper>
    </>
  );
}
