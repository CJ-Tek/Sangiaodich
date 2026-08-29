'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useTranslations } from 'next-intl';
import { OwnerAssetReviewControls } from '@/components/owner/OwnerAssetReviewControls';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { colors, radius } from '@/config/design-tokens';
import { useFormat } from '@/lib/i18n/use-format';

const PAGE_SIZE = 10;

export type OwnerAssetListRow = {
  id: string;
  title: string;
  status: string;
  location: string | null;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  costWeekday: number;
  costWeekend: number;
  discountRules: {
    minCheckedOutCount: number;
    costDiscountPercent: number;
  }[];
};

type Filter = 'all' | 'with' | 'without';

export function OwnerAssetsList({
  rows,
  truncated,
}: {
  rows: OwnerAssetListRow[];
  truncated?: boolean;
}) {
  const t = useTranslations('owner.assets');
  const tPropertyTypes = useTranslations('propertyTypes');
  const { formatNumber } = useFormat();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);

  const withDiscount = rows.filter((r) => r.discountRules.length > 0).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const has = r.discountRules.length > 0;
      if (filter === 'with' && !has) return false;
      if (filter === 'without' && has) return false;
      if (!q) return true;
      const loc = (r.location || '').toLowerCase();
      return r.title.toLowerCase().includes(q) || loc.includes(q);
    });
  }, [rows, filter, query]);

  const visible = filtered.slice(0, shown);
  const selected = rows.find((r) => r.id === openId) ?? null;
  const q = query.trim();

  return (
    <Stack gap="md">
      <Group gap="xs" wrap="wrap">
        <TextInput
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            setShown(PAGE_SIZE);
          }}
          style={{ flex: 1, minWidth: 200 }}
        />
        <SegmentedControl
          size="xs"
          value={filter}
          onChange={(v) => {
            setFilter(v as Filter);
            setShown(PAGE_SIZE);
          }}
          data={[
            { label: t('filterAll', { count: rows.length }), value: 'all' },
            { label: t('filterWithDiscount', { count: withDiscount }), value: 'with' },
            {
              label: t('filterNoDiscount', {
                count: rows.length - withDiscount,
              }),
              value: 'without',
            },
          ]}
        />
      </Group>

      {!filtered.length ? (
        <EmptyState
          title={t('noMatch')}
          description={
            q || filter !== 'all'
              ? t('noMatchHint')
              : t('emptyCreateHint')
          }
        />
      ) : (
        <Stack gap="sm">
          {truncated ? (
            <Text size="sm" c="dimmed">
              {t('showingRecent', { count: rows.length })}
            </Text>
          ) : null}
          {visible.map((a) => {
            const has = a.discountRules.length > 0;
            return (
              <Paper
                key={a.id}
                p="lg"
                radius={radius.lg}
                style={{ border: `1px solid ${colors.border}` }}
              >
                <OwnerAssetReviewControls
                  assetId={a.id}
                  status={a.status}
                  extraActions={
                    <Button
                      variant="light"
                      color="vbnbGreen"
                      size="compact-sm"
                      onClick={() => setOpenId(a.id)}
                    >
                      {has
                        ? t('discountCount', { count: a.discountRules.length })
                        : t('discount')}
                    </Button>
                  }
                >
                  <div>
                    <Text fw={600}>{a.title}</Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      {a.propertyType === 'APARTMENT'
                        ? tPropertyTypes('APARTMENT')
                        : tPropertyTypes('VILLA')}
                      {a.location ? ` · ${a.location}` : ''}
                      {` · ${t('bedroomsBathrooms', {
                        bedrooms: a.bedrooms,
                        bathrooms: a.bathrooms,
                      })}`}
                    </Text>
                    <Text size="sm" c="dimmed" mt={6}>
                      {t('costWd')} {formatNumber(a.costWeekday)} · {t('costWe')}{' '}
                      {formatNumber(a.costWeekend)}
                    </Text>
                  </div>
                </OwnerAssetReviewControls>
              </Paper>
            );
          })}
          {filtered.length > shown ? (
            <Button
              variant="subtle"
              color="vbnbGreen"
              size="xs"
              w="fit-content"
              onClick={() => setShown((n) => n + PAGE_SIZE)}
            >
              {t('showMore', { count: filtered.length - shown })}
            </Button>
          ) : null}
        </Stack>
      )}

      <Modal
        opened={Boolean(selected)}
        onClose={() => setOpenId(null)}
        title={selected?.title || t('discount')}
        centered
      >
        {selected ? (
          <Stack gap="sm">
            {selected.location ? (
              <Text size="sm" c="dimmed">
                {selected.location}
              </Text>
            ) : null}
            {selected.discountRules.length ? (
              selected.discountRules.map((r) => (
                <Text key={r.minCheckedOutCount} size="sm">
                  {t('tierRule', {
                    count: r.minCheckedOutCount,
                    percent: r.costDiscountPercent,
                  })}
                </Text>
              ))
            ) : (
              <Text size="sm" c="dimmed">
                {t('noDiscount')}
              </Text>
            )}
            <LinkButton
              href={`/owner/assets/${selected.id}/edit`}
              color="vbnbGreen"
              size="sm"
            >
              {t('editOnSetup')}
            </LinkButton>
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}
