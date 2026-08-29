import { Paper, Stack, Text, Title } from '@mantine/core';
import { getTranslations } from 'next-intl/server';
import { colors, radius } from '@/config/design-tokens';
import type { ResolvedSaleDiscountProgress } from '@/lib/engines/sale-pricing';
import { SaleDiscountAssetList } from '@/components/sale/SaleDiscountAssetList';

export async function SaleMembershipPanel({
  progress,
}: {
  progress: ResolvedSaleDiscountProgress;
}) {
  const t = await getTranslations('sale.membership');

  return (
    <Stack gap="md">
      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Text size="sm" c="dimmed">
          {t('discountNote')}
        </Text>
      </Paper>

      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Title order={5} fw={600} mb="md">
          {t('perAsset')}
        </Title>
        {!progress.assets.length ? (
          <Text size="sm" c="dimmed">
            {t('noCheckout')}
          </Text>
        ) : (
          <SaleDiscountAssetList assets={progress.assets} />
        )}
      </Paper>
    </Stack>
  );
}
