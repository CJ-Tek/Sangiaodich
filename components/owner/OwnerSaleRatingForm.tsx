'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Group,
  NumberInput,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import type { SaleRatingRecord } from '@/lib/engines/sale-ratings';

export function OwnerSaleRatingForm({
  bookingId,
  rating,
}: {
  bookingId: string;
  rating: SaleRatingRecord | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scorePayment, setScorePayment] = useState(8);
  const [scoreHandling, setScoreHandling] = useState(8);
  const [scoreCommunication, setScoreCommunication] = useState(8);
  const [comment, setComment] = useState('');

  async function save() {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/sale-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          scorePayment,
          scoreHandling,
          scoreCommunication,
          comment,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || 'Không lưu được đánh giá',
        });
      } else {
        notifications.show({
          color: 'vbnbGreen',
          message: 'Đã gửi đánh giá',
        });
        router.refresh();
      }
    } catch {
      notifications.show({
        color: 'red',
        message: 'Không kết nối được máy chủ. Thử lại.',
      });
    } finally {
      setLoading(false);
    }
  }

  if (rating) {
    return (
      <Stack gap="xs" mt="md">
        <Group gap="xs">
          <Text size="sm" fw={600}>
            Đánh giá Sale
          </Text>
          <Badge color="gray" variant="light">
            Đã khóa
          </Badge>
        </Group>
        <Text size="sm">
          Thanh toán {rating.scorePayment} · Xử lý {rating.scoreHandling} · Giao
          tiếp {rating.scoreCommunication} · TB {rating.overall}/10
        </Text>
        {rating.comment ? (
          <Text size="sm" c="dimmed">
            {rating.comment}
          </Text>
        ) : null}
        <Text size="xs" c="dimmed">
          Đã gửi — không sửa được.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="sm" mt="md">
      <Group gap="xs">
        <Text size="sm" fw={600}>
          Đánh giá Sale
        </Text>
        <Badge color="yellow" variant="light">
          Chưa đánh giá
        </Badge>
      </Group>
      <Group grow align="flex-start">
        <NumberInput
          label="Thanh toán đúng"
          min={1}
          max={10}
          clampBehavior="strict"
          value={scorePayment}
          onChange={(v) => setScorePayment(Number(v) || 1)}
        />
        <NumberInput
          label="Xử lý tình huống"
          min={1}
          max={10}
          clampBehavior="strict"
          value={scoreHandling}
          onChange={(v) => setScoreHandling(Number(v) || 1)}
        />
        <NumberInput
          label="Giao tiếp"
          min={1}
          max={10}
          clampBehavior="strict"
          value={scoreCommunication}
          onChange={(v) => setScoreCommunication(Number(v) || 1)}
        />
      </Group>
      <Textarea
        label="Nhận xét (công khai cho mọi Owner, kèm tên bạn)"
        minRows={2}
        value={comment}
        onChange={(e) => setComment(e.currentTarget.value)}
        maxLength={1000}
      />
      <Button
        color="vbnbGreen"
        size="sm"
        w="fit-content"
        loading={loading}
        onClick={save}
      >
        Gửi đánh giá
      </Button>
    </Stack>
  );
}
