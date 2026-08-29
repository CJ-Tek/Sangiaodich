'use client';

import {
  Box,
  Button,
  Group,
  SegmentedControl,
  Stack,
  TextInput,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { colors, radius } from '@/config/design-tokens';
import type { AdminAssetFilterStatus } from '@/components/admin/admin-asset-filters';

export function AdminAssetFilters({
  q,
  status,
  counts,
}: {
  q: string;
  status: AdminAssetFilterStatus;
  counts: Record<AdminAssetFilterStatus, number>;
}) {
  const t = useTranslations('admin.assets');
  const router = useRouter();
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  function push(nextStatus: AdminAssetFilterStatus, nextQ: string) {
    const params = new URLSearchParams();
    if (nextStatus !== 'pending') params.set('status', nextStatus);
    const trimmed = nextQ.trim();
    if (trimmed) params.set('q', trimmed);
    const qs = params.toString();
    router.push(qs ? `/admin/assets?${qs}` : '/admin/assets');
  }

  return (
    <Box
      component="form"
      mb="md"
      onSubmit={(e) => {
        e.preventDefault();
        push(status, query);
      }}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: 16,
      }}
    >
      <Stack gap="sm">
        <Group align="flex-end" gap="sm" wrap="wrap">
          <TextInput
            name="q"
            label={t('searchLabel')}
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Button type="submit" color="vbnbGreen">
            {t('searchButton')}
          </Button>
        </Group>
        <div
          style={{
            overflowX: 'auto',
            maxWidth: '100%',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <SegmentedControl
            color="vbnbGreen"
            value={status}
            data={[
              { value: 'all', label: `${t('filterAll')} (${counts.all})` },
              {
                value: 'pending',
                label: `${t('filterPending')} (${counts.pending})`,
              },
              {
                value: 'active',
                label: `${t('filterActive')} (${counts.active})`,
              },
              {
                value: 'reject',
                label: `${t('filterReject')} (${counts.reject})`,
              },
              {
                value: 'suspend',
                label: `${t('filterSuspend')} (${counts.suspend})`,
              },
            ]}
            styles={{
              root: { width: 'max-content' },
              control: { flexShrink: 0 },
              label: { whiteSpace: 'nowrap' },
            }}
            onChange={(next) =>
              push(next as AdminAssetFilterStatus, query)
            }
          />
        </div>
      </Stack>
    </Box>
  );
}
