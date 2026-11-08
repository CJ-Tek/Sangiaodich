'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { LinkButton } from '@/components/ui/LinkButton';
import { colors, radius } from '@/config/design-tokens';
import type { SaleAssetDiscountProgress } from '@/lib/engines/sale-pricing';

const PAGE_SIZE = 8;

type Filter = 'all' | 'discounted' | 'zero';

export function SaleDiscountAssetList({
  assets,
}: {
  assets: SaleAssetDiscountProgress[];
}) {
  const t = useTranslations('sale.membership');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (filter === 'discounted' && a.discountPercent <= 0) return false;
      if (filter === 'zero' && a.discountPercent > 0) return false;
      if (!q) return true;
      const loc = (a.assetLocation || '').toLowerCase();
      return a.assetTitle.toLowerCase().includes(q) || loc.includes(q);
    });
  }, [assets, filter, query]);

  const visible = filtered.slice(0, shown);
  const selected = assets.find((a) => a.assetId === openId) ?? null;
  const discounted = assets.filter((a) => a.discountPercent > 0).length;

  return (
    <Stack gap="sm">
      <Group gap="xs" wrap="wrap">
        <TextInput
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            setShown(PAGE_SIZE);
          }}
          style={{ flex: 1, minWidth: 160 }}
        />
        <SegmentedControl
          size="sm"
          value={filter}
          onChange={(v) => {
            setFilter(v as Filter);
            setShown(PAGE_SIZE);
          }}
          data={[
            { label: t('filterAll', { count: assets.length }), value: 'all' },
            {
              label: t('filterDiscounted', { count: discounted }),
              value: 'discounted',
            },
            {
              label: t('filterNone', { count: assets.length - discounted }),
              value: 'zero',
            },
          ]}
        />
      </Group>
      {!filtered.length ? (
        <Text size="sm" c="dimmed">
          {t('noMatch')}
        </Text>
      ) : (
        <Stack gap={6}>
          {visible.map((a) => (
            <UnstyledButton
              key={a.assetId}
              onClick={() => setOpenId(a.assetId)}
              p="sm"
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                width: '100%',
              }}
            >
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <div style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {a.assetTitle}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('times', { count: a.checkoutCount })}
                    {a.assetLocation ? ` · ${a.assetLocation}` : ''}
                  </Text>
                </div>
                <Badge
                  color={a.discountPercent > 0 ? 'vbnbGreen' : 'gray'}
                  variant="light"
                >
                  {a.tierLabel || '0%'}
                </Badge>
              </Group>
            </UnstyledButton>
          ))}
        </Stack>
      )}
      {filtered.length > shown ? (
        <Button
          variant="subtle"
          color="vbnbGreen"
          size="sm"
          w="fit-content"
          onClick={() => setShown((n) => n + PAGE_SIZE)}
        >
          {t('showMore', { count: filtered.length - shown })}
        </Button>
      ) : null}

      <Modal
        opened={Boolean(selected)}
        onClose={() => setOpenId(null)}
        title={selected?.assetTitle || t('assetLabel')}
        centered
      >
        {selected ? (
          <Stack gap="sm">
            {selected.assetLocation ? (
              <Text size="sm" c="dimmed">
                {selected.assetLocation}
              </Text>
            ) : null}
            <Text size="sm">
              {t('checkoutTier', {
                count: selected.checkoutCount,
                tier: selected.tierLabel ?? '0%',
              })}
            </Text>
            <Text size="sm" c="dimmed">
              {selected.nextThreshold != null
                ? t('nextDiscount', {
                    threshold: selected.nextThreshold,
                    percent: selected.nextPercent ?? 0,
                  })
                : t('maxDiscount')}
            </Text>
            {selected.assetSlug ? (
              <LinkButton
                href={`/sale/marketplace/${selected.assetSlug}`}
                color="vbnbGreen"
                size="sm"
              >
                {t('viewOnMarketplace')}
              </LinkButton>
            ) : null}
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}
