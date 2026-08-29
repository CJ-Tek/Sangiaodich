'use client';

import { Button, Group, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';

export function AdminAssetActions({ assetId }: { assetId: string }) {
  const t = useTranslations('admin.assets');
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function act(status: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'review_asset', assetId, status, reason }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({ color: 'red', message: json.error.message });
      } else {
        notifications.show({
          color: 'vbnbGreen',
          message: t('updatedStatus', { status }),
        });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Textarea
        label={t('reasonLabel')}
        value={reason}
        onChange={(e) => setReason(e.currentTarget.value)}
        mb="sm"
      />
      <Group>
        <Button color="vbnbGreen" loading={loading} onClick={() => act('ACTIVE')}>
          {t('approve')}
        </Button>
        <Button color="red" variant="light" loading={loading} onClick={() => act('REJECTED')}>
          {t('reject')}
        </Button>
        <Button color="gray" variant="outline" loading={loading} onClick={() => act('SUSPENDED')}>
          {t('suspend')}
        </Button>
      </Group>
    </div>
  );
}
