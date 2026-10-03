'use client';

import { SegmentedControl } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { UiMode } from '@/lib/engines/ui-mode';
import { useRouter } from '@/lib/i18n/navigation';

export function UiModeToggle({ mode }: { mode: UiMode }) {
  const t = useTranslations('common.uiMode');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const options: { value: UiMode; label: string }[] = [
    { value: 'simple', label: t('simple') },
    { value: 'expert', label: t('advanced') },
  ];

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
          message: json.error?.message || t('switchFailed'),
        });
        return;
      }
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
      data={options}
      disabled={loading}
      aria-label={t('label')}
      onChange={(value) => void apply(value as UiMode)}
    />
  );
}
