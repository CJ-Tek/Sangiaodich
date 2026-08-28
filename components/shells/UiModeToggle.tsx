'use client';

import { SegmentedControl } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { UiMode } from '@/lib/engines/ui-mode';

const OPTIONS: { value: UiMode; label: string }[] = [
  { value: 'simple', label: 'Đơn giản' },
  { value: 'expert', label: 'Nâng cao' },
];

export function UiModeToggle({
  mode,
  homeHref,
}: {
  mode: UiMode;
  /** Where to land after switching. */
  homeHref: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function apply(next: UiMode) {
    if (next === mode || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/profile/ui-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uiMode: next }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || 'Không đổi được chế độ',
        });
        return;
      }
      router.push(homeHref);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <SegmentedControl
      size="xs"
      color="vbnbGreen"
      value={mode}
      data={OPTIONS}
      disabled={loading}
      aria-label="Chế độ giao diện"
      onChange={(value) => void apply(value as UiMode)}
    />
  );
}
