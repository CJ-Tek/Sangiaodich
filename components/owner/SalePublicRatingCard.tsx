'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
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

export function SalePublicRatingCard({
  aggregate,
  comments,
}: {
  aggregate: SaleRatingAggregate | null;
  comments: SaleRatingComment[];
}) {
  const [open, setOpen] = useState(false);
  const hasRatings = Boolean(aggregate && aggregate.ratingCount > 0);

  if (!hasRatings || !aggregate) {
    return (
      <Text size="xs" c="dimmed">
        Chưa có đánh giá từ Owner.
      </Text>
    );
  }

  return (
    <>
      <UnstyledButton onClick={() => setOpen(true)}>
        <Badge color="vbnbGreen" variant="light" size="sm">
          {formatAvg(aggregate.avgOverall)}/10 · {aggregate.ratingCount} lượt
        </Badge>
      </UnstyledButton>
      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Đánh giá từ Owner"
        centered
      >
        <Stack gap="md">
          <div>
            <Text size="xl" fw={600}>
              {formatAvg(aggregate.avgOverall)}/10
            </Text>
            <Text size="sm" c="dimmed">
              {aggregate.ratingCount} lượt · công khai mọi Owner
            </Text>
          </div>
          <Group gap="lg">
            <Text size="sm">Thanh toán {formatAvg(aggregate.avgPayment)}</Text>
            <Text size="sm">Xử lý {formatAvg(aggregate.avgHandling)}</Text>
            <Text size="sm">
              Giao tiếp {formatAvg(aggregate.avgCommunication)}
            </Text>
          </Group>
          {comments.length ? (
            <Stack gap="sm">
              {comments.map((c, i) => (
                <div
                  key={`${c.createdAt}-${i}`}
                  style={{
                    borderTop: `1px solid ${colors.border}`,
                    paddingTop: 8,
                    borderRadius: radius.sm,
                  }}
                >
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
          ) : (
            <Text size="sm" c="dimmed">
              Chưa có nhận xét.
            </Text>
          )}
          <Button variant="default" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
