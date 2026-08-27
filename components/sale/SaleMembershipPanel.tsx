import { Paper, Stack, Text, Title } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import type { ResolvedSaleDiscountProgress } from '@/lib/engines/sale-pricing';
import { SaleDiscountAssetList } from '@/components/sale/SaleDiscountAssetList';

export function SaleMembershipPanel({
  progress,
}: {
  progress: ResolvedSaleDiscountProgress;
}) {
  return (
    <Stack gap="md">
      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Text size="sm" c="dimmed">
          Chiết khấu do Owner set trên từng căn. Căn không có mốc = 0%. Booking
          mới lấy % hiện tại theo số lần check-out của bạn trên căn đó; booking
          đã chốt giữ snapshot.
        </Text>
      </Paper>

      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Title order={5} fw={600} mb="md">
          Theo từng căn
        </Title>
        {!progress.assets.length ? (
          <Text size="sm" c="dimmed">
            Chưa có check-out trên căn nào — chiết khấu 0% khi Owner chưa set
            mốc.
          </Text>
        ) : (
          <SaleDiscountAssetList assets={progress.assets} />
        )}
      </Paper>
    </Stack>
  );
}
