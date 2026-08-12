'use client';

import { Button, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  formatVnd,
  planDurationLabel,
  type SubscriptionPlan,
} from '@/lib/engines/subscription-plans';

export function MarkPaidButton({
  profileId,
  plans,
}: {
  profileId: string;
  plans: SubscriptionPlan[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function mark(planId: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_paid',
          profileId,
          planId,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({ color: 'red', message: json.error.message });
      } else {
        notifications.show({
          color: 'vbnbGreen',
          message: 'Đã kích hoạt / gia hạn theo gói',
        });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!plans.length) {
    return (
      <Button size="xs" color="vbnbGreen" disabled>
        Chưa có gói
      </Button>
    );
  }

  return (
    <Menu shadow="md" width={220}>
      <Menu.Target>
        <Button size="xs" color="vbnbGreen" loading={loading}>
          Mark paid
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Chọn gói kích hoạt</Menu.Label>
        {plans.map((p) => (
          <Menu.Item key={p.id} onClick={() => mark(p.id)}>
            {p.label || planDurationLabel(p.months)} — {formatVnd(p.amount)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
