import { PageHeader } from '@/components/ui/PageHeader';
import { AssetForm } from '@/components/owner/NewAssetForm';
import { Paper } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';

export default function NewOwnerAssetPage() {
  return (
    <>
      <PageHeader
        title="New asset"
        description="Villa hoặc Căn hộ · set cost WD/WE — không set giá bán."
      />
      <Paper
        p="lg"
        radius={radius.lg}
        maw={720}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <AssetForm key="create" mode="create" />
      </Paper>
    </>
  );
}
