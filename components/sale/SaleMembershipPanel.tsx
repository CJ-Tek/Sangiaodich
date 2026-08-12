import { Paper, Text, Stack, Title } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import type { ResolvedSaleMembership } from '@/lib/engines/sale-pricing';

export function SaleMembershipPanel({
  membership,
}: {
  membership: ResolvedSaleMembership;
}) {
  const volume = membership.lifetimeCostVolume;
  const current = membership.tiers.find((t) => t.id === membership.tierId);
  const sorted = [...membership.tiers].sort((a, b) => a.sort - b.sort);
  const next = sorted.find((t) => t.sort === (current?.sort ?? 0) + 1);
  const toNext = next
    ? Math.max(0, next.minLifetimeCostVolume - volume)
    : null;

  return (
    <Stack gap="md">
      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Text size="sm" c="dimmed">
          Hạng hiện tại
        </Text>
        <Title order={3} fw={600} mt={4}>
          {membership.tierLabel || 'Tier 0'}
        </Title>
        <Text size="sm" mt={8} fw={500} c="vbnbGreen.6">
          −{membership.discountPercent}% trên base cost
        </Text>
        <Text size="sm" c="dimmed" mt={6}>
          Lifetime cost volume: {volume.toLocaleString('vi-VN')}đ
        </Text>
        {next ? (
          <Text size="sm" c="dimmed" mt={4}>
            Còn {toNext?.toLocaleString('vi-VN')}đ để lên {next.label} (−
            {next.costDiscountPercent}%)
          </Text>
        ) : (
          <Text size="sm" c="dimmed" mt={4}>
            Đã ở hạng cao nhất hiện có.
          </Text>
        )}
      </Paper>

      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Text size="sm" c="dimmed" mb="md">
          Bảng tier (platform)
        </Text>
        <Stack gap="sm">
          {sorted.map((t) => (
            <div key={t.id}>
              <Text fw={600} size="sm">
                {t.label}
                {membership.tierId === t.id ? ' · đang áp dụng' : ''}
              </Text>
              <Text size="xs" c="dimmed">
                Từ {t.minLifetimeCostVolume.toLocaleString('vi-VN')}đ volume · −
                {t.costDiscountPercent}% cost
              </Text>
            </div>
          ))}
          {sorted.length === 0 ? (
            <Text size="sm" c="dimmed">
              Chưa có tier — Admin cấu hình trong Settings.
            </Text>
          ) : null}
        </Stack>
      </Paper>
    </Stack>
  );
}
