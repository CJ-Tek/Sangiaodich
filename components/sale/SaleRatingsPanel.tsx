import { Paper, Stack, Text, Group } from '@mantine/core';
import { colors, radius } from '@/config/design-tokens';
import type {
  SaleRatingAggregate,
  SaleRatingComment,
} from '@/lib/engines/sale-ratings';

function formatAvg(n: number): string {
  return Number(n).toLocaleString('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

export function SaleRatingsPanel({
  aggregate,
  comments,
}: {
  aggregate: SaleRatingAggregate | null;
  comments: SaleRatingComment[];
}) {
  return (
    <Stack gap="md">
      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Text size="sm" c="dimmed">
          Điểm Owner chấm sau check-out
        </Text>
        {!aggregate || aggregate.ratingCount <= 0 ? (
          <Text size="sm" mt="sm" c="dimmed">
            Chưa có đánh giá.
          </Text>
        ) : (
          <>
            <Text size="xl" fw={600} mt={6}>
              {formatAvg(aggregate.avgOverall)}/10
            </Text>
            <Text size="sm" c="dimmed">
              {aggregate.ratingCount} lượt
            </Text>
            <Group gap="lg" mt="sm">
              <Text size="sm">
                Thanh toán đúng {formatAvg(aggregate.avgPayment)}
              </Text>
              <Text size="sm">
                Xử lý tình huống {formatAvg(aggregate.avgHandling)}
              </Text>
              <Text size="sm">
                Giao tiếp {formatAvg(aggregate.avgCommunication)}
              </Text>
            </Group>
          </>
        )}
      </Paper>
      <Paper
        p="lg"
        radius={radius.lg}
        style={{ border: `1px solid ${colors.border}` }}
      >
        <Text size="sm" c="dimmed" mb="md">
          Nhận xét (kèm tên Owner)
        </Text>
        {!comments.length ? (
          <Text size="sm" c="dimmed">
            Chưa có nhận xét.
          </Text>
        ) : (
          <Stack gap="sm">
            {comments.map((c, i) => (
              <div key={`${c.createdAt}-${i}`}>
                <Text size="sm" fw={500}>
                  {c.ownerName} · {formatAvg(c.overall)}/10
                </Text>
                <Text size="sm">{c.comment}</Text>
                <Text size="xs" c="dimmed">
                  {new Date(c.createdAt).toLocaleString('vi-VN')}
                </Text>
              </div>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
